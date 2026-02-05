
import React, { useState, useCallback, useMemo, useContext, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ProcessingView } from './components/ProcessingView';
import { SettingsProvider, SettingsContext } from './contexts/SettingsContext';
import { classifyDocument, performExtraction } from './services/geminiService';
import type { UploadedFile, ProcessingState, ExtractedData, Template, Preset, BatchResult } from './types';
import { MAX_FILE_SIZE, SUPPORTED_FILE_TYPES } from './constants';
import { Greeting } from './components/Greeting';
import { WorkspaceLayout } from './components/layout/WorkspaceLayout';
import { FilePreview } from './components/FilePreview';
import { RecentExtractions } from './components/home/RecentExtractions';
import { StatsBar } from './components/home/StatsBar';
import { ClassificationConfirmationModal } from './components/ui/ClassificationConfirmationModal';
import { BatchSummaryModal } from './components/ui/BatchSummaryModal';
import { GuidanceRail } from './components/home/GuidanceRail';
import { AssistantPreview } from './components/home/AssistantPreview';
import { HowItWorks } from './components/home/HowItWorks';
import { DocTypes } from './components/home/DocTypes';
import { ArrowUpTrayIcon } from './components/icons/ArrowUpTrayIcon';
import { saveSession, loadSession, clearSession } from './utils/sessionManager';
import { Notification } from './components/ui/Notification';
import { Portal } from './components/ui/Portal';
import { useSidebar } from './hooks/useSidebar';

const rotatingTips = [
    "High contrast mode helps identify faint text in scanned docs.",
    "Drag multiple images to process them as a single document batch.",
    "Use custom templates to enforce specific data structures.",
    "Assistive chat can explain why specific values were extracted."
];

// Increased threshold to ensure human verification for ambiguous docs
const CLASSIFICATION_CONFIDENCE_THRESHOLD = 80;

const PerspectiveGrid = () => {
    return (
        <div className="absolute bottom-0 left-0 right-0 h-[45vh] z-0 pointer-events-none select-none overflow-hidden opacity-60 dark:opacity-40">
            {/* Soft Mask to blend into background */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-transparent via-transparent to-[var(--glass-surface)]" style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)' }}></div>
            
            {/* The Grid Plane */}
            <div className="absolute inset-0 flex items-end justify-center" style={{ perspective: '800px' }}>
                <div 
                    className="w-[300%] h-[150%] origin-bottom animate-grid-flow"
                    style={{
                        transform: 'rotateX(60deg)',
                        backgroundImage: `
                            linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px)
                        `,
                        backgroundSize: '60px 60px',
                        maskImage: 'linear-gradient(to top, black 10%, transparent 80%)',
                        WebkitMaskImage: 'linear-gradient(to top, black 10%, transparent 80%)'
                    }}
                />
            </div>
            
            <style>{`
                @keyframes grid-flow {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 60px; }
                }
                .animate-grid-flow {
                    animation: grid-flow 3s linear infinite;
                }
            `}</style>
        </div>
    );
};

function App() {
  const { settings, history, addToHistory, clearHistory } = useContext(SettingsContext);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [description, setDescription] = useState<string>('');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [stats, setStats] = useState({ docsCount: 0, fieldsCount: 0 });
  const [tipIndex, setTipIndex] = useState(0);
  const [classificationResult, setClassificationResult] = useState<{ docType: string; confidence: number; } | null>(null);

  // Global Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Batch processing state
  const [currentlyProcessingFileIndex, setCurrentlyProcessingFileIndex] = useState<number | null>(null);
  const [batchResults, setBatchResults] = useState<BatchResult[] | null>(null);

  // Restoration State
  const [restoreNotification, setRestoreNotification] = useState<boolean>(false);
  const [pendingSession, setPendingSession] = useState<any>(null);

  // Sidebar State
  const { isLeftOpen, toggleLeftSidebar, isRightOpen, toggleRightSidebar } = useSidebar();

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % rotatingTips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // --- Auto-Save & Restoration Logic ---
  useEffect(() => {
      const checkSession = async () => {
          const session = await loadSession();
          if (session && (session.files.length > 0 || session.description.length > 5)) {
              setPendingSession(session);
              setRestoreNotification(true);
          }
      };
      checkSession();
  }, []);

  useEffect(() => {
      if (processingState === 'idle' && files.length === 0 && !description) {
          return;
      }
      const timer = setTimeout(() => {
          saveSession(files, extractedData, description, activePresetId, processingState);
      }, 1000);
      return () => clearTimeout(timer);
  }, [files, extractedData, description, activePresetId, processingState]);

  const handleRestoreSession = () => {
      if (pendingSession) {
          setFiles(pendingSession.files);
          setExtractedData(pendingSession.extractedData);
          setDescription(pendingSession.description);
          setActivePresetId(pendingSession.activePreset); // Note: sessionManager needs update to match activePresetId
          setProcessingState(pendingSession.processingState);
          setRestoreNotification(false);
          setPendingSession(null);
      }
  };

  const handleDismissRestore = () => {
      setRestoreNotification(false);
      setPendingSession(null);
      clearSession();
  };

  const handleFileChange = useCallback((selectedFiles: File[]) => {
    setError(null);
    const newFiles: UploadedFile[] = Array.from(selectedFiles)
      .filter(file => {
        if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
          setError(`File type not supported: ${file.name}`);
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`File size exceeds 10MB: ${file.name}`);
          return false;
        }
        return true;
      })
      .map(file => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      }));

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      setProcessingState('files_selected');
    }
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
        if (e.clipboardData && e.clipboardData.files.length > 0) {
            e.preventDefault();
            const pastedFiles = Array.from(e.clipboardData.files);
            handleFileChange(pastedFiles);
        }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFileChange]);

  const handleGlobalDragEnter = useCallback((e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation();
      dragCounter.current += 1;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true);
  }, []);

  const handleGlobalDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation();
      dragCounter.current -= 1;
      if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleGlobalDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation();
  }, []);

  const handleGlobalDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFileChange(Array.from(e.dataTransfer.files));
  }, [handleFileChange]);

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if(fileToRemove) URL.revokeObjectURL(fileToRemove.preview);
      const newFiles = prev.filter(f => f.id !== fileId);
      if (newFiles.length === 0) {
        setProcessingState('idle');
        setSelectedTemplate(null);
      }
      return newFiles;
    });
  }, []);
  
  const continueSingleFileExtraction = async (confirmedDocType: string, customPrompt?: string) => {
    setProcessingState('processing');
    setClassificationResult(null);
    try {
      const finalDescription = customPrompt || description;
      const data = await performExtraction(files, confirmedDocType, finalDescription, settings.documentLanguage);
      setExtractedData(data);
      setProcessingState('results');
      
      const fieldsCount = Array.isArray(data.data) ? (data.data as Record<string, any>[]).reduce((acc: number, item) => acc + Object.keys(item).length, 0) : Object.keys(data.data).length;
      setStats(prev => ({ docsCount: prev.docsCount + 1, fieldsCount: prev.fieldsCount + fieldsCount }));
      addToHistory({ id: crypto.randomUUID(), fileNames: files.map(f => f.file.name), docType: data.documentType, timestamp: new Date().toISOString(), data });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred during extraction.');
      setProcessingState('error');
    }
  };

  const startPipeline = async () => {
    if (files.length === 0) return;
    setError(null);
    
    // Determine Doc Type based on preset
    let targetDocType: string | undefined;
    if (activePresetId) {
        const preset = settings.presets.find(p => p.id === activePresetId);
        targetDocType = preset ? preset.docType : undefined;
    }

    if (files.length === 1) {
        setProcessingState('processing');
        try {
            // Use preset docType if available, otherwise classify
            const result = targetDocType 
                ? { docType: targetDocType, confidence: 100 } 
                : await classifyDocument(files, settings.documentLanguage);

            if (result.confidence < CLASSIFICATION_CONFIDENCE_THRESHOLD && !activePresetId) {
                setClassificationResult(result);
                setProcessingState('awaiting_classification');
            } else {
                await continueSingleFileExtraction(result.docType);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An error occurred during classification.');
            setProcessingState('error');
        }
    } else {
        setProcessingState('processing');
        setBatchResults([]);
        let cumulativeFields = 0;

        for (let i = 0; i < files.length; i++) {
            setCurrentlyProcessingFileIndex(i);
            const currentFile = files[i];
            try {
                // For batch, if no preset, we classify each. If preset, we enforce it.
                const docType = targetDocType || (await classifyDocument([currentFile], settings.documentLanguage)).docType;
                const data = await performExtraction([currentFile], docType, description, settings.documentLanguage);
                setBatchResults(prev => [...(prev || []), { file: currentFile, status: 'success', data }]);
                const fieldsCount = Array.isArray(data.data) ? (data.data as Record<string, any>[]).reduce((acc: number, item) => acc + Object.keys(item).length, 0) : Object.keys(data.data).length;
                cumulativeFields += fieldsCount;
                addToHistory({ id: crypto.randomUUID(), fileNames: [currentFile.file.name], docType: data.documentType, timestamp: new Date().toISOString(), data });
            } catch (e) {
                const errorMsg = e instanceof Error ? e.message : 'Unknown processing error.';
                setBatchResults(prev => [...(prev || []), { file: currentFile, status: 'error', error: errorMsg }]);
            }
        }
        
        setStats(prev => ({ docsCount: prev.docsCount + files.length, fieldsCount: prev.fieldsCount + cumulativeFields }));
        setCurrentlyProcessingFileIndex(null);
        setProcessingState('batch_complete');
    }
  };

  const handleNewUpload = useCallback(() => {
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setExtractedData(null);
    setError(null);
    setSelectedTemplate(null);
    setProcessingState('idle');
    setDescription('');
    setActivePresetId(null);
    setClassificationResult(null);
    setBatchResults(null);
    setCurrentlyProcessingFileIndex(null);
    clearSession();
  }, [files]);
  
  const handleReprocess = useCallback((editedData: ExtractedData) => {
     setProcessingState('processing');
     setError(null);
     performExtraction(files, editedData.documentType, description, settings.documentLanguage, editedData)
        .then(data => {
            setExtractedData(data);
            setProcessingState('results');
        })
        .catch(e => {
            setError(e instanceof Error ? e.message : 'An error occurred during re-processing.');
            setProcessingState('error');
        });
  }, [files, description, settings.documentLanguage]);

  const handleSelectHistoryItem = (item: any) => {
    setExtractedData(item.data);
    const placeholderFiles: UploadedFile[] = item.fileNames.map((name: string) => ({
      id: crypto.randomUUID(),
      file: new File([], name, { type: 'application/octet-stream' }),
      preview: '', 
    }));
    setFiles(placeholderFiles);
    setProcessingState('results');
  };

  const handleSelectBatchResult = (data: ExtractedData) => {
    const associatedFile = batchResults?.find(r => r.data === data)?.file;
    if (associatedFile) setFiles([associatedFile]);
    setExtractedData(data);
    setBatchResults(null);
    setProcessingState('results');
  };

  const handlePresetSelect = (presetId: string, presetPrompt: string) => {
    if (activePresetId === presetId) {
        setActivePresetId(null);
        setDescription('');
    } else {
        setActivePresetId(presetId);
        setDescription(presetPrompt);
    }
  };
  
  const activePresetName = useMemo(() => {
      return settings.presets.find(p => p.id === activePresetId)?.name || null;
  }, [settings.presets, activePresetId]);

  const renderContent = useMemo(() => {
    const lastUsedPreset = history.length > 0 ? history[0].docType : null;
    
    switch (processingState) {
      case 'idle':
        return (
          <div className="flex flex-col lg:flex-row items-start justify-center gap-8 w-full max-w-[1400px] mx-auto pt-8 relative">
            <GuidanceRail tip={rotatingTips[tipIndex]} lastUsedPreset={lastUsedPreset} />
            
            <div className="flex-1 flex flex-col items-center px-4 w-full relative z-10">
               {/* Ambient Glow Background for Greeting & Upload Area */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] max-w-[1200px] h-[700px] -z-10 pointer-events-none select-none">
                    {/* Pale Blue Blob */}
                    <div className="absolute top-[-10%] left-[15%] w-[55%] h-[55%] bg-[#E0F2FE] dark:bg-blue-900/10 rounded-full blur-[100px] animate-float-1 opacity-50 mix-blend-multiply dark:mix-blend-screen" />
                    {/* Muted Lavender Blob */}
                    <div className="absolute top-[10%] right-[10%] w-[50%] h-[50%] bg-[#F3E8FF] dark:bg-purple-900/10 rounded-full blur-[100px] animate-float-2 opacity-50 mix-blend-multiply dark:mix-blend-screen" />
                    {/* Soft Cyan Blob */}
                    <div className="absolute top-[25%] left-[30%] w-[45%] h-[40%] bg-[#ECFEFF] dark:bg-cyan-900/10 rounded-full blur-[100px] animate-float-3 opacity-50 mix-blend-multiply dark:mix-blend-screen" />
               </div>

              <Greeting />
              <UploadSection 
                onFileChange={handleFileChange} 
                selectedTemplate={selectedTemplate} 
                onTemplateSelect={setSelectedTemplate} 
                description={description} 
                setDescription={setDescription} 
                activePresetId={activePresetId} 
                onPresetSelect={handlePresetSelect} 
              />
              <HowItWorks />
              <DocTypes presets={settings.presets} />
              <StatsBar docsProcessed={stats.docsCount} fieldsExtracted={stats.fieldsCount} />
              <RecentExtractions 
                history={history} 
                onSelectItem={handleSelectHistoryItem} 
                onClearHistory={clearHistory}
              />
            </div>

            <AssistantPreview />
          </div>
        );
      case 'files_selected':
        return (
          <div className="animate-slide-in flex flex-col items-center w-full max-w-4xl mx-auto pt-10 relative z-10 px-4">
            {/* Ambient Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[1000px] -z-10 pointer-events-none select-none opacity-50">
                <div className="absolute top-[5%] left-[20%] w-[600px] h-[600px] bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-float-1" />
                <div className="absolute top-[15%] right-[15%] w-[500px] h-[500px] bg-purple-100/30 dark:bg-purple-900/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-float-2" />
            </div>

            <FilePreview files={files} onRemoveFile={handleRemoveFile} onAddFiles={handleFileChange} />
            
            <div className="w-full mt-6 p-8 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[2.5rem] shadow-sm transition-all hover:shadow-md hover:bg-white/70 dark:hover:bg-zinc-900/50">
                <div className="mb-6 pl-1">
                    <label className="block text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight font-display">Refine Extraction Focus</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Tell us what matters most in this document.</p>
                </div>
                
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity blur duration-500"></div>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        placeholder="e.g. Extract the invoice number, total amount, and line items table. Ignore the footer text." 
                        className="relative w-full h-40 p-5 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none font-medium text-gray-700 dark:text-gray-200 transition-all resize-none shadow-inner placeholder:text-gray-400/80 text-[15px] leading-relaxed" 
                    />
                </div>
            </div>

            <div className="w-full mt-10 text-center pb-16">
                <button 
                    onClick={startPipeline} 
                    className="group relative inline-flex items-center justify-center gap-3 bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] font-bold py-4 px-12 rounded-full shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 text-base font-display overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        Extract Data from {files.length} {files.length > 1 ? 'Files' : 'File'}
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                </button>
            </div>
          </div>
        );
      case 'processing':
        return <div className="flex justify-center items-center h-[60vh]"><ProcessingView files={files} currentIndex={currentlyProcessingFileIndex} /></div>;
      case 'awaiting_classification':
        return <ClassificationConfirmationModal isOpen={true} suggestedType={classificationResult?.docType || 'Unknown'} confidence={classificationResult?.confidence || 0} presets={settings.presets} onConfirm={continueSingleFileExtraction} onCancel={handleNewUpload} />;
      case 'batch_complete':
        return <BatchSummaryModal isOpen={true} results={batchResults || []} onClose={handleNewUpload} onSelectResult={handleSelectBatchResult} />;
      case 'results':
        return extractedData ? (
            <WorkspaceLayout 
                data={extractedData} 
                files={files} 
                onNewUpload={handleNewUpload} 
                onReprocess={handleReprocess} 
                onAddFiles={handleFileChange} 
                onRemoveFile={handleRemoveFile}
                isLeftSidebarOpen={isLeftOpen}
                onToggleLeftSidebar={toggleLeftSidebar}
                isRightSidebarOpen={isRightOpen}
                onToggleRightSidebar={toggleRightSidebar}
            />
        ) : null;
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
            <div className="text-center p-12 bg-red-50/80 dark:bg-red-900/20 border border-red-100 dark:border-red-500/20 backdrop-blur-xl rounded-3xl max-w-lg mx-auto shadow-xl">
              <h2 className="text-2xl font-bold text-red-700 dark:text-red-300 font-display">Extraction Failed</h2>
              <p className="text-red-600 dark:text-red-400 mt-3 font-medium">{error}</p>
              <button onClick={handleNewUpload} className="mt-8 bg-red-500 text-white font-bold py-3 px-8 rounded-full shadow-md transition-all active:scale-95 font-display hover:bg-red-600">Start Over</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  }, [processingState, files, extractedData, error, selectedTemplate, description, activePresetId, activePresetName, stats, history, classificationResult, batchResults, currentlyProcessingFileIndex, handleFileChange, handleRemoveFile, handleNewUpload, handleReprocess, handleSelectHistoryItem, clearHistory, settings.presets, settings.documentLanguage, tipIndex, isLeftOpen, isRightOpen, toggleLeftSidebar, toggleRightSidebar]);
  
  const isResultsView = processingState === 'results';

  return (
    <div 
        className={`h-screen w-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 overflow-hidden transition-colors duration-300 font-sans text-[var(--text-primary)] ${settings.highContrast ? 'high-contrast' : ''}`}
        onDragEnter={handleGlobalDragEnter} onDragLeave={handleGlobalDragLeave} onDragOver={handleGlobalDragOver} onDrop={handleGlobalDrop}
    >
        {/* The Floating Glass Frame */}
        <div className="relative w-full h-full max-w-[1800px] bg-[var(--glass-surface)] backdrop-blur-3xl rounded-[2.5rem] border border-[var(--glass-border)] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col transition-all duration-500">
            <Header 
                onHomeClick={handleNewUpload} 
            />
            <main className={`flex-1 w-full relative z-20 ${isResultsView ? 'overflow-hidden' : 'overflow-y-auto ios-scroll'}`}>
                {renderContent}
            </main>

            {/* Perspective Data Floor - Only on Home (idle) */}
            {processingState === 'idle' && <PerspectiveGrid />}
        </div>

        {/* Global Drag & Drop Overlay in Portal */}
        {isDragging && (
            <Portal>
                <div className="fixed inset-0 z-[100] bg-white/60 dark:bg-black/60 backdrop-blur-xl flex items-center justify-center pointer-events-none animate-fade-in">
                    <div className="m-8 border-4 border-[#007AFF] border-dashed rounded-[3rem] w-full h-full max-h-[90vh] max-w-[90vw] flex flex-col items-center justify-center p-12 bg-white/40 dark:bg-white/5 shadow-2xl">
                        <div className="p-8 rounded-full bg-[#007AFF]/10 text-[#007AFF] mb-8 animate-bounce">
                            <ArrowUpTrayIcon className="w-20 h-20" />
                        </div>
                        <h2 className="text-4xl font-extrabold text-[#1d1d1f] dark:text-white font-display text-center">
                            Drop to Extract
                        </h2>
                        <p className="mt-4 text-xl text-[#86868b] dark:text-gray-400 font-medium text-center max-w-md">
                            Release your files here to instantly start the AI analysis process.
                        </p>
                    </div>
                </div>
            </Portal>
        )}

        {/* Restore Session Notification */}
        {restoreNotification && (
            <Notification
                message="Previous session found. Restore it?"
                type="info"
                onClose={handleDismissRestore}
                action={{ label: "Restore", onClick: handleRestoreSession }}
            />
        )}
    </div>
  );
}

const AppWrapper: React.FC = () => (
    <SettingsProvider>
        <App />
    </SettingsProvider>
);

export default AppWrapper;

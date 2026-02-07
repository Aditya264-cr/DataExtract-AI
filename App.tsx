
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
import { ThePlatform } from './components/home/ThePlatform';
import { DocTypes } from './components/home/DocTypes';
import { ArrowUpTrayIcon } from './components/icons/ArrowUpTrayIcon';
import { saveSession, loadSession, clearSession } from './utils/sessionManager';
import { Notification } from './components/ui/Notification';
import { Portal } from './components/ui/Portal';
import { useSidebar } from './hooks/useSidebar';
import { useSeason } from './hooks/useSeason';
import { XMarkIcon } from './components/icons/XMarkIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { ListBulletIcon } from './components/icons/ListBulletIcon'; 

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
                            linear-gradient(to right, #000000 1px, transparent 1px),
                            linear-gradient(to bottom, #000000 1px, transparent 1px)
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

  // Sidebar State (Results View)
  const { isLeftOpen, toggleLeftSidebar, isRightOpen, toggleRightSidebar } = useSidebar();
  
  // Home View Responsive Drawer State
  const [showMobileWorkflow, setShowMobileWorkflow] = useState(false);
  const [showMobileFeatures, setShowMobileFeatures] = useState(false);
  
  // Seasonal Hook
  const { blobStyles } = useSeason();

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
          <div className="relative w-full max-w-[1600px] mx-auto pt-4 lg:pt-8">
            {/* Mobile/Tablet Drawer Toggles - Visible only on smaller screens */}
            <div className="xl:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 animate-slide-in pointer-events-none">
                <button 
                    onClick={() => setShowMobileWorkflow(true)} 
                    className="pointer-events-auto bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md text-[#1d1d1f] dark:text-white border border-gray-200 dark:border-zinc-700 shadow-lg hover:shadow-xl px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold transition-all active:scale-95"
                >
                    <ListBulletIcon className="w-4 h-4" /> Workflow
                </button>
                <button 
                    onClick={() => setShowMobileFeatures(true)} 
                    className="pointer-events-auto bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md text-[#1d1d1f] dark:text-white border border-gray-200 dark:border-zinc-700 shadow-lg hover:shadow-xl px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold transition-all active:scale-95"
                >
                    <SparklesIcon className="w-4 h-4" /> Features
                </button>
            </div>

            <div className="flex flex-col xl:flex-row items-start justify-center gap-8 w-full relative">
                {/* Left Panel - Responsive Wrapper */}
                <div 
                    className={`
                        fixed inset-y-0 left-0 z-50 w-80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-r border-gray-200 dark:border-zinc-800 shadow-2xl transform transition-transform duration-300 ease-out
                        ${showMobileWorkflow ? 'translate-x-0' : '-translate-x-full'}
                        xl:translate-x-0 xl:relative xl:block xl:w-64 xl:bg-transparent xl:dark:bg-transparent xl:border-none xl:shadow-none xl:z-auto xl:sticky xl:top-24
                    `}
                >
                    <div className="h-full overflow-y-auto p-6 xl:p-0 xl:pt-2 ios-scroll flex flex-col">
                        <div className="xl:hidden flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white">Workflow</h3>
                            <button onClick={() => setShowMobileWorkflow(false)} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700">
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <GuidanceRail 
                            fileCount={files.length} 
                            hasPreset={!!activePresetId} 
                            hasDescription={description.length > 0} 
                            processingState={processingState} 
                            lastUsedPreset={lastUsedPreset}
                        />
                    </div>
                </div>

                {/* Mobile Backdrop for Left Panel */}
                {showMobileWorkflow && (
                    <div className="xl:hidden fixed inset-0 bg-black/20 z-40 backdrop-blur-sm transition-opacity" onClick={() => setShowMobileWorkflow(false)} />
                )}
                
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col items-center px-4 w-full relative z-10 min-w-0">
                    {/* Ambient Glow Background for Greeting & Upload Area - Redesigned Static Gradient */}
                    <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[120%] max-w-[1000px] h-[800px] -z-10 pointer-events-none select-none overflow-visible">
                            {/* Light Blue - Top Left Center */}
                            <div className="absolute top-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[#7dd3fc]/25 dark:bg-[#0ea5e9]/15 blur-[120px]" />
                            
                            {/* Lavender - Top Right Center */}
                            <div className="absolute top-[15%] right-[20%] w-[45%] h-[45%] rounded-full bg-[#c4b5fd]/25 dark:bg-[#8b5cf6]/15 blur-[120px]" />
                            
                            {/* Cyan - Center/Bottom */}
                            <div className="absolute top-[35%] left-[30%] w-[40%] h-[40%] rounded-full bg-[#67e8f9]/20 dark:bg-[#06b6d4]/10 blur-[100px]" />
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
                    <ThePlatform />
                    <DocTypes presets={settings.presets} />
                    <StatsBar docsProcessed={stats.docsCount} fieldsExtracted={stats.fieldsCount} />
                    <RecentExtractions 
                        history={history} 
                        onSelectItem={handleSelectHistoryItem} 
                        onClearHistory={clearHistory}
                    />
                </div>

                {/* Right Panel - Responsive Wrapper */}
                <div 
                    className={`
                        fixed inset-y-0 right-0 z-50 w-80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-l border-gray-200 dark:border-zinc-800 shadow-2xl transform transition-transform duration-300 ease-out
                        ${showMobileFeatures ? 'translate-x-0' : 'translate-x-full'}
                        xl:translate-x-0 xl:relative xl:block xl:w-72 xl:bg-transparent xl:dark:bg-transparent xl:border-none xl:shadow-none xl:z-auto xl:sticky xl:top-24
                    `}
                >
                    <div className="h-full overflow-y-auto p-6 xl:p-0 xl:pt-2 ios-scroll flex flex-col">
                        <div className="xl:hidden flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white">Capabilities</h3>
                            <button onClick={() => setShowMobileFeatures(false)} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700">
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <AssistantPreview />
                    </div>
                </div>

                {/* Mobile Backdrop for Right Panel */}
                {showMobileFeatures && (
                    <div className="xl:hidden fixed inset-0 bg-black/20 z-40 backdrop-blur-sm transition-opacity" onClick={() => setShowMobileFeatures(false)} />
                )}
            </div>
          </div>
        );
      case 'files_selected':
        return (
          <div className="relative w-full max-w-[1600px] mx-auto pt-4 lg:pt-8">
             {/* Same responsive wrapper logic for files_selected state to ensure guidance is available */}
             <div className="xl:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 animate-slide-in pointer-events-none">
                <button 
                    onClick={() => setShowMobileWorkflow(true)} 
                    className="pointer-events-auto bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md text-[#1d1d1f] dark:text-white border border-gray-200 dark:border-zinc-700 shadow-lg hover:shadow-xl px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold transition-all active:scale-95"
                >
                    <ListBulletIcon className="w-4 h-4" /> Workflow
                </button>
            </div>

            <div className="flex flex-col xl:flex-row items-start justify-center gap-8 w-full relative">
                {/* Left Panel Wrapper */}
                <div 
                    className={`
                        fixed inset-y-0 left-0 z-50 w-80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-r border-gray-200 dark:border-zinc-800 shadow-2xl transform transition-transform duration-300 ease-out
                        ${showMobileWorkflow ? 'translate-x-0' : '-translate-x-full'}
                        xl:translate-x-0 xl:relative xl:block xl:w-64 xl:bg-transparent xl:dark:bg-transparent xl:border-none xl:shadow-none xl:z-auto xl:sticky xl:top-24
                    `}
                >
                    <div className="h-full overflow-y-auto p-6 xl:p-0 xl:pt-2 ios-scroll">
                        <div className="xl:hidden flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white">Workflow</h3>
                            <button onClick={() => setShowMobileWorkflow(false)} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full">
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <GuidanceRail 
                            fileCount={files.length} 
                            hasPreset={!!activePresetId} 
                            hasDescription={description.length > 0} 
                            processingState={processingState}
                        />
                    </div>
                </div>
                
                {/* Backdrop */}
                {showMobileWorkflow && (
                    <div className="xl:hidden fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={() => setShowMobileWorkflow(false)} />
                )}

                <div className="flex-1 flex flex-col items-center px-4 w-full relative z-10 max-w-4xl animate-slide-in min-w-0">
                    {/* Ambient Background - matching new static gradient style */}
                    <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[120%] max-w-[1000px] h-[800px] -z-10 pointer-events-none select-none opacity-60 dark:opacity-40">
                        <div className="absolute top-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[#7dd3fc]/20 dark:bg-[#0ea5e9]/10 blur-[120px]" />
                        <div className="absolute top-[15%] right-[20%] w-[45%] h-[45%] rounded-full bg-[#c4b5fd]/20 dark:bg-[#8b5cf6]/10 blur-[120px]" />
                        <div className="absolute top-[35%] left-[30%] w-[40%] h-[40%] rounded-full bg-[#67e8f9]/15 dark:bg-[#06b6d4]/5 blur-[100px]" />
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
                            className="group relative inline-flex items-center justify-center gap-3 bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] font-bold py-4 px-12 rounded-full shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 text-base font-display overflow-hidden w-full sm:w-auto"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Extract Data from {files.length} {files.length > 1 ? 'Files' : 'File'}
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        </button>
                    </div>
                </div>
                
                {/* Right Placeholder - Hidden on mobile/files_selected, visible on desktop */}
                <div className="hidden xl:flex flex-col w-72 space-y-6 sticky top-24 pr-4 opacity-40 grayscale pointer-events-none">
                     <AssistantPreview />
                </div>
            </div>
          </div>
        );
      case 'processing':
        return <div className="flex justify-center items-center h-[60vh]"><ProcessingView files={files} currentIndex={currentlyProcessingFileIndex} batchResults={batchResults} /></div>;
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
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in px-4">
            <div className="text-center p-8 md:p-12 bg-red-50/80 dark:bg-red-900/20 border border-red-100 dark:border-red-500/20 backdrop-blur-xl rounded-3xl max-w-lg mx-auto shadow-xl w-full">
              <h2 className="text-2xl font-bold text-red-700 dark:text-red-300 font-display">Extraction Failed</h2>
              <p className="text-red-600 dark:text-red-400 mt-3 font-medium break-words">{error}</p>
              <button onClick={handleNewUpload} className="mt-8 bg-red-500 text-white font-bold py-3 px-8 rounded-full shadow-md transition-all active:scale-95 font-display hover:bg-red-600 w-full sm:w-auto">Start Over</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  }, [processingState, files, extractedData, error, selectedTemplate, description, activePresetId, activePresetName, stats, history, classificationResult, batchResults, currentlyProcessingFileIndex, handleFileChange, handleRemoveFile, handleNewUpload, handleReprocess, handleSelectHistoryItem, clearHistory, settings.presets, settings.documentLanguage, isLeftOpen, isRightOpen, toggleLeftSidebar, toggleRightSidebar, blobStyles, showMobileWorkflow, showMobileFeatures]);
  
  const isResultsView = processingState === 'results';

  return (
    <div 
        className={`h-screen w-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 overflow-hidden transition-colors duration-300 font-sans text-[var(--text-primary)]`}
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
                <div className="fixed inset-0 z-[100] bg-white/60 dark:bg-black/60 backdrop-blur-xl flex items-center justify-center pointer-events-none animate-fade-in p-6">
                    <div className="border-4 border-[#007AFF] border-dashed rounded-[3rem] w-full h-full max-w-[1200px] max-h-[800px] flex flex-col items-center justify-center p-8 md:p-12 bg-white/40 dark:bg-white/5 shadow-2xl">
                        <div className="p-8 rounded-full bg-[#007AFF]/10 text-[#007AFF] mb-8 animate-bounce">
                            <ArrowUpTrayIcon className="w-20 h-20" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[#1d1d1f] dark:text-white font-display text-center">
                            Drop to Extract
                        </h2>
                        <p className="mt-4 text-lg md:text-xl text-[#86868b] dark:text-gray-400 font-medium text-center max-w-md">
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

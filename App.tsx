
import React, { useState, useCallback, useMemo, useContext, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ProcessingView } from './components/ProcessingView';
import { SettingsProvider, SettingsContext } from './contexts/SettingsContext';
import { classifyDocument, performExtraction, proposeExtractionSchema } from './services/geminiService';
import { audioAgent } from './services/audioAgent';
import type { UploadedFile, ProcessingState, ExtractedData, Template, Preset, BatchResult } from './types';
import { MAX_FILE_SIZE, SUPPORTED_FILE_TYPES } from './constants';
import { Greeting } from './components/Greeting';
import { WorkspaceLayout } from './components/layout/WorkspaceLayout';
import { FilePreview } from './components/FilePreview';
import { RecentExtractions } from './components/home/RecentExtractions';
import { StatsBar } from './components/home/StatsBar';
import { ClassificationConfirmationModal } from './components/ui/ClassificationConfirmationModal';
import { SchemaProposalModal } from './components/ui/SchemaProposalModal';
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
import { Tooltip } from './components/ui/Tooltip';
import { AppError } from './utils/errorManager';
import { SystemAlert } from './components/ui/SystemAlert';

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
  const [schemaProposal, setSchemaProposal] = useState<{ docType: string; confidence: number; fields: string[] } | null>(null);

  // Critical System State (Segment 7.1)
  const [criticalFailure, setCriticalFailure] = useState<{ type: 'SECURITY' | 'SYSTEM' | 'COMPLIANCE', message: string, id: string } | null>(null);

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
  
  // Focus Mode State
  const [isLeftPanelHovered, setIsLeftPanelHovered] = useState(false);
  
  // Seasonal Hook
  const { blobStyles } = useSeason();

  // --- Error Handler Helper ---
  const handleError = (e: any) => {
      // Segment 7.1: Critical System Error Trigger
      if (e instanceof AppError && (e.type === 'SECURITY' || e.type === 'SYSTEM')) {
          setCriticalFailure({
              type: e.type,
              message: e.message,
              id: crypto.randomUUID()
          });
          setProcessingState('error');
          return;
      }
      
      const msg = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(msg);
      setProcessingState('error');
  };

  // --- Audio Agent Lifecycle ---
  useEffect(() => {
      if (processingState === 'processing') {
          audioAgent.startProcessing();
      } else {
          audioAgent.stopProcessing();
          if (processingState === 'results' || processingState === 'batch_complete') {
              audioAgent.playSuccess();
          } else if (processingState === 'error' && !criticalFailure) {
              audioAgent.playError();
          }
      }
  }, [processingState, criticalFailure]);

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
          setActivePresetId(pendingSession.activePreset); 
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
    setSchemaProposal(null);
    try {
      const finalDescription = customPrompt || description;
      const data = await performExtraction(files, confirmedDocType, finalDescription, settings.documentLanguage);
      setExtractedData(data);
      setProcessingState('results');
      
      const fieldsCount = Array.isArray(data.data) ? (data.data as Record<string, any>[]).reduce((acc: number, item) => acc + Object.keys(item).length, 0) : Object.keys(data.data).length;
      setStats(prev => ({ docsCount: prev.docsCount + 1, fieldsCount: prev.fieldsCount + fieldsCount }));
      addToHistory({ id: crypto.randomUUID(), fileNames: files.map(f => f.file.name), docType: data.documentType, timestamp: new Date().toISOString(), data });
    } catch (e) {
      handleError(e);
    }
  };

  const handleSchemaConfirmation = (fields: string[]) => {
      if (schemaProposal) {
          const schemaInstructions = `Focus on extracting the following fields: ${fields.join(', ')}.`;
          const mergedDescription = description ? `${description}\n\n${schemaInstructions}` : schemaInstructions;
          continueSingleFileExtraction(schemaProposal.docType, mergedDescription);
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
                // Feature: Dynamic Schema Generator
                // If no preset (user hasn't defined schema), use the AI agent to propose one.
                if (!activePresetId) {
                    const proposedFields = await proposeExtractionSchema(files, result.docType);
                    setSchemaProposal({ 
                        docType: result.docType, 
                        confidence: result.confidence,
                        fields: proposedFields 
                    });
                    setProcessingState('reviewing_schema');
                } else {
                    await continueSingleFileExtraction(result.docType);
                }
            }
        } catch (e) {
            handleError(e);
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
                if (e instanceof AppError && (e.type === 'SECURITY' || e.type === 'SYSTEM')) {
                    handleError(e); // Freeze immediately
                    return;
                }
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
    setSchemaProposal(null);
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
            handleError(e);
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
                    {/* Ambient Glow Background for Greeting & Upload Area */}
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
          <div className="relative w-full max-w-[1600px] mx-auto pt-4 lg:pt-8 h-full flex flex-col">
             {/* Mobile/Tablet Drawer Toggles */}
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
                    <SparklesIcon className="w-4 h-4" /> Tools
                </button>
            </div>

            <div className="flex flex-col xl:flex-row items-start justify-center w-full relative flex-1 min-h-0">
                
                {/* Desktop: Focus Mode Left Sidebar (Collapsible) */}
                <div 
                    className={`
                        fixed inset-y-0 left-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-r border-gray-200 dark:border-zinc-800 shadow-2xl transform transition-all duration-300 ease-out
                        ${showMobileWorkflow ? 'translate-x-0 w-80' : '-translate-x-full w-80'}
                        xl:relative xl:translate-x-0 xl:border-none xl:shadow-none xl:z-20 xl:sticky xl:top-24 xl:h-[calc(100vh-8rem)]
                        xl:bg-white/40 xl:dark:bg-zinc-900/40 xl:rounded-[2rem] xl:border-r-0 xl:backdrop-blur-md
                        ${isLeftPanelHovered ? 'xl:w-80 xl:bg-white/80 xl:dark:bg-zinc-900/80 xl:shadow-2xl' : 'xl:w-20'}
                    `}
                    onMouseEnter={() => setIsLeftPanelHovered(true)}
                    onMouseLeave={() => setIsLeftPanelHovered(false)}
                >
                    <div className="h-full overflow-y-auto p-6 xl:p-0 xl:pt-4 ios-scroll flex flex-col no-scrollbar">
                        <div className="xl:hidden flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white">Workflow</h3>
                            <button onClick={() => setShowMobileWorkflow(false)} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full">
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        
                        {/* Only show full Rail on mobile or when hovered on desktop. Otherwise collapsed. */}
                        <div className="xl:hidden">
                             <GuidanceRail 
                                fileCount={files.length} 
                                hasPreset={!!activePresetId} 
                                hasDescription={description.length > 0} 
                                processingState={processingState}
                            />
                        </div>
                        <div className="hidden xl:block px-2">
                             <GuidanceRail 
                                fileCount={files.length} 
                                hasPreset={!!activePresetId} 
                                hasDescription={description.length > 0} 
                                processingState={processingState}
                                collapsed={!isLeftPanelHovered}
                            />
                        </div>
                    </div>
                </div>
                
                {/* Backdrop for Mobile Left */}
                {showMobileWorkflow && (
                    <div className="xl:hidden fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={() => setShowMobileWorkflow(false)} />
                )}

                {/* Main Focus Area */}
                <div className="flex-1 flex flex-col items-center px-4 w-full relative z-10 max-w-4xl animate-slide-in min-w-0 xl:px-12">
                    {/* Ambient Background - Subtler in Focus Mode */}
                    <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[120%] max-w-[1000px] h-[800px] -z-10 pointer-events-none select-none opacity-40 dark:opacity-20 transition-opacity duration-700">
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
                
                {/* Desktop: Right Floating Tool Trigger */}
                <div className="hidden xl:flex w-20 justify-center sticky top-24 z-20">
                     <Tooltip text="AI Capabilities" position="left">
                        <button 
                            onClick={() => setShowMobileFeatures(true)}
                            className="w-12 h-12 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 dark:border-white/10 flex items-center justify-center text-[#007AFF] hover:scale-110 hover:bg-white dark:hover:bg-zinc-700 transition-all active:scale-95"
                        >
                            <SparklesIcon className="w-6 h-6" />
                        </button>
                     </Tooltip>
                </div>

                {/* Shared Right Panel Drawer */}
                <div 
                    className={`
                        fixed inset-y-0 right-0 z-50 w-80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-l border-gray-200 dark:border-zinc-800 shadow-2xl transform transition-transform duration-300 ease-out
                        ${showMobileFeatures ? 'translate-x-0' : 'translate-x-full'}
                        xl:hidden
                    `}
                >
                    <div className="h-full overflow-y-auto p-6 ios-scroll flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white">Capabilities</h3>
                            <button onClick={() => setShowMobileFeatures(false)} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full">
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <AssistantPreview />
                    </div>
                </div>
                
                {/* Mobile Right Backdrop */}
                {showMobileFeatures && (
                    <div className="xl:hidden fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={() => setShowMobileFeatures(false)} />
                )}
            </div>
          </div>
        );
      case 'processing':
      case 'awaiting_classification':
      case 'reviewing_schema':
        return (
            <ProcessingView 
                files={files} 
                currentIndex={currentlyProcessingFileIndex} 
                batchResults={batchResults}
            />
        );
      case 'results':
        return extractedData && files.length > 0 && (
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
        );
      case 'error':
        return (
          <div className="w-full max-w-2xl mx-auto mt-24 text-center animate-slide-in">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-10 shadow-xl">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-800/40 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XMarkIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-red-700 dark:text-red-300 mb-3 font-display">Processing Failed</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">{error || "An unexpected error occurred. Please try again."}</p>
                <div className="flex justify-center gap-4">
                    <button 
                        onClick={() => setProcessingState('idle')}
                        className="px-6 py-3 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 rounded-xl font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all"
                    >
                        Go Home
                    </button>
                    <button 
                        onClick={() => { setProcessingState('idle'); startPipeline(); }}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md shadow-red-500/20 transition-all"
                    >
                        Try Again
                    </button>
                </div>
            </div>
          </div>
        );
      case 'batch_complete':
        return (
            <div className="w-full h-full flex items-center justify-center p-6">
                <BatchSummaryModal 
                    isOpen={true} 
                    results={batchResults || []} 
                    onClose={handleNewUpload} 
                    onSelectResult={handleSelectBatchResult}
                />
            </div>
        );
      default:
        return null;
    }
  }, [processingState, files, extractedData, error, selectedTemplate, description, activePresetId, settings.presets, history, classificationResult, schemaProposal, currentlyProcessingFileIndex, batchResults, isLeftOpen, toggleLeftSidebar, isRightOpen, toggleRightSidebar, stats, showMobileWorkflow, showMobileFeatures, isLeftPanelHovered, activePresetName]);

  return (
    <div 
        className="flex flex-col h-screen overflow-hidden bg-white dark:bg-[#020617] text-gray-900 dark:text-white transition-colors duration-500 font-body relative"
        onDragEnter={handleGlobalDragEnter}
        onDragLeave={handleGlobalDragLeave}
        onDragOver={handleGlobalDragOver}
        onDrop={handleGlobalDrop}
    >
      <div className={`absolute top-[-300px] left-[-300px] w-[800px] h-[800px] rounded-full blur-[120px] opacity-30 pointer-events-none transition-colors duration-1000 ${blobStyles.blob1}`} />
      <div className={`absolute bottom-[-300px] right-[-300px] w-[800px] h-[800px] rounded-full blur-[120px] opacity-30 pointer-events-none transition-colors duration-1000 ${blobStyles.blob2}`} />
      <div className={`absolute top-[40%] left-[60%] w-[600px] h-[600px] rounded-full blur-[100px] opacity-20 pointer-events-none transition-colors duration-1000 ${blobStyles.blob3}`} />
      
      <PerspectiveGrid />

      {/* Critical System Alert Lockout (Segment 7.1) */}
      {criticalFailure && (
          <SystemAlert 
              type={criticalFailure.type}
              message={criticalFailure.message}
              logId={criticalFailure.id}
          />
      )}

      {isDragging && (
          <div className="absolute inset-0 z-[100] bg-white/90 dark:bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in pointer-events-none">
              <div className="w-24 h-24 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-6 animate-bounce">
                  <ArrowUpTrayIcon className="w-12 h-12 text-[#007AFF]" />
              </div>
              <h2 className="text-3xl font-bold text-[#1d1d1f] dark:text-white font-display">Drop files to extract</h2>
          </div>
      )}

      <Header onHomeClick={handleNewUpload} />
      
      <main className="flex-1 w-full relative z-10 flex flex-col min-h-0">
        {renderContent}
      </main>

      <ClassificationConfirmationModal 
        isOpen={processingState === 'awaiting_classification'}
        suggestedType={classificationResult?.docType || ''}
        confidence={classificationResult?.confidence || 0}
        presets={settings.presets}
        onConfirm={continueSingleFileExtraction}
        onCancel={handleNewUpload}
      />

      <SchemaProposalModal 
        isOpen={processingState === 'reviewing_schema'}
        docType={schemaProposal?.docType || ''}
        proposedFields={schemaProposal?.fields || []}
        onConfirm={handleSchemaConfirmation}
        onCancel={handleNewUpload}
      />

      {restoreNotification && (
          <Notification 
            message="Resume your previous session?" 
            type="info" 
            onClose={handleDismissRestore}
            action={{ label: 'Resume', onClick: handleRestoreSession }}
          />
      )}
    </div>
  );
}

export default App;

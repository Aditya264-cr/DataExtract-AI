
import React, { useState, useMemo, useContext } from 'react';
import { ChatPanel } from '../ChatPanel';
import type { ExtractedData } from '../../types';
import { PanelRightCloseIcon } from '../icons/PanelRightCloseIcon';
import { PanelRightOpenIcon } from '../icons/PanelRightOpenIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { Tooltip } from '../ui/Tooltip';
import { ArrowDownTrayIcon } from '../icons/ArrowDownTrayIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { ArrowUturnLeftIcon } from '../icons/ArrowUturnLeftIcon';
import { validateDocumentLogic } from '../../utils/validationUtils';
import { flattenObject } from '../../utils/dataAdapter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatAsOfficialDocument } from '../../utils/textFormatter';
import { generateSummaryFromData, generateSketchnotes, generateCreativeImage } from '../../services/geminiService';
import { AISummary } from '../AISummary';
import { SwatchIcon } from '../icons/SwatchIcon';
import { PhotoIcon } from '../icons/PhotoIcon';

interface RightSidebarProps {
    originalData: ExtractedData;
    editedData: ExtractedData;
    isOpen: boolean;
    onToggle: () => void;
}

type StudioTool = 'menu' | 'chat' | 'summary' | 'validate' | 'export' | 'sketchnotes' | 'visuals';

export const RightSidebar: React.FC<RightSidebarProps> = ({ originalData, editedData, isOpen, onToggle }) => {
    const [activeTool, setActiveTool] = useState<StudioTool>('menu');
    const [summaryData, setSummaryData] = useState<any>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [sketchnotes, setSketchnotes] = useState<string | null>(null);
    const [isSketchnotesLoading, setIsSketchnotesLoading] = useState(false);
    
    // Image Generation State
    const [imagePrompt, setImagePrompt] = useState('');
    const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);

    const validationResult = useMemo(() => validateDocumentLogic(flattenObject(editedData)), [editedData]);

    const handleGenerateSummary = async () => {
        setIsSummaryLoading(true);
        try {
            const summary = await generateSummaryFromData(editedData, true);
            setSummaryData(summary);
            // Pre-fill image prompt if empty
            if (!imagePrompt && summary?.summary) {
                setImagePrompt(`A professional conceptual illustration of: ${summary.summary.slice(0, 200)}...`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSummaryLoading(false);
        }
    };

    const handleGenerateSketchnotes = async () => {
        setIsSketchnotesLoading(true);
        try {
            const notes = await generateSketchnotes(editedData);
            setSketchnotes(notes);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSketchnotesLoading(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!imagePrompt) return;
        setIsImageLoading(true);
        try {
            const base64Image = await generateCreativeImage(imagePrompt, imageSize);
            setGeneratedImage(base64Image);
        } catch (e) {
            console.error(e);
        } finally {
            setIsImageLoading(false);
        }
    };

    const handleExport = (format: 'json' | 'csv' | 'txt' | 'xlsx' | 'pdf') => {
        const fileName = `export_${editedData.documentType}_${Date.now()}`;
        
        if (format === 'json') {
            const content = JSON.stringify(editedData.structuredData, null, 2);
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `${fileName}.json`; a.click();
        } else if (format === 'txt') {
            const content = formatAsOfficialDocument(editedData);
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `${fileName}.txt`; a.click();
        } else if (format === 'csv') {
            const flattened = flattenObject(editedData);
            const csvContent = Object.entries(flattened).map(([k,v]) => `"${k}","${String(v).replace(/"/g, '""')}"`).join('\n');
            const blob = new Blob([`Field,Value\n${csvContent}`], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `${fileName}.csv`; a.click();
        }
    };

    const toolCards = [
        { id: 'chat', label: 'AI Assistant', icon: SparklesIcon, desc: 'Ask questions & verify', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { id: 'summary', label: 'Smart Summary', icon: DocumentTextIcon, desc: 'Generate overview', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { id: 'sketchnotes', label: 'Sketchnotes', icon: SwatchIcon, desc: 'Visual blueprint', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
        { id: 'visuals', label: 'Visual Studio', icon: PhotoIcon, desc: 'Generate 1K/2K/4K images', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        { id: 'validate', label: 'Live Validator', icon: ShieldCheckIcon, desc: `${validationResult.issues.length} Issues found`, color: validationResult.issues.length > 0 ? 'text-orange-500' : 'text-green-500', bg: validationResult.issues.length > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-green-50 dark:bg-green-900/20' },
        { id: 'export', label: 'Export Studio', icon: ArrowDownTrayIcon, desc: 'Download data', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-zinc-800' },
    ];

    const renderToolContent = () => {
        switch (activeTool) {
            case 'chat':
                return <ChatPanel extractedData={editedData} />;
            case 'summary':
                return (
                    <div className="flex flex-col h-full overflow-y-auto ios-scroll p-1">
                        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl mb-4">
                            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">Executive Summary</h4>
                            <p className="text-sm text-blue-800 dark:text-blue-200 opacity-80">Generate a concise natural language summary of the current data state.</p>
                            <button onClick={handleGenerateSummary} disabled={isSummaryLoading} className="mt-4 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                                {isSummaryLoading ? 'Generating...' : 'Generate New Summary'}
                            </button>
                        </div>
                        {summaryData && <AISummary summary={summaryData} loading={isSummaryLoading} onRegenerate={handleGenerateSummary} onExplain={() => {}} />}
                        {!summaryData && !isSummaryLoading && (
                            <div className="text-center p-8 text-gray-400">
                                <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No summary generated yet.</p>
                            </div>
                        )}
                    </div>
                );
            case 'visuals':
                return (
                    <div className="flex flex-col h-full overflow-y-auto ios-scroll p-1">
                        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl mb-4">
                            <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">Visual Studio</h4>
                            <p className="text-sm text-indigo-800 dark:text-indigo-200 opacity-80 mb-4">Turn your data concept into high-fidelity imagery using Gemini 3 Pro.</p>
                            
                            <div className="space-y-3">
                                <textarea 
                                    value={imagePrompt}
                                    onChange={(e) => setImagePrompt(e.target.value)}
                                    placeholder="Describe the image you want to generate based on this document..."
                                    className="w-full p-3 bg-white/50 dark:bg-black/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                                />
                                
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Quality:</label>
                                    <select 
                                        value={imageSize}
                                        onChange={(e) => setImageSize(e.target.value as any)}
                                        className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg text-sm px-2 py-1 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="1K">1K (Fast)</option>
                                        <option value="2K">2K (High Res)</option>
                                        <option value="4K">4K (Ultra)</option>
                                    </select>
                                </div>

                                <button 
                                    onClick={handleGenerateImage} 
                                    disabled={isImageLoading || !imagePrompt.trim()} 
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isImageLoading ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <PhotoIcon className="w-4 h-4" />
                                            Generate Image
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {generatedImage && (
                            <div className="relative group rounded-2xl overflow-hidden shadow-lg border border-black/5 dark:border-white/5 bg-black/5">
                                <img src={generatedImage} alt="Generated Visual" className="w-full h-auto object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                                    <a href={generatedImage} download={`visual_${Date.now()}.png`} className="px-4 py-2 bg-white text-black font-bold rounded-full text-xs shadow-xl hover:scale-105 transition-transform">
                                        Download Image
                                    </a>
                                </div>
                            </div>
                        )}
                        
                        {!generatedImage && !isImageLoading && (
                            <div className="text-center p-12 text-gray-400 opacity-60">
                                <PhotoIcon className="w-16 h-16 mx-auto mb-2 opacity-20" />
                                <p className="text-xs">Visual output will appear here</p>
                            </div>
                        )}
                    </div>
                );
            case 'sketchnotes':
                return (
                    <div className="flex flex-col h-full overflow-y-auto ios-scroll p-1">
                        <div className="p-4 bg-pink-50/50 dark:bg-pink-900/10 rounded-2xl mb-4">
                            <h4 className="font-bold text-pink-900 dark:text-pink-100 mb-2">Visual Sketchnotes</h4>
                            <p className="text-sm text-pink-800 dark:text-pink-200 opacity-80">Create a visual blueprint of your document suitable for revision and quick understanding.</p>
                            <button onClick={handleGenerateSketchnotes} disabled={isSketchnotesLoading} className="mt-4 w-full py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                                {isSketchnotesLoading ? 'Designing...' : 'Draft Sketchnotes'}
                            </button>
                        </div>
                        {isSketchnotesLoading && (
                            <div className="space-y-4 p-4 animate-pulse">
                                <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/2"></div>
                                <div className="h-32 bg-gray-200 dark:bg-zinc-800 rounded-xl"></div>
                            </div>
                        )}
                        {sketchnotes && !isSketchnotesLoading && (
                            <div className="p-4 bg-white dark:bg-zinc-800 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
                                <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700 dark:text-gray-300 leading-relaxed overflow-x-auto">
                                    {sketchnotes}
                                </pre>
                            </div>
                        )}
                        {!sketchnotes && !isSketchnotesLoading && (
                            <div className="text-center p-8 text-gray-400">
                                <SwatchIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Ready to draft.</p>
                            </div>
                        )}
                    </div>
                );
            case 'validate':
                return (
                    <div className="flex flex-col h-full overflow-y-auto ios-scroll p-1">
                        <div className="mb-4">
                            <div className={`p-4 rounded-2xl border ${validationResult.isValid ? 'bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-800' : 'bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-800'}`}>
                                <div className="flex items-center gap-3 mb-1">
                                    <ShieldCheckIcon className={`w-6 h-6 ${validationResult.isValid ? 'text-green-500' : 'text-orange-500'}`} />
                                    <h4 className={`font-bold ${validationResult.isValid ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
                                        {validationResult.isValid ? 'All Checks Passed' : 'Attention Needed'}
                                    </h4>
                                </div>
                                <p className="text-xs opacity-80 font-medium ml-9">
                                    {validationResult.issues.length} potential issues detected in the data.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {validationResult.issues.map((issue, idx) => (
                                <div key={idx} className="p-3 bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group">
                                    <div className="flex items-start gap-2.5">
                                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${issue.severity === 'error' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-0.5">{issue.type}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug">{issue.message}</p>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {issue.involvedKeys.map(k => (
                                                    <span key={k} className="text-[10px] bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 font-mono">{k}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'export':
                return (
                    <div className="flex flex-col h-full overflow-y-auto ios-scroll p-1 space-y-2">
                        {[
                            { id: 'json', label: 'JSON Data', desc: 'Raw structured format' },
                            { id: 'csv', label: 'CSV Spreadsheet', desc: 'For Excel or Sheets' },
                            { id: 'txt', label: 'Text Report', desc: 'Formatted document' }
                        ].map((opt) => (
                            <button 
                                key={opt.id} 
                                onClick={() => handleExport(opt.id as any)}
                                className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-xl hover:border-blue-500/30 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-700 flex items-center justify-center text-gray-500 dark:text-gray-300 group-hover:text-blue-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                        <ArrowDownTrayIcon className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{opt.label}</p>
                                        <p className="text-xs text-gray-500">{opt.desc}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                );
            default: return null;
        }
    };

    return (
        <aside 
            className={`relative h-full bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-20 ${isOpen ? 'w-96' : 'w-14 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
            onClick={(e) => { if(!isOpen) { onToggle(); } }}
        >
            <div className="h-full flex flex-col overflow-hidden w-full">
                {/* Header */}
                <div 
                    className="h-[68px] flex items-center relative border-b border-black/5 dark:border-white/5 flex-shrink-0 px-4"
                    onClick={(e) => { if(isOpen) e.stopPropagation(); }} 
                >
                    {/* Toggle Button: Positioned Left when Open, Centered when Closed */}
                    <div className={`transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'mr-3' : 'absolute left-1/2 -translate-x-1/2'}`}>
                        <Tooltip text={isOpen ? "Collapse Panel" : "Expand Studio"} position={isOpen ? "bottom" : "left"}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-all flex-shrink-0"
                            >
                                {isOpen ? <PanelRightCloseIcon className="w-5 h-5" /> : <PanelRightOpenIcon className="w-5 h-5" />}
                            </button>
                        </Tooltip>
                    </div>
                    
                    {/* Title Container - Only visible when open */}
                    <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 pointer-events-none'}`}>
                        {activeTool !== 'menu' && (
                            <button 
                                onClick={() => setActiveTool('menu')}
                                className="p-1.5 -ml-2 mr-1 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            >
                                <ArrowUturnLeftIcon className="w-4 h-4" />
                            </button>
                        )}
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest font-display whitespace-nowrap">
                            {activeTool === 'menu' ? 'Studio' : toolCards.find(t => t.id === activeTool)?.label}
                        </h3>
                    </div>
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-hidden relative w-full bg-gray-50/50 dark:bg-black/20">
                    {isOpen ? (
                        <div className="absolute inset-0 flex flex-col p-4 min-h-0 animate-fade-in w-full" onClick={(e) => e.stopPropagation()}>
                            {activeTool === 'menu' ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {toolCards.map((tool) => (
                                        <button
                                            key={tool.id}
                                            onClick={() => setActiveTool(tool.id as StudioTool)}
                                            className={`flex items-center gap-4 p-4 rounded-2xl border border-black/5 dark:border-white/5 transition-all duration-200 hover:scale-[1.02] hover:shadow-md text-left group bg-white dark:bg-zinc-800`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tool.bg} ${tool.color} text-lg shadow-sm group-hover:scale-110 transition-transform`}>
                                                <tool.icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-[15px]">{tool.label}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{tool.desc}</p>
                                            </div>
                                            <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full animate-slide-in">
                                    {renderToolContent()}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center pt-4 w-full animate-fade-in gap-4">
                            <Tooltip text="Open Studio" position="left">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggle(); setActiveTool('menu'); }}
                                    className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] shadow-inner hover:bg-[#007AFF]/20 transition-colors"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                </button>
                            </Tooltip>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

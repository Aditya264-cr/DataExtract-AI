
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
import { generateSummaryFromData } from '../../services/geminiService';
import { AISummary } from '../AISummary';

interface RightSidebarProps {
    originalData: ExtractedData;
    editedData: ExtractedData;
    isOpen: boolean;
    onToggle: () => void;
}

type StudioTool = 'menu' | 'chat' | 'summary' | 'validate' | 'export';

export const RightSidebar: React.FC<RightSidebarProps> = ({ originalData, editedData, isOpen, onToggle }) => {
    const [activeTool, setActiveTool] = useState<StudioTool>('menu');
    const [summaryData, setSummaryData] = useState<any>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);

    const validationResult = useMemo(() => validateDocumentLogic(flattenObject(editedData)), [editedData]);

    const handleGenerateSummary = async () => {
        setIsSummaryLoading(true);
        try {
            const summary = await generateSummaryFromData(editedData, true);
            setSummaryData(summary);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSummaryLoading(false);
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
        // Simplified PDF/XLSX for sidebar (full logic in center is more robust for tables, but this is a quick tool)
    };

    const toolCards = [
        { id: 'chat', label: 'AI Assistant', icon: SparklesIcon, desc: 'Ask questions & verify', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { id: 'summary', label: 'Smart Summary', icon: DocumentTextIcon, desc: 'Generate overview', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
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
                    <div className={`absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'right-4' : 'left-1/2 -translate-x-1/2'}`}>
                        <Tooltip text={isOpen ? "Collapse Panel" : "Expand Studio"} position="left">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-all flex-shrink-0"
                            >
                                {isOpen ? <PanelRightCloseIcon className="w-5 h-5" /> : <PanelRightOpenIcon className="w-5 h-5" />}
                            </button>
                        </Tooltip>
                    </div>
                    
                    <div className={`absolute left-4 transition-all duration-300 flex items-center gap-2 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                        {activeTool !== 'menu' && (
                            <button 
                                onClick={() => setActiveTool('menu')}
                                className="p-1.5 -ml-2 mr-1 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            >
                                <ArrowUturnLeftIcon className="w-4 h-4" />
                            </button>
                        )}
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest font-display">
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

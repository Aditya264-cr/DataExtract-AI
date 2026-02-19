
import React, { useState, useMemo, useContext, useEffect } from 'react';
import { ChatPanel } from '../ChatPanel';
import type { ExtractedData, AISummaryData } from '../../types';
import { PanelRightCloseIcon } from '../icons/PanelRightCloseIcon';
import { PanelRightOpenIcon } from '../icons/PanelRightOpenIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { Tooltip } from '../ui/Tooltip';
import { ArrowDownTrayIcon } from '../icons/ArrowDownTrayIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { ArrowUturnLeftIcon } from '../icons/ArrowUturnLeftIcon';
import { validateDocumentLogic, validateConfidence } from '../../utils/validationUtils';
import { flattenObject } from '../../utils/dataAdapter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatAsOfficialDocument } from '../../utils/textFormatter';
import { 
    generateSummaryFromData, 
    generateSketchnotes, 
    generateCreativeImage,
    generateInfographicPrompt,
    analyzeDocumentGaps,
    generateAudienceSummary,
    generateBenchmarkReport,
    generateWrittenReport
} from '../../services/geminiService';
import { AISummary } from '../AISummary';
import { SwatchIcon } from '../icons/SwatchIcon';
import { PhotoIcon } from '../icons/PhotoIcon';
import { SettingsContext } from '../../contexts/SettingsContext';
import { ClipboardDocumentIcon } from '../icons/ClipboardDocumentIcon';
import { ViewColumnsIcon } from '../icons/ViewColumnsIcon';
import { MagnifyingGlassIcon } from '../icons/MagnifyingGlassIcon';
import { MegaphoneIcon } from '../icons/MegaphoneIcon';
import { Notification } from '../ui/Notification';

interface RightSidebarProps {
    originalData: ExtractedData;
    editedData: ExtractedData;
    isOpen: boolean;
    onToggle: () => void;
}

type StudioTool = 'menu' | 'chat' | 'summary' | 'validate' | 'export' | 'sketchnotes' | 'visuals' | 'gaps' | 'audience' | 'benchmark' | 'report';

export const RightSidebar: React.FC<RightSidebarProps> = ({ originalData, editedData, isOpen, onToggle }) => {
    const { settings } = useContext(SettingsContext);
    const [activeTool, setActiveTool] = useState<StudioTool>('menu');
    const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
    
    // Shared Semantic Context (Base Layer)
    const semanticContext = useMemo(() => {
        return editedData.rawTextSummary || `A document of type ${editedData.documentType} containing structured data.`;
    }, [editedData]);

    // State for existing tools
    const [summaryData, setSummaryData] = useState<AISummaryData | null>(() => ({
        summary: semanticContext,
        confidenceScore: editedData.confidenceScore
    }));
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [sketchnotes, setSketchnotes] = useState<string | null>(null);
    const [isSketchnotesLoading, setIsSketchnotesLoading] = useState(false);
    const [imagePrompt, setImagePrompt] = useState('');
    const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [isPromptLoading, setIsPromptLoading] = useState(false);

    // State for New Tools
    const [gapAnalysis, setGapAnalysis] = useState<string | null>(null);
    const [isGapLoading, setIsGapLoading] = useState(false);

    const [audienceType, setAudienceType] = useState('Executive');
    const [audienceSummary, setAudienceSummary] = useState<string | null>(null);
    const [isAudienceLoading, setIsAudienceLoading] = useState(false);

    const [benchmarkReport, setBenchmarkReport] = useState<string | null>(null);
    const [isBenchmarkLoading, setIsBenchmarkLoading] = useState(false);

    const [writtenReport, setWrittenReport] = useState<string | null>(null);
    const [isReportLoading, setIsReportLoading] = useState(false);

    // Combined Validation (Logic + Confidence)
    const validationResult = useMemo(() => {
        const logic = validateDocumentLogic(flattenObject(editedData));
        const confidence = validateConfidence(editedData);
        return {
            isValid: logic.isValid && confidence.length === 0,
            issues: [...logic.issues, ...confidence],
            hasBlockers: confidence.some(i => i.severity === 'error')
        };
    }, [editedData]);

    // Independent Visual Studio Auto-fill - Only if empty
    useEffect(() => {
        if (activeTool === 'visuals' && !imagePrompt && semanticContext) {
            const visualContext = semanticContext.length > 400 
                ? semanticContext.slice(0, 400) + "..." 
                : semanticContext;
            setImagePrompt(`A professional conceptual illustration representing: ${visualContext}`);
        }
    }, [activeTool, semanticContext]);

    // Reset local states when main document changes
    useEffect(() => {
        setSummaryData({
            summary: editedData.rawTextSummary || "Document analysis ready.",
            confidenceScore: editedData.confidenceScore
        });
        setSketchnotes(null);
        setGeneratedImage(null);
        setImagePrompt('');
        setGapAnalysis(null);
        setAudienceSummary(null);
        setBenchmarkReport(null);
        setWrittenReport(null);
    }, [editedData.documentType, editedData.rawTextSummary]);

    // Handlers
    const handleGenerateSummary = async () => {
        setIsSummaryLoading(true);
        try {
            const summary = await generateSummaryFromData(editedData, true);
            setSummaryData(summary);
        } catch (e) { console.error(e); } finally { setIsSummaryLoading(false); }
    };

    const handleGenerateSketchnotes = async () => {
        setIsSketchnotesLoading(true);
        try {
            const notes = await generateSketchnotes(editedData);
            setSketchnotes(notes);
        } catch (e) { console.error(e); } finally { setIsSketchnotesLoading(false); }
    };

    const handleDraftInfographic = async () => {
        setIsPromptLoading(true);
        try {
            const prompt = await generateInfographicPrompt(editedData);
            setImagePrompt(prompt);
        } catch (e) { console.error(e); } finally { setIsPromptLoading(false); }
    };

    const handleGenerateImage = async () => {
        if (!imagePrompt) return;
        setIsImageLoading(true);
        try {
            const base64Image = await generateCreativeImage(imagePrompt, imageSize);
            setGeneratedImage(base64Image);
        } catch (e) { console.error(e); } finally { setIsImageLoading(false); }
    };

    const handleGapAnalysis = async () => {
        setIsGapLoading(true);
        try {
            const result = await analyzeDocumentGaps(editedData);
            setGapAnalysis(result);
        } catch (e) { console.error(e); } finally { setIsGapLoading(false); }
    };

    const handleAudienceSummary = async () => {
        setIsAudienceLoading(true);
        try {
            const result = await generateAudienceSummary(editedData, audienceType);
            setAudienceSummary(result);
        } catch (e) { console.error(e); } finally { setIsAudienceLoading(false); }
    };

    const handleBenchmark = async () => {
        setIsBenchmarkLoading(true);
        try {
            const result = await generateBenchmarkReport(editedData);
            setBenchmarkReport(result);
        } catch (e) { console.error(e); } finally { setIsBenchmarkLoading(false); }
    };

    const handleWrittenReport = async () => {
        setIsReportLoading(true);
        try {
            const result = await generateWrittenReport(editedData);
            setWrittenReport(result);
        } catch (e) { console.error(e); } finally { setIsReportLoading(false); }
    };

    const handleExport = (format: 'json' | 'csv' | 'txt' | 'xlsx' | 'pdf') => {
        // Export Guard: Block if strict confidence validation fails
        if (validationResult.hasBlockers) {
            setNotification({ 
                message: "Export Blocked: Correct critical 'Very Low Confidence' fields first.", 
                type: 'error' 
            });
            return;
        }

        const fileName = `export_${editedData.documentType.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}`;
        const watermarkText = "Generated by DataExtract AI";
        
        if (format === 'json') {
            let exportData: any = editedData.structuredData;
            if (settings.showWatermark) exportData = { ...exportData, _metadata: { ...editedData.meta, generator: watermarkText, generatedAt: new Date().toISOString() } };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${fileName}.json`; a.click();
        } else if (format === 'txt') {
            const content = formatAsOfficialDocument(editedData, settings.showWatermark);
            const blob = new Blob([content], { type: 'text/plain' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${fileName}.txt`; a.click();
        } else if (format === 'csv') {
            const flattened = flattenObject(editedData);
            const csvContent = Object.entries(flattened).map(([k,v]) => `"${k}","${String(v).replace(/"/g, '""')}"`).join('\n');
            const blob = new Blob([`Field,Value\n${csvContent}`], { type: 'text/csv' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${fileName}.csv`; a.click();
        } else if (format === 'xlsx') {
            const flattened = flattenObject(editedData);
            const mainData = Object.entries(flattened).map(([Key, Value]) => ({ Key, Value: String(Value) }));
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(mainData);
            if (settings.showWatermark) XLSX.utils.sheet_add_aoa(ws, [[watermarkText]], { origin: -1 });
            XLSX.utils.book_append_sheet(wb, ws, "Extracted Data");
            const tables = editedData.structuredData.tables || [];
            tables.forEach((table, idx) => {
                if (table.rows && table.rows.length > 0) {
                    const tableData = table.rows.map(row => {
                        const cleanRow: any = {};
                        Object.entries(row).forEach(([k, v]: [string, any]) => { cleanRow[k] = v?.value ?? v; });
                        return cleanRow;
                    });
                    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tableData), (table.tableName || `Table ${idx + 1}`).substring(0, 31));
                }
            });
            XLSX.writeFile(wb, `${fileName}.xlsx`);
        } else if (format === 'pdf') {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setFontSize(18); doc.text(editedData.documentType, 14, 20);
            doc.setFontSize(10); doc.setTextColor(100); doc.text(`Confidence: ${editedData.confidenceScore}%  |  Date: ${new Date().toLocaleDateString()}`, 14, 26); doc.setTextColor(0);
            let currentY = 35;
            if (editedData.rawTextSummary) {
                doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Summary", 14, currentY); currentY += 6;
                doc.setFont("helvetica", "normal"); doc.setFontSize(10);
                const splitSummary = doc.splitTextToSize(editedData.rawTextSummary, pageWidth - 28);
                doc.text(splitSummary, 14, currentY); currentY += splitSummary.length * 5 + 10;
            }
            const flattened = flattenObject(editedData);
            const kvEntries = Object.entries(flattened).filter(([_, v]) => !String(v).startsWith('[Table') && !String(v).startsWith('[List'));
            if (kvEntries.length > 0) {
                doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Key Data", 14, currentY); currentY += 2;
                autoTable(doc, { startY: currentY + 4, head: [['Field', 'Value']], body: kvEntries.map(([k, v]) => [k, String(v)]), theme: 'striped', headStyles: { fillColor: [66, 66, 66] }, styles: { fontSize: 9, cellPadding: 3 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }, margin: { left: 14, right: 14 } });
                // @ts-ignore
                currentY = doc.lastAutoTable.finalY + 15;
            }
            const tables = editedData.structuredData.tables || [];
            tables.forEach(table => {
                if (currentY > pageHeight - 40) { doc.addPage(); currentY = 20; }
                doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(table.tableName || "Table Data", 14, currentY);
                const headers = table.headers || (table.rows.length > 0 ? Object.keys(table.rows[0]) : []);
                if (headers.length > 0) {
                    autoTable(doc, { startY: currentY + 5, head: [headers], body: table.rows.map(row => headers.map(h => String(row[h]?.value ?? row[h] ?? ""))), theme: 'grid', headStyles: { fillColor: [0, 122, 255] }, styles: { fontSize: 8 }, margin: { left: 14, right: 14 } });
                    // @ts-ignore
                    currentY = doc.lastAutoTable.finalY + 15;
                }
            });
            if (settings.showWatermark) { const totalPages = doc.getNumberOfPages(); for (let i = 1; i <= totalPages; i++) { doc.setPage(i); doc.setFontSize(9); doc.setTextColor(150); doc.text(watermarkText, 14, pageHeight - 10); } }
            doc.save(`${fileName}.pdf`);
        }
    };

    const toolCards = [
        { id: 'chat', label: 'AI Assistant', icon: SparklesIcon, desc: 'Ask questions & verify', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { id: 'summary', label: 'Smart Summary', icon: DocumentTextIcon, desc: 'Generate overview', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { id: 'audience', label: 'Summarize for Audience', icon: MegaphoneIcon, desc: 'Tailor insights for readers', color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
        { id: 'gaps', label: 'Find Missing Info', icon: MagnifyingGlassIcon, desc: 'Identify data gaps', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
        { id: 'benchmark', label: 'Benchmark Doc', icon: ViewColumnsIcon, desc: 'Compare to standards', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
        { id: 'report', label: 'Generate Report', icon: ClipboardDocumentIcon, desc: 'Draft formal document', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        { id: 'sketchnotes', label: 'Sketchnotes', icon: SwatchIcon, desc: 'Visual blueprint', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
        { id: 'visuals', label: 'Visual Studio', icon: PhotoIcon, desc: 'Generate 1K/2K/4K images', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        { id: 'validate', label: 'Live Validator', icon: ShieldCheckIcon, desc: `${validationResult.issues.length} Issues found`, color: validationResult.issues.length > 0 ? 'text-orange-500' : 'text-green-500', bg: validationResult.issues.length > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-green-50 dark:bg-green-900/20' },
        { id: 'export', label: 'Export Studio', icon: ArrowDownTrayIcon, desc: 'Download data', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-zinc-800' },
    ];

    const renderToolContent = () => {
        switch (activeTool) {
            case 'chat': return <ChatPanel extractedData={editedData} />;
            case 'summary':
                return (
                    <div className="flex flex-col h-full overflow-y-auto ios-scroll p-1">
                        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl mb-4">
                            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">Executive Summary</h4>
                            <p className="text-sm text-blue-800 dark:text-blue-200 opacity-80">Generate a concise natural language summary of the current data state.</p>
                            <button onClick={handleGenerateSummary} disabled={isSummaryLoading} className="mt-4 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                                {isSummaryLoading ? 'Generating...' : 'Refine Summary'}
                            </button>
                        </div>
                        {summaryData && <AISummary summary={summaryData} loading={isSummaryLoading} onRegenerate={handleGenerateSummary} onExplain={() => {}} />}
                    </div>
                );
            case 'gaps':
                return (
                    <div className="flex flex-col h-full overflow-y-auto ios-scroll p-1">
                        <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-2xl mb-4">
                            <h4 className="font-bold text-red-900 dark:text-red-100 mb-2">Missing Information</h4>
                            <p className="text-sm text-red-800 dark:text-red-200 opacity-80">Identify critical missing fields and ambiguities based on document type.</p>
                            <button onClick={handleGapAnalysis} disabled={isGapLoading} className="mt-4 w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                                {isGapLoading ? 'Scanning...' : 'Scan for Gaps'}
                            </button>
                        </div>
                        {gapAnalysis && (
                            <div className="p-4 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm">
                                <pre className="whitespace-pre-wrap font-sans text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{gapAnalysis}</pre>
                            </div>
                        )}
                    </div>
                );
            case 'audience':
                return (
                    <div className="flex flex-col h-full overflow-y-auto ios-scroll p-1">
                        <div className="p-4 bg-teal-50/50 dark:bg-teal-900/10 rounded-2xl mb-4">
                            <h4 className="font-bold text-teal-900 dark:text-teal-100 mb-2">Audience Tailoring</h4>
                            <p className="text-sm text-teal-800 dark:text-teal-200 opacity-80 mb-3">Reframe the insights for a specific reader.</p>
                            <select 
                                value={audienceType} 
                                onChange={(e) => setAudienceType(e.target.value)} 
                                className="w-full mb-3 p-2 bg-white/50 dark:bg-black/20 border border-teal-200 dark:border-teal-800 rounded-lg text-sm"
                            >
                                <option>Executive</option>
                                <option>Legal</option>
                                <option>Technical</option>
                                <option>General Public</option>
                            </select>
                            <button onClick={handleAudienceSummary} disabled={isAudienceLoading} className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                                {isAudienceLoading ? 'Writing...' : 'Generate Summary'}
                            </button>
                        </div>
                        {audienceSummary && (
                            <div className="p-4 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm relative group">
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{audienceSummary}</p>
                                <button 
                                    onClick={() => navigator.clipboard.writeText(audienceSummary)} 
                                    className="absolute top-2 right-2 p-1.5 bg-gray-100 dark:bg-zinc-700 text-gray-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                );
            case 'benchmark':
                return (
                    <div className="flex flex-col h-full overflow-y-auto ios-scroll p-1">
                        <div className="p-4 bg-cyan-50/50 dark:bg-cyan-900/10 rounded-2xl mb-4">
                            <h4 className="font-bold text-cyan-900 dark:text-cyan-100 mb-2">Standard Benchmark</h4>
                            <p className="text-sm text-cyan-800 dark:text-cyan-200 opacity-80">Compare extracted data against industry standards for completeness and compliance.</p>
                            <button onClick={handleBenchmark} disabled={isBenchmarkLoading} className="mt-4 w-full py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                                {isBenchmarkLoading ? 'Analyzing...' : 'Run Benchmark'}
                            </button>
                        </div>
                        {benchmarkReport && (
                            <div className="p-4 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm">
                                <pre className="whitespace-pre-wrap font-sans text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{benchmarkReport}</pre>
                            </div>
                        )}
                    </div>
                );
            case 'report':
                return (
                    <div className="flex flex-col h-full overflow-y-auto ios-scroll p-1">
                        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl mb-4">
                            <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">Formal Report</h4>
                            <p className="text-sm text-indigo-800 dark:text-indigo-200 opacity-80">Draft a professional report including executive summary, analysis, and recommendations.</p>
                            <button onClick={handleWrittenReport} disabled={isReportLoading} className="mt-4 w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                                {isReportLoading ? 'Drafting...' : 'Generate Report'}
                            </button>
                        </div>
                        {writtenReport && (
                            <div className="p-4 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm relative group">
                                <pre className="whitespace-pre-wrap font-sans text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{writtenReport}</pre>
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => navigator.clipboard.writeText(writtenReport)} className="p-1.5 bg-gray-100 dark:bg-zinc-700 text-gray-500 rounded-lg"><ClipboardDocumentIcon className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => { const blob = new Blob([writtenReport], {type:'text/markdown'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'report.md'; a.click(); }} className="p-1.5 bg-gray-100 dark:bg-zinc-700 text-gray-500 rounded-lg"><ArrowDownTrayIcon className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'visuals':
                return (
                    <div className="flex flex-col h-full overflow-y-auto ios-scroll p-1">
                        <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl mb-4">
                            <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-2">Visual Studio</h4>
                            <p className="text-sm text-amber-800 dark:text-amber-200 opacity-80 mb-4">Turn data concepts into high-fidelity imagery.</p>
                            
                            <div className="flex justify-end mb-2">
                                <button 
                                    onClick={handleDraftInfographic} 
                                    disabled={isPromptLoading}
                                    className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1.5 bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    <SparklesIcon className="w-3.5 h-3.5" />
                                    {isPromptLoading ? 'Drafting...' : 'Magic Infographic Draft'}
                                </button>
                            </div>

                            <textarea 
                                value={imagePrompt}
                                onChange={(e) => setImagePrompt(e.target.value)}
                                placeholder="Describe the image..."
                                className="w-full p-3 bg-white/50 dark:bg-black/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none h-24 mb-3"
                            />
                            <div className="flex items-center gap-2 mb-3">
                                <label className="text-xs font-bold text-gray-500 uppercase">Quality:</label>
                                <select 
                                    value={imageSize}
                                    onChange={(e) => setImageSize(e.target.value as any)}
                                    className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg text-sm px-2 py-1 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                                >
                                    <option value="1K">1K (Fast)</option>
                                    <option value="2K">2K (High Res)</option>
                                    <option value="4K">4K (Ultra)</option>
                                </select>
                            </div>
                            <button onClick={handleGenerateImage} disabled={isImageLoading || !imagePrompt.trim()} className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                                {isImageLoading ? 'Generating...' : <><PhotoIcon className="w-4 h-4" /> Generate Image</>}
                            </button>
                        </div>
                        {generatedImage && (
                            <div className="relative group rounded-2xl overflow-hidden shadow-lg border border-black/5 dark:border-white/5 bg-black/5">
                                <img src={generatedImage} alt="Generated Visual" className="w-full h-auto object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                                    <a href={generatedImage} download={`visual_${Date.now()}.png`} className="px-4 py-2 bg-white text-black font-bold rounded-full text-xs shadow-xl hover:scale-105 transition-transform">Download</a>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'sketchnotes':
                return (
                    <div className="flex flex-col h-full overflow-y-auto ios-scroll p-1">
                        <div className="p-4 bg-pink-50/50 dark:bg-pink-900/10 rounded-2xl mb-4">
                            <h4 className="font-bold text-pink-900 dark:text-pink-100 mb-2">Visual Sketchnotes</h4>
                            <p className="text-sm text-pink-800 dark:text-pink-200 opacity-80">Generate a structured visual map of concepts.</p>
                            <button onClick={handleGenerateSketchnotes} disabled={isSketchnotesLoading} className="mt-4 w-full py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                                {isSketchnotesLoading ? 'Generating...' : 'Create Sketchnotes'}
                            </button>
                        </div>
                        {sketchnotes && (
                            <div className="relative group mt-2">
                                <div className="p-6 bg-[#fffdf5] dark:bg-[#1e1e1e] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-x-auto">
                                    <pre className="whitespace-pre font-mono text-[10px] sm:text-xs leading-relaxed text-stone-800 dark:text-stone-300" style={{ fontFamily: '"Menlo", "Consolas", "Monaco", monospace' }}>{sketchnotes}</pre>
                                </div>
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => {
                                            const blob = new Blob([sketchnotes], { type: 'text/plain' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `sketchnotes_${Date.now()}.txt`;
                                            a.click();
                                        }}
                                        className="p-2 bg-white dark:bg-zinc-800 text-gray-500 hover:text-blue-500 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 transition-colors"
                                        title="Download as Text"
                                    >
                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(sketchnotes)} 
                                        className="p-2 bg-white dark:bg-zinc-800 text-gray-500 hover:text-blue-500 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 transition-colors"
                                        title="Copy to Clipboard"
                                    >
                                        <ClipboardDocumentIcon className="w-4 h-4" />
                                    </button>
                                </div>
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
                                    <h4 className={`font-bold ${validationResult.isValid ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>{validationResult.isValid ? 'All Checks Passed' : 'Attention Needed'}</h4>
                                </div>
                                <p className="text-xs opacity-80 font-medium ml-9">{validationResult.issues.length} potential issues detected.</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {validationResult.issues.map((issue, idx) => (
                                <div key={idx} className={`p-3 border rounded-xl shadow-sm transition-all cursor-pointer group ${issue.severity === 'error' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-white dark:bg-zinc-800 border-black/5 dark:border-white/5'}`}>
                                    <div className="flex items-start gap-2.5">
                                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${issue.severity === 'error' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-0.5">{issue.type}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug">{issue.message}</p>
                                            <div className="mt-2 flex flex-wrap gap-1">{issue.involvedKeys.map(k => <span key={k} className="text-[10px] bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 font-mono">{k}</span>)}</div>
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
                            { id: 'csv', label: 'CSV Spreadsheet', desc: 'For simple analysis' },
                            { id: 'xlsx', label: 'Excel (XLSX)', desc: 'Multi-sheet workbook' },
                            { id: 'pdf', label: 'PDF Report', desc: 'Formatted with tables' },
                            { id: 'txt', label: 'Text Report', desc: 'Formatted document' }
                        ].map((opt) => (
                            <button key={opt.id} onClick={() => handleExport(opt.id as any)} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-xl hover:border-blue-500/30 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-700 flex items-center justify-center text-gray-500 dark:text-gray-300 group-hover:text-blue-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors"><ArrowDownTrayIcon className="w-5 h-5" /></div>
                                    <div className="text-left"><p className="font-bold text-sm text-gray-800 dark:text-gray-200">{opt.label}</p><p className="text-xs text-gray-500">{opt.desc}</p></div>
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
            className={`relative h-full bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-20 ${isOpen ? 'w-96' : 'w-16 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
            onClick={(e) => { if(!isOpen) { onToggle(); } }}
        >
            <div className="h-full flex flex-col overflow-hidden w-full">
                {/* Header */}
                <div 
                    className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm flex-shrink-0"
                    onClick={(e) => { if(isOpen) e.stopPropagation(); }} 
                >
                    <div className={`transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'mr-3' : 'w-full flex justify-center'}`}>
                        <Tooltip text={isOpen ? "Collapse Panel" : "Expand Studio"} position={isOpen ? "bottom" : "left"}>
                            <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-all flex-shrink-0">
                                {isOpen ? <PanelRightCloseIcon className="w-5 h-5" /> : <PanelRightOpenIcon className="w-5 h-5" />}
                            </button>
                        </Tooltip>
                    </div>
                    
                    <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 pointer-events-none'}`}>
                        {activeTool !== 'menu' && (
                            <button onClick={() => setActiveTool('menu')} className="p-1.5 -ml-2 mr-1 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
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
                                <button onClick={(e) => { e.stopPropagation(); onToggle(); setActiveTool('menu'); }} className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] shadow-inner hover:bg-[#007AFF]/20 transition-colors">
                                    <SparklesIcon className="w-5 h-5" />
                                </button>
                            </Tooltip>
                        </div>
                    )}
                </div>
            </div>
            
            {notification && (
                <Notification 
                    message={notification.message} 
                    type={notification.type} 
                    onClose={() => setNotification(null)} 
                />
            )}
        </aside>
    );
};

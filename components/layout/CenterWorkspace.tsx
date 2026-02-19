
import React, { useState, useEffect, useMemo } from 'react';
import type { ExtractedData, UploadedFile, EntityVerification } from '../../types';
import { validateDocumentLogic, validateConfidence } from '../../utils/validationUtils';
import { flattenObject } from '../../utils/dataAdapter';
import { verifyEntitiesBackground } from '../../services/geminiService';
import type { RegressionReport } from '../../utils/regressionCheck';
import { ExclamationTriangleIcon } from '../icons/ExclamationTriangleIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { TableCellsIcon } from '../icons/TableCellsIcon';
import { CodeBracketIcon } from '../icons/CodeBracketIcon';
import { ListBulletIcon } from '../icons/ListBulletIcon';
import { ArrowUturnLeftIcon } from '../icons/ArrowUturnLeftIcon';
import { ArrowUturnRightIcon } from '../icons/ArrowUturnRightIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { Tooltip } from '../ui/Tooltip';

interface CenterWorkspaceProps {
    initialData: ExtractedData;
    editedData: ExtractedData;
    onDataChange: (data: ExtractedData) => void;
    file: UploadedFile;
    onNewUpload: () => void;
    onReprocess: (data: ExtractedData) => void;
    
    // Version Control Props
    undo?: () => void;
    redo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    onRestore?: () => void;
    regressionAlert?: RegressionReport | null;
}

export const CenterWorkspace: React.FC<CenterWorkspaceProps> = ({ 
    initialData, 
    editedData, 
    onDataChange, 
    file, 
    onNewUpload, 
    onReprocess,
    undo,
    redo,
    canUndo,
    canRedo,
    onRestore,
    regressionAlert
}) => {
    const [activeTab, setActiveTab] = useState<'key_value' | 'grid' | 'json' | 'text'>('key_value');
    const [verifications, setVerifications] = useState<EntityVerification[]>([]);
    
    // Validation Logic (Combined)
    const validationResult = useMemo(() => {
        const logic = validateDocumentLogic(flattenObject(editedData));
        const confidence = validateConfidence(editedData);
        return {
            isValid: logic.isValid && confidence.length === 0,
            issues: [...logic.issues, ...confidence]
        };
    }, [editedData]);
    
    const issueCount = validationResult.issues.length;

    // Entity Verification Effect
    useEffect(() => {
        let mounted = true;
        verifyEntitiesBackground(editedData).then(res => {
            if (mounted) setVerifications(res);
        });
        return () => { mounted = false; };
    }, [editedData.documentType]); 

    return (
        <div className="flex flex-col h-full w-full bg-gray-50/50 dark:bg-black/20">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white font-display">{editedData.documentType}</h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Confidence: {editedData.confidenceScore}%</span>
                            {issueCount > 0 && (
                                <span className="flex items-center gap-1.5 text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    <ExclamationTriangleIcon className="w-3 h-3" />
                                    {issueCount} Issues
                                </span>
                            )}
                            {verifications.length > 0 && (
                                <span className="flex items-center gap-1.5 text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    <ShieldCheckIcon className="w-3 h-3" />
                                    {verifications.filter(v => v.status === 'verified').length} Verified
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Version Ledger Controls */}
                    {(canUndo || canRedo) && (
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800/50 p-1 rounded-xl">
                            <Tooltip text="Undo change" position="bottom">
                                <button onClick={undo} disabled={!canUndo} className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                    <ArrowUturnLeftIcon className="w-4 h-4" />
                                </button>
                            </Tooltip>
                            <Tooltip text="Redo change" position="bottom">
                                <button onClick={redo} disabled={!canRedo} className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                    <ArrowUturnRightIcon className="w-4 h-4" />
                                </button>
                            </Tooltip>
                            {onRestore && (
                                <div className="border-l border-gray-300 dark:border-white/10 mx-1 h-4"></div>
                            )}
                            {onRestore && (
                                <Tooltip text="Restore original baseline" position="bottom">
                                    <button onClick={onRestore} className="p-2 rounded-lg text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-zinc-700 transition-all">
                                        <ClockIcon className="w-4 h-4" />
                                    </button>
                                </Tooltip>
                            )}
                        </div>
                    )}

                    {/* View Controls */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-800/50 p-1 rounded-xl">
                        <button onClick={() => setActiveTab('key_value')} className={`p-2 rounded-lg transition-all ${activeTab === 'key_value' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}>
                            <ListBulletIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setActiveTab('grid')} className={`p-2 rounded-lg transition-all ${activeTab === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}>
                            <TableCellsIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setActiveTab('json')} className={`p-2 rounded-lg transition-all ${activeTab === 'json' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}>
                            <CodeBracketIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setActiveTab('text')} className={`p-2 rounded-lg transition-all ${activeTab === 'text' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}>
                            <DocumentTextIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Regression Alert Banner (Segment 5.5 Rollback Protocol Trigger) */}
            {regressionAlert && (
                <div className={`px-6 py-3 flex items-center justify-between animate-slide-in ${regressionAlert.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>
                    <div className="flex items-center gap-3">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-90">{regressionAlert.severity} Regression Detected</p>
                            <p className="text-sm font-semibold">{regressionAlert.message}</p>
                        </div>
                    </div>
                    {undo && (
                        <button 
                            onClick={undo}
                            className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                            Undo Change
                        </button>
                    )}
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto ios-scroll p-6">
                {activeTab === 'json' && (
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
                            {JSON.stringify(editedData.structuredData, null, 2)}
                        </pre>
                    </div>
                )}
                
                {activeTab === 'text' && (
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm max-w-3xl mx-auto">
                        <div className="prose dark:prose-invert max-w-none">
                            <h3 className="text-xl font-bold mb-4">{editedData.documentType} Extraction</h3>
                            <p className="whitespace-pre-wrap leading-relaxed text-sm">{JSON.stringify(flattenObject(editedData), null, 2)}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'key_value' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Render simple key-value pairs from sections */}
                        {editedData.structuredData.sections?.map((section, idx) => (
                            <div key={idx} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-zinc-800 pb-2">
                                    {section.heading || `Section ${idx + 1}`}
                                </h4>
                                <div className="space-y-3">
                                    {section.content?.map((field, fIdx) => (
                                        <div key={fIdx} className="flex flex-col gap-1">
                                            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{field.label}</label>
                                            <input 
                                                type="text" 
                                                value={String(field.value || '')} 
                                                readOnly 
                                                className="w-full bg-gray-50 dark:bg-zinc-800 border-none rounded-lg text-sm text-gray-800 dark:text-gray-200 p-2 focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'grid' && (
                    <div className="space-y-6">
                        {editedData.structuredData.tables?.map((table, idx) => (
                            <div key={idx} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{table.tableName || `Table ${idx + 1}`}</h4>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                                            <tr>
                                                {(table.headers || Object.keys(table.rows?.[0] || {})).map((header, hIdx) => (
                                                    <th key={hIdx} className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">{header}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                            {table.rows?.map((row, rIdx) => (
                                                <tr key={rIdx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                    {(table.headers || Object.keys(row)).map((header, cIdx) => {
                                                        const cell = row[header];
                                                        const val = typeof cell === 'object' && cell !== null && 'value' in cell ? cell.value : cell;
                                                        return (
                                                            <td key={cIdx} className="px-6 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                                {String(val ?? '')}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                        {(!editedData.structuredData.tables || editedData.structuredData.tables.length === 0) && (
                            <div className="text-center py-10 text-gray-500">No tables detected.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

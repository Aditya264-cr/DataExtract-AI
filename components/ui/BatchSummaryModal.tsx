import React from 'react';
import { Modal } from './Modal';
import type { BatchResult, ExtractedData } from '../../types';
import { DocumentIcon } from '../icons/DocumentIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';

interface BatchSummaryModalProps {
    isOpen: boolean;
    results: BatchResult[];
    onClose: () => void;
    onSelectResult: (data: ExtractedData) => void;
}

export const BatchSummaryModal: React.FC<BatchSummaryModalProps> = ({ isOpen, results, onClose, onSelectResult }) => {
    const successes = results.filter(r => r.status === 'success');
    const failures = results.filter(r => r.status === 'error');

    const handleMainAction = () => {
        if (successes.length > 0 && successes[0].data) {
            onSelectResult(successes[0].data);
        } else {
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Batch Processing Complete">
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="text-lg font-bold">Extraction Summary</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {successes.length} succeeded, {failures.length} failed.
                    </p>
                </div>

                {successes.length > 0 && (
                    <div>
                        <h4 className="flex items-center gap-2 font-semibold text-green-600 dark:text-green-400 mb-2">
                            <CheckCircleIcon className="w-5 h-5" />
                            Successful Extractions ({successes.length})
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {successes.map(({ file, data }) => (
                                <button
                                    key={file.id}
                                    onClick={() => onSelectResult(data!)}
                                    className="w-full flex items-center justify-between text-left p-3 bg-green-50 dark:bg-green-500/10 rounded-lg hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <DocumentIcon className="w-5 h-5 flex-shrink-0 text-green-500" />
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file.file.name}</span>
                                    </div>
                                    <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-transform group-hover:translate-x-1" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {failures.length > 0 && (
                     <div>
                        <h4 className="flex items-center gap-2 font-semibold text-red-600 dark:text-red-400 mb-2">
                            <XCircleIcon className="w-5 h-5" />
                            Failed Extractions ({failures.length})
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {failures.map(({ file, error }) => (
                                <div key={file.id} className="p-3 bg-red-50 dark:bg-red-500/10 rounded-lg">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file.file.name}</p>
                                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error || 'Unknown error'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleMainAction}
                        className="px-8 py-2 text-sm font-semibold bg-[#007AFF] text-white rounded-full hover:shadow-glow-blue-strong"
                    >
                       {successes.length > 0 ? 'Review First Result' : 'Start Over'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
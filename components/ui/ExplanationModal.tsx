
import React from 'react';
import { Modal } from './Modal';
import { LightBulbIcon } from '../icons/LightBulbIcon';

interface ExplanationModalProps {
    isOpen: boolean;
    onClose: () => void;
    target: { fieldName: string; fieldValue?: string } | null;
    explanation: string | null;
    isLoading: boolean;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({ isOpen, onClose, target, explanation, isLoading }) => {
    
    const title = target?.fieldValue 
        ? `Explain: "${target.fieldName}"`
        : "Explain AI Summary";
    
    const question = target?.fieldValue
        ? `Why was the text "${target.fieldValue}" identified as "${target.fieldName}"?`
        : "How was this summary generated?";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div className="p-3 bg-black/5 dark:bg-white/5 rounded-lg">
                    <p className="font-semibold text-gray-700 dark:text-gray-300">{question}</p>
                </div>
                <div className="flex items-start gap-3 pt-2">
                    <div className="flex-shrink-0 mt-1">
                        <LightBulbIcon className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="flex-grow">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">Explanation</h4>
                        {isLoading ? (
                            <div className="space-y-2 mt-2 animate-pulse">
                                <div className="h-4 bg-gray-300/50 dark:bg-zinc-700/50 rounded w-full"></div>
                                <div className="h-4 bg-gray-300/50 dark:bg-zinc-700/50 rounded w-5/6"></div>
                            </div>
                        ) : (
                            <p className="text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                                {explanation || "No explanation could be generated."}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

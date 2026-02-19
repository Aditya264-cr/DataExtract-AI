
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { SparklesIcon } from '../icons/SparklesIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { PencilIcon } from '../icons/PencilIcon';

interface SchemaProposalModalProps {
    isOpen: boolean;
    docType: string;
    proposedFields: string[];
    onConfirm: (fields: string[]) => void;
    onCancel: () => void;
}

export const SchemaProposalModal: React.FC<SchemaProposalModalProps> = ({ 
    isOpen, 
    docType, 
    proposedFields, 
    onConfirm, 
    onCancel 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [fieldsText, setFieldsText] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFieldsText(proposedFields.join(', '));
            setIsEditing(false);
        }
    }, [isOpen, proposedFields]);

    const handleConfirm = () => {
        const finalFields = isEditing 
            ? fieldsText.split(',').map(s => s.trim()).filter(Boolean)
            : proposedFields;
        onConfirm(finalFields);
    };

    return (
        <Modal isOpen={isOpen} onClose={onCancel} title="Extraction Plan">
            <div className="space-y-6 pt-2">
                {/* Header Card */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-5 pointer-events-none">
                        <SparklesIcon className="w-24 h-24 text-blue-600" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest">
                            <SparklesIcon className="w-4 h-4" />
                            AI Analysis Complete
                        </div>
                        <h3 className="text-2xl font-extrabold text-[#1d1d1f] dark:text-white font-display tracking-tight leading-snug">
                            I see this is a "{docType}".
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 font-medium">
                            I recommend extracting the following fields to build a complete record.
                        </p>
                    </div>
                </div>

                {/* Fields Display */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Proposed Schema
                        </label>
                        <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-xs font-bold text-[#007AFF] hover:text-[#0056b3] flex items-center gap-1 transition-colors"
                        >
                            <PencilIcon className="w-3 h-3" />
                            {isEditing ? 'Reset View' : 'Edit Plan'}
                        </button>
                    </div>

                    {isEditing ? (
                        <textarea
                            value={fieldsText}
                            onChange={(e) => setFieldsText(e.target.value)}
                            className="w-full h-40 p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#007AFF] outline-none transition-all text-sm font-medium shadow-sm leading-relaxed"
                            placeholder="Enter fields separated by commas..."
                        />
                    ) : (
                        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-700/50">
                            {proposedFields.map((field, idx) => (
                                <span 
                                    key={idx} 
                                    className="px-3 py-1.5 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 shadow-sm"
                                >
                                    {field}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-4">
                    <button
                        onClick={handleConfirm}
                        className="w-full py-3.5 bg-[#007AFF] hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircleIcon className="w-5 h-5" />
                        Proceed with Extraction
                    </button>
                    <button 
                        onClick={onCancel} 
                        className="text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors py-2"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
};

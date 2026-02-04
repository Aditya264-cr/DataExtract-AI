
import React, { useState } from 'react';
import { Modal } from './Modal';
import type { Preset } from '../../types';
import { SparklesIcon } from '../icons/SparklesIcon';
import { DocumentIcon } from '../icons/DocumentIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

interface ClassificationConfirmationModalProps {
    isOpen: boolean;
    suggestedType: string;
    confidence: number;
    presets: Preset[];
    onConfirm: (docType: string, prompt?: string) => void;
    onCancel: () => void;
}

export const ClassificationConfirmationModal: React.FC<ClassificationConfirmationModalProps> = ({
    isOpen,
    suggestedType,
    confidence,
    presets,
    onConfirm,
    onCancel
}) => {
    const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
    const [customType, setCustomType] = useState('');

    const handleConfirm = () => {
        if (selectedPreset) {
            onConfirm(selectedPreset.docType, selectedPreset.prompt);
        } else if (customType.trim()) {
            onConfirm(customType.trim());
        } else {
            onConfirm(suggestedType);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onCancel} title="Confirm Document Type">
            <div className="space-y-8 pt-2">
                {/* AI Suggestion Card */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-5">
                        <SparklesIcon className="w-24 h-24 text-blue-600" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest">
                            <SparklesIcon className="w-4 h-4" />
                            AI Suggestion
                        </div>
                        <h3 className="text-3xl font-extrabold text-[#1d1d1f] dark:text-white font-display tracking-tight mb-1">
                            {suggestedType}
                        </h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">
                            Confidence: <span className={confidence > 80 ? 'text-green-600' : 'text-orange-500'}>{confidence}%</span>
                        </p>
                        
                        <button
                            onClick={() => onConfirm(suggestedType)}
                            className="w-full py-3.5 bg-[#007AFF] hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                            Confirm as {suggestedType}
                        </button>
                    </div>
                </div>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-200 dark:border-zinc-700"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider">Or choose manually</span>
                    <div className="flex-grow border-t border-gray-200 dark:border-zinc-700"></div>
                </div>

                {/* Presets & Custom */}
                <div className="space-y-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Select from presets:</p>
                    <div className="grid grid-cols-2 gap-3">
                        {presets.map(p => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    setSelectedPreset(p);
                                    setCustomType('');
                                    // Auto-trigger for smoother UX? No, let user confirm at bottom if they want, 
                                    // but actually, clicking a preset usually implies intent.
                                    // To keep it simple, we'll just set state and show a secondary confirm button or just assume click = confirm.
                                    // Let's assume click = confirm for speed.
                                    onConfirm(p.docType, p.prompt);
                                }}
                                className="flex items-center gap-3 p-3 text-left rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                            >
                                <span className="text-2xl">{p.icon}</span>
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">{p.name}</p>
                                    <p className="text-[10px] text-gray-500 truncate">{p.docType}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="pt-2">
                        <label htmlFor="custom-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Or type a custom document type:</label>
                        <div className="flex gap-2">
                            <input
                                id="custom-type"
                                type="text"
                                value={customType}
                                onChange={(e) => {
                                    setCustomType(e.target.value);
                                    setSelectedPreset(null);
                                }}
                                placeholder="e.g., Shipping Manifest"
                                className="flex-grow p-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#007AFF] outline-none transition-all text-sm"
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && customType.trim()) {
                                        onConfirm(customType.trim());
                                    }
                                }}
                            />
                            <button 
                                onClick={() => customType.trim() && onConfirm(customType.trim())}
                                disabled={!customType.trim()}
                                className="px-5 font-bold text-sm bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                            >
                                Set
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center pt-2">
                     <button onClick={onCancel} className="text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                        Cancel Processing
                    </button>
                </div>
            </div>
        </Modal>
    );
};

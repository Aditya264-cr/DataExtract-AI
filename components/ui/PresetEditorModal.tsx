
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Preset } from '../../types';

interface PresetEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (preset: Preset) => void;
    preset: Preset | null;
}

export const PresetEditorModal: React.FC<PresetEditorModalProps> = ({ isOpen, onClose, onSave, preset }) => {
    const [name, setName] = useState('');
    const [docType, setDocType] = useState('');
    const [prompt, setPrompt] = useState('');
    const [icon, setIcon] = useState('📄');

    useEffect(() => {
        if (isOpen) {
            setName(preset?.name || '');
            setDocType(preset?.docType || '');
            setPrompt(preset?.prompt || '');
            setIcon(preset?.icon || '📄');
        }
    }, [isOpen, preset]);

    const handleSave = () => {
        if (name.trim() && prompt.trim()) {
            onSave({
                id: preset?.id || crypto.randomUUID(),
                name: name.trim(),
                docType: docType.trim() || name.trim(), // Fallback to name if docType empty
                prompt: prompt.trim(),
                icon,
            });
        }
    };
    
    const emojiPresets = ['📄', '🧾', '🧑‍💼', '🏦', '📋', '🪪', '📝', '📈', '📊', '📑'];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={preset ? "Edit Preset" : "Create New Preset"}>
            <div className="space-y-6 pt-2">
                <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                         <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Icon</label>
                         <input
                            type="text"
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                            maxLength={2}
                            className="w-16 h-16 text-4xl text-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-3xl focus:ring-2 focus:ring-[#007AFF] outline-none transition-all shadow-inner"
                         />
                         <div className="flex flex-wrap gap-1.5 mt-3 justify-center max-w-[100px]">
                            {emojiPresets.map(e => (
                                <button 
                                    key={e} 
                                    onClick={() => setIcon(e)} 
                                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-lg transition-all ${icon === e ? 'bg-blue-500/20 scale-110' : 'hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                                >
                                    {e}
                                </button>
                            ))}
                         </div>
                    </div>
                    <div className="flex-grow space-y-4">
                        <div>
                            <label htmlFor="preset-name" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                                Preset Name
                            </label>
                            <input
                                type="text"
                                id="preset-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Monthly Invoice"
                                className="w-full pl-5 pr-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full focus:ring-2 focus:ring-[#007AFF] outline-none transition-all text-sm font-medium shadow-sm placeholder-gray-400"
                            />
                        </div>
                        <div>
                            <label htmlFor="preset-doctype" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                                Document Type (AI Context)
                            </label>
                            <input
                                type="text"
                                id="preset-doctype"
                                value={docType}
                                onChange={(e) => setDocType(e.target.value)}
                                placeholder="e.g., Invoice (used by AI for classification)"
                                className="w-full pl-5 pr-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full focus:ring-2 focus:ring-[#007AFF] outline-none transition-all text-sm font-medium shadow-sm placeholder-gray-400"
                            />
                            <p className="text-[11px] text-gray-400 mt-1 pl-2">If left empty, Preset Name will be used.</p>
                        </div>
                        <div>
                            <label htmlFor="preset-prompt" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                                Extraction Prompt
                            </label>
                            <textarea
                                id="preset-prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., Extract vendor, total amount, and all line items."
                                rows={3}
                                className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-[1.5rem] focus:ring-2 focus:ring-[#007AFF] outline-none transition-all resize-none text-sm font-medium shadow-sm placeholder-gray-400"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim() || !prompt.trim()}
                        className="px-8 py-2.5 text-sm font-bold bg-[#007AFF] text-white rounded-full hover:shadow-glow-blue-strong active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        Save Preset
                    </button>
                </div>
            </div>
        </Modal>
    );
};

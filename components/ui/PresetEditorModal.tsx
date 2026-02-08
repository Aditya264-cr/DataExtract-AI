
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Preset } from '../../types';

interface PresetEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (preset: Preset) => void;
    preset: Preset | null;
}

const PRESET_ICONS = [
    // Documents & Data
    '📄', '📑', '🧾', '📋', '📝', '📊', '📈', '📉', '📁', '📂',
    // Finance
    '💰', '💳', '🏦', '💵', '💶', '💷', '🏷️',
    // Legal & Official
    '⚖️', '📜', '🖊️', '🏛️', '🛂', '🔏',
    // Identity & People
    '🪪', '🆔', '🧑‍💼', '👤', '👥',
    // Tech & Industry
    '💻', '⚙️', '🔐', '🏗️', '🏭', '🔌',
    // Logistics & Travel
    '📦', '🚚', '✈️', '🚢', '🏨', '🗺️',
    // Medical & Science
    '🏥', '🩺', '💊', '🧪', '🧬',
    // Education & Misc
    '🎓', '📚', '🔖', '💡', '✨'
];

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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={preset ? "Edit Preset" : "Create New Preset"} size="lg">
            <div className="space-y-6 pt-2">
                <div className="flex flex-col md:flex-row items-start gap-6">
                    {/* Icon Selection Column */}
                    <div className="flex flex-col items-center gap-4 w-full md:w-auto flex-shrink-0">
                         <div className="relative group">
                             <div className="absolute -inset-0.5 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-[2rem] opacity-20 group-hover:opacity-40 transition-opacity blur"></div>
                             <input
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                maxLength={2}
                                className="relative w-24 h-24 text-6xl text-center bg-white dark:bg-zinc-900 border-2 border-white/50 dark:border-white/10 rounded-[1.8rem] focus:ring-4 focus:ring-[#007AFF]/20 focus:border-[#007AFF] outline-none transition-all shadow-xl cursor-text font-color-emoji"
                             />
                             <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                <span className="bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">Type Custom</span>
                             </div>
                         </div>
                         
                         <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-gray-200 dark:border-white/5 w-full md:w-48">
                             <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider text-center">Select Icon</label>
                             <div className="grid grid-cols-4 gap-1.5 max-h-[220px] overflow-y-auto ios-scroll pr-1">
                                {PRESET_ICONS.map(e => (
                                    <button 
                                        key={e} 
                                        onClick={() => setIcon(e)} 
                                        className={`w-9 h-9 flex items-center justify-center rounded-xl text-xl transition-all hover:scale-110 active:scale-95 ${icon === e ? 'bg-white dark:bg-zinc-700 shadow-md ring-2 ring-[#007AFF] z-10 scale-110' : 'hover:bg-white dark:hover:bg-zinc-700 hover:shadow-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white opacity-70 hover:opacity-100'}`}
                                    >
                                        {e}
                                    </button>
                                ))}
                             </div>
                         </div>
                    </div>

                    {/* Form Fields Column */}
                    <div className="flex-grow space-y-5 w-full">
                        <div>
                            <label htmlFor="preset-name" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                                Preset Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="preset-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Monthly Invoice"
                                className="w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-[#007AFF] outline-none transition-all text-sm font-medium shadow-sm placeholder-gray-400 focus:bg-white dark:focus:bg-black"
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
                                className="w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-[#007AFF] outline-none transition-all text-sm font-medium shadow-sm placeholder-gray-400 focus:bg-white dark:focus:bg-black"
                            />
                            <p className="text-[11px] text-gray-400 mt-1.5 pl-2">The AI uses this to classify incoming files. If empty, the Name is used.</p>
                        </div>
                        <div>
                            <label htmlFor="preset-prompt" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                                Extraction Prompt <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="preset-prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., Extract vendor, total amount, and all line items."
                                rows={4}
                                className="w-full p-5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-3xl focus:ring-2 focus:ring-[#007AFF] outline-none transition-all resize-none text-sm font-medium shadow-sm placeholder-gray-400 focus:bg-white dark:focus:bg-black leading-relaxed"
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

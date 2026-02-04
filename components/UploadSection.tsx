
import React, { useState, useCallback, useRef, useContext } from 'react';
import { ArrowUpTrayIcon } from './icons/ArrowUpTrayIcon';
import { SettingsContext } from '../contexts/SettingsContext';
import { Template } from '../types';
import { BookmarkSquareIcon } from './icons/BookmarkSquareIcon';
import { PresetEditorModal } from './ui/PresetEditorModal';
import { Notification } from './ui/Notification';

interface UploadSectionProps {
    onFileChange: (files: File[]) => void;
    selectedTemplate: Template | null;
    onTemplateSelect: (template: Template | null) => void;
    description: string;
    setDescription: (val: string) => void;
    activePresetId: string | null;
    onPresetSelect: (presetId: string, presetPrompt: string) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ 
    onFileChange, 
    activePresetId,
    onPresetSelect,
    description,
    setDescription
}) => {
    const { settings, addPreset } = useContext(SettingsContext);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSavePresetOpen, setIsSavePresetOpen] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    const activePresetName = settings.presets.find(p => p.id === activePresetId)?.name;

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
        else if (e.type === 'dragleave') setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files?.length) onFileChange(Array.from(e.dataTransfer.files));
    }, [onFileChange]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) onFileChange(Array.from(e.target.files));
    };

    const handleSaveCurrentAsPreset = (preset: any) => {
        addPreset(preset);
        setNotification(`Saved preset: ${preset.name}`);
        setIsSavePresetOpen(false);
    };

    const activeClasses = isDragging 
        ? 'border-[#007AFF] bg-white dark:bg-zinc-800 shadow-[0_0_50px_rgba(0,122,255,0.25)] scale-[1.01]' 
        : 'border-white dark:border-white/10 bg-white/70 dark:bg-white/5 hover:border-[#007AFF]/30 hover:bg-white dark:hover:bg-white/10 hover:shadow-2xl';

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center animate-slide-in relative z-10">
            {notification && <Notification message={notification} type="success" onClose={() => setNotification(null)} />}
            
            <div 
                className={`group relative w-full text-center p-16 rounded-[3.5rem] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer border backdrop-blur-2xl shadow-xl ${activeClasses}`}
                onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="flex flex-col items-center justify-center space-y-7 relative z-10">
                    <div className={`p-7 rounded-[2.5rem] bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-white shadow-lg transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isDragging ? 'scale-110 rotate-3' : 'group-hover:scale-110 group-hover:rotate-3'}`}>
                        <ArrowUpTrayIcon className="w-12 h-12" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-extrabold text-[#1d1d1f] dark:text-white font-display tracking-tight">
                            {isDragging ? 'Drop it like it\'s hot' : 'Upload Documents'}
                        </h2>
                        <p className="text-base text-[#86868b] dark:text-gray-300 mt-2 font-medium">
                            {activePresetId ? <span className="text-[#007AFF] font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-xl">Using "{activePresetName}" preset</span> : 'PDF, JPG, PNG, WEBP • Max 10MB'}
                        </p>
                    </div>
                    <div className="px-8 py-3.5 rounded-full bg-gray-50 dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-sm text-sm font-bold text-gray-700 dark:text-gray-100 group-hover:bg-[#007AFF] group-hover:text-white dark:group-hover:bg-[#007AFF] dark:group-hover:text-white transition-all duration-300 uppercase tracking-wide">
                        Browse Files
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" />
                </div>
                
                {/* Decorative sheen */}
                <div className="absolute inset-0 rounded-[3.5rem] bg-gradient-to-tr from-white/0 via-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </div>
            
            {settings.presets?.length > 0 && (
                <div className="w-full mt-14">
                    <h3 className="text-xs font-bold text-[#86868b] dark:text-zinc-500 uppercase tracking-widest mb-6 font-body text-center">
                        Quick Start Presets
                    </h3>
                    <div className="flex flex-wrap justify-center gap-4">
                        {settings.presets.map(preset => (
                            <button key={preset.id} onClick={() => onPresetSelect(preset.id, preset.prompt)}
                                className={`flex items-center gap-3 pl-5 pr-6 py-3 text-sm font-bold rounded-2xl transition-all duration-300 border backdrop-blur-xl ${
                                    activePresetId === preset.id
                                        ? 'bg-[#007AFF] text-white border-transparent shadow-lg shadow-blue-500/30 scale-105'
                                        : 'bg-white/60 dark:bg-white/5 border-white/60 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-white hover:scale-105 hover:shadow-md'
                                }`}
                            >
                                <span className="text-xl">{preset.icon}</span>
                                <span>{preset.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="w-full max-w-2xl mt-14 relative group/input">
                <div className="flex items-center justify-between mb-4 px-2">
                    <label className="text-xs font-bold text-[#86868b] dark:text-zinc-500 uppercase tracking-widest font-body">
                        Refine Context
                    </label>
                    {description.length > 5 && !activePresetId && (
                        <button 
                            onClick={() => setIsSavePresetOpen(true)}
                            className="text-xs font-bold text-[#007AFF] hover:text-[#0051A8] flex items-center gap-1.5 transition-colors bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg"
                        >
                            <BookmarkSquareIcon className="w-3.5 h-3.5" />
                            Save as Preset
                        </button>
                    )}
                </div>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Extract line items and tax summaries, ignoring addresses."
                    className="relative w-full h-28 p-6 bg-white/60 dark:bg-black/20 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl text-base focus:ring-4 focus:ring-[#007AFF]/20 focus:border-[#007AFF] focus:bg-white dark:focus:bg-black/40 outline-none transition-all resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium text-[#1d1d1f] dark:text-gray-200 shadow-sm"
                />
            </div>

            <PresetEditorModal isOpen={isSavePresetOpen} onClose={() => setIsSavePresetOpen(false)} onSave={handleSaveCurrentAsPreset} preset={{ id: '', name: '', docType: '', prompt: description, icon: '📝' }} />
        </div>
    );
};


import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { UploadedFile } from '../../types';
import { DocumentIcon } from '../icons/DocumentIcon';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';
import { PanelLeftCloseIcon } from '../icons/PanelLeftCloseIcon';
import { PanelLeftOpenIcon } from '../icons/PanelLeftOpenIcon';
import { EllipsisVerticalIcon } from '../icons/EllipsisVerticalIcon';
import { useClickOutside } from '../../hooks/useClickOutside';
import { EyeIcon } from '../icons/EyeIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { PhotoIcon } from '../icons/PhotoIcon';
import { Tooltip } from '../ui/Tooltip';

interface SourceItemMenuProps {
    file: UploadedFile;
    onPreview: (fileId: string, heatmap: boolean) => void;
    onRemove: (fileId: string) => void;
}

const SourceItemMenu: React.FC<SourceItemMenuProps> = ({ file, onPreview, onRemove }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    useClickOutside(menuRef, () => setIsOpen(false));
    
    const handleToggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            let left = rect.right + 4;
            // Adjust if menu would go off-screen to the right
            if (left + 192 > window.innerWidth) { // 192 is w-48
                left = rect.left - 192 - 4;
            }
            setMenuPosition({
                top: rect.top,
                left: left
            });
        }
        setIsOpen(p => !p);
    };

    const menuContent = (
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
            }}
            className="w-48 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl rounded-xl shadow-glass z-[100] p-1.5 border border-black/10 dark:border-white/10 animate-fade-in"
        >
            <button
                onClick={(e) => { e.stopPropagation(); onPreview(file.id, false); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-[#007AFF]/10 hover:text-[#007AFF] rounded-lg transition-colors"
            >
                <PhotoIcon className="w-4 h-4" />
                Preview Source
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onPreview(file.id, true); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-[#007AFF]/10 hover:text-[#007AFF] rounded-lg transition-colors"
            >
                <EyeIcon className="w-4 h-4" />
                Show Heatmap
            </button>
            <div className="h-px bg-black/5 dark:bg-white/5 my-1 mx-1"></div>
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(file.id); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
                <TrashIcon className="w-4 h-4" />
                Remove
            </button>
        </div>
    );

    return (
        <div className="flex-shrink-0">
            <Tooltip text="Source options" position="left">
                <button
                    ref={buttonRef}
                    onClick={handleToggleMenu}
                    className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10"
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    aria-label="Source options"
                >
                    <EllipsisVerticalIcon className="w-4 h-4" />
                </button>
            </Tooltip>
            {isOpen && createPortal(menuContent, document.body)}
        </div>
    );
};

interface LeftSidebarProps {
    files: UploadedFile[];
    onRemoveFile: (fileId: string) => void;
    onAddFiles: (files: File[]) => void;
    isOpen: boolean;
    onToggle: () => void;
    selectedFileId: string | null;
    onSelectFile: (fileId: string) => void;
    onPreviewSource: (fileId: string, heatmap: boolean) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ files, onRemoveFile, onAddFiles, isOpen, onToggle, selectedFileId, onSelectFile, onPreviewSource }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <aside 
            className={`relative h-full bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-20 overflow-hidden ${isOpen ? 'w-80' : 'w-14 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
            onClick={(e) => { if(!isOpen) { onToggle(); } }}
        >
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && onAddFiles(Array.from(e.target.files))} multiple className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" />
            
            {/* Header with Absolute Positioning for Smooth Toggle */}
            <div 
                className="h-[68px] flex items-center relative border-b border-black/5 dark:border-white/5 flex-shrink-0"
                onClick={(e) => { if(isOpen) e.stopPropagation(); }} 
            >
                <div className={`absolute left-5 transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest font-display">Sources</h3>
                </div>
                
                <div className={`absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'right-4' : 'left-1/2 -translate-x-1/2'}`}>
                    <Tooltip text={isOpen ? "Collapse" : "Expand"} position="right">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggle(); }}
                            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-all"
                        >
                            {isOpen ? <PanelLeftCloseIcon className="w-5 h-5" /> : <PanelLeftOpenIcon className="w-5 h-5" />}
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-hidden relative w-full">
                {isOpen ? (
                    <div className="absolute inset-0 flex flex-col w-full animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex-grow overflow-y-auto ios-scroll px-3 py-4 space-y-3">
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                className="w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border-2 border-dashed border-gray-300 dark:border-zinc-700 bg-transparent hover:bg-gray-100/50 dark:hover:bg-zinc-800/50"
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-zinc-700/50 text-gray-500 dark:text-gray-400">
                                    <PlusCircleIcon className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Add Source</p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight">PDF, JPG, PNG</p>
                                </div>
                            </button>
                            {files.map(file => (
                                <div
                                    key={file.id}
                                    onClick={() => onSelectFile(file.id)}
                                    className={`group relative flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200 border shadow-sm ${
                                        selectedFileId === file.id 
                                            ? 'bg-white dark:bg-zinc-800 border-black/10 dark:border-white/10 ring-2 ring-[#007AFF]/30' 
                                            : 'bg-white/60 dark:bg-zinc-800/40 border-black/5 dark:border-white/5 hover:bg-white/80 dark:hover:bg-zinc-800/60'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${selectedFileId === file.id ? 'bg-[#007AFF]/10' : 'bg-black/5 dark:bg-zinc-700/50'}`}>
                                            {file.file.type.startsWith('image/') ? <PhotoIcon className="w-5 h-5 text-blue-500" /> : <DocumentIcon className="w-5 h-5 text-red-500" />}
                                        </div>
                                        <div className="truncate min-w-0">
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate font-body">{file.file.name}</p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <SourceItemMenu file={file} onPreview={onPreviewSource} onRemove={onRemoveFile} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center pt-4 space-y-4 w-full animate-fade-in">
                        {files.map(file => (
                            <Tooltip key={file.id} text={file.file.name} position="right">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onSelectFile(file.id); onToggle(); }}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border shadow-sm ${selectedFileId === file.id ? 'bg-[#007AFF] text-white border-transparent' : 'bg-white dark:bg-zinc-800 border-black/5 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                                >
                                    {file.file.type.startsWith('image/') ? <PhotoIcon className="w-5 h-5" /> : <DocumentIcon className="w-5 h-5" />}
                                </button>
                            </Tooltip>
                        ))}
                         <Tooltip text="Quick add source" position="right">
                            <button 
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); if(!isOpen) onToggle(); }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/20 transition-all border border-[#007AFF]/20 shadow-sm"
                            >
                                <PlusCircleIcon className="w-6 h-6" />
                            </button>
                        </Tooltip>
                    </div>
                )}
            </div>
        </aside>
    );
};

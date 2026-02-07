
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
    isVisible: boolean;
}

const SourceItemMenu: React.FC<SourceItemMenuProps> = ({ file, onPreview, onRemove, isVisible }) => {
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
        <div className="flex-shrink-0 relative">
            <Tooltip text="Source options" position="left">
                <button
                    ref={buttonRef}
                    onClick={handleToggleMenu}
                    className={`p-1.5 rounded-full transition-colors ${
                        isVisible || isOpen 
                            ? 'text-gray-500 dark:text-gray-300 bg-black/5 dark:bg-white/10' 
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
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
            className={`relative h-full bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-20 overflow-hidden ${isOpen ? 'w-80' : 'w-16 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
            onClick={(e) => { if(!isOpen) { onToggle(); } }}
        >
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && onAddFiles(Array.from(e.target.files))} multiple className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" />
            
            {/* Pane Header */}
            <div 
                className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm flex-shrink-0"
                onClick={(e) => { if(isOpen) e.stopPropagation(); }} 
            >
                <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest font-display whitespace-nowrap pl-1">Sources</h3>
                </div>
                
                {/* Toggle Button Centered if collapsed, Right if open */}
                <div className={`flex justify-center transition-all duration-500 ${isOpen ? '' : 'w-full'}`}>
                    <Tooltip text={isOpen ? "Collapse" : "Expand"} position="right">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggle(); }}
                            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            {isOpen ? <PanelLeftCloseIcon className="w-5 h-5" /> : <PanelLeftOpenIcon className="w-5 h-5" />}
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Pane Content */}
            <div className="flex-1 overflow-hidden relative w-full bg-gray-50/30 dark:bg-black/10">
                {isOpen ? (
                    <div className="absolute inset-0 flex flex-col w-full animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex-grow overflow-y-auto ios-scroll px-3 py-4 space-y-3">
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                className="w-full flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border border-dashed border-gray-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/30 hover:bg-white dark:hover:bg-zinc-800 hover:border-blue-400 group"
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-500 group-hover:scale-110 transition-transform">
                                    <PlusCircleIcon className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">Add Source</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">PDF, Images</p>
                                </div>
                            </button>
                            
                            {files.map(file => {
                                const isSelected = selectedFileId === file.id;
                                return (
                                    <div
                                        key={file.id}
                                        onClick={() => onSelectFile(file.id)}
                                        className={`group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${
                                            isSelected 
                                                ? 'bg-white dark:bg-zinc-800 border-blue-500/30 ring-1 ring-blue-500/20 shadow-sm' 
                                                : 'bg-white dark:bg-zinc-800/60 border-transparent hover:bg-white hover:border-gray-200 dark:hover:border-zinc-700 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-zinc-700 overflow-hidden border border-gray-100 dark:border-white/5">
                                            {file.file.type.startsWith('image/') ? (
                                                <img src={file.preview} className="w-full h-full object-cover" alt="thumb" />
                                            ) : (
                                                <DocumentIcon className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="truncate min-w-0 flex-1">
                                            <p className={`text-xs font-bold truncate transition-colors ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{file.file.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        
                                        {/* Menu Trigger */}
                                        <div className={`transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <SourceItemMenu file={file} onPreview={onPreviewSource} onRemove={onRemoveFile} isVisible={isSelected} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center pt-4 space-y-3 w-full animate-fade-in">
                        <Tooltip text="Quick add source" position="right">
                            <button 
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); if(!isOpen) onToggle(); }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all shadow-sm mb-2"
                            >
                                <PlusCircleIcon className="w-5 h-5" />
                            </button>
                        </Tooltip>
                        
                        {files.map(file => (
                            <Tooltip key={file.id} text={file.file.name} position="right">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onSelectFile(file.id); onToggle(); }}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${selectedFileId === file.id ? 'bg-white dark:bg-zinc-800 border-blue-500 text-blue-500 shadow-md' : 'bg-white dark:bg-zinc-800/60 border-transparent text-gray-400 hover:text-gray-600 hover:bg-white'}`}
                                >
                                    {file.file.type.startsWith('image/') ? <PhotoIcon className="w-5 h-5" /> : <DocumentIcon className="w-5 h-5" />}
                                </button>
                            </Tooltip>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
};

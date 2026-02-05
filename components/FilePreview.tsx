
import React from 'react';
import type { UploadedFile } from '../types';
import { DocumentIcon } from './icons/DocumentIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';

interface FilePreviewProps {
    files: UploadedFile[];
    onRemoveFile: (fileId: string) => void;
    onAddFiles: (files: File[]) => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ files, onRemoveFile, onAddFiles }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onAddFiles(Array.from(e.target.files));
        }
    };

    return (
        <div className="w-full bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 dark:border-white/10 p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-white/70 dark:hover:bg-zinc-900/50">
            <div className="flex justify-between items-end mb-6 px-1">
                 <div>
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display tracking-tight">Files to Process</h3>
                     <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Ready for analysis</p>
                 </div>
                 <div className="flex items-center">
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        multiple
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                    />
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2.5 rounded-full transition-all shadow-sm active:scale-95 group"
                    >
                        <PlusCircleIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <span>Add More</span>
                    </button>
                 </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
                {files.map(uploadedFile => (
                    <div
                        key={uploadedFile.id}
                        className="group relative flex items-center gap-4 p-3 pr-4 rounded-2xl bg-white/40 dark:bg-black/10 border border-white/50 dark:border-white/5 hover:bg-white/80 dark:hover:bg-white/5 hover:shadow-md hover:border-blue-500/20 transition-all duration-300"
                    >
                        <div className="flex-shrink-0 h-14 w-14 bg-white dark:bg-zinc-800/80 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm">
                            {uploadedFile.file.type.startsWith('image/') ? (
                                <img src={uploadedFile.preview} alt={uploadedFile.file.name} className="h-full w-full object-cover" />
                            ) : (
                                <DocumentIcon className="h-7 w-7 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate mb-0.5">{uploadedFile.file.name}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    {uploadedFile.file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                </span>
                                <span className="text-[10px] font-medium text-gray-400">{(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        </div>
                        <button
                            onClick={() => onRemoveFile(uploadedFile.id)}
                            className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label={`Remove ${uploadedFile.file.name}`}
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

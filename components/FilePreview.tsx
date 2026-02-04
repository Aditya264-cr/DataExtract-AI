
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
        <div className="w-full max-w-3xl mx-auto mt-10">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Files to Process</h3>
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
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-full"
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    <span>Add More Files</span>
                </button>
            </div>
            <div className="space-y-3">
                {files.map(uploadedFile => (
                    <div
                        key={uploadedFile.id}
                        className="bg-black/5 dark:bg-zinc-800/30 backdrop-blur-xl rounded-2xl p-3 flex items-center justify-between border border-white/20 dark:border-zinc-700/50 transition-all duration-300"
                    >
                        <div className="flex items-center gap-4 overflow-hidden">
                             <div className="flex-shrink-0 h-12 w-12 bg-gray-200 dark:bg-zinc-700 rounded-lg flex items-center justify-center">
                                {uploadedFile.file.type.startsWith('image/') ? (
                                    <img src={uploadedFile.preview} alt={uploadedFile.file.name} className="h-full w-full object-cover rounded-lg" />
                                ) : (
                                    <DocumentIcon className="h-7 w-7 text-gray-600 dark:text-gray-400" />
                                )}
                            </div>
                            <div className="truncate">
                                <p className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{uploadedFile.file.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{ (uploadedFile.file.size / 1024 / 1024).toFixed(2) } MB · {uploadedFile.file.type}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onRemoveFile(uploadedFile.id)}
                            className="flex-shrink-0 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
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

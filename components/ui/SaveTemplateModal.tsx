
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { TagIcon } from '../icons/TagIcon';

interface SaveTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setName(''); // Reset name when modal closes
        }
    }, [isOpen]);

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Save as Template">
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create a reusable template from the current data structure. This will help the AI extract data more accurately from similar documents in the future.
                </p>
                <div>
                    <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Template Name
                    </label>
                    <div className="relative">
                         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <TagIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            id="template-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Monthly Invoice - Acme Corp"
                            className="w-full pl-10 p-3 bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-transparent transition-all duration-200 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-semibold bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-zinc-600 active:scale-95 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="px-6 py-2 text-sm font-semibold bg-[#007AFF] text-white rounded-full hover:shadow-glow-blue-strong active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Template
                    </button>
                </div>
            </div>
        </Modal>
    );
};

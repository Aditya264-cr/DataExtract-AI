
import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { WrenchIcon } from './icons/WrenchIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

type UpdateType = 'feature' | 'update' | 'maintenance' | 'announcement';

export interface UpdateItem {
    id: string;
    type: UpdateType;
    title: string;
    description: string;
    date: string;
    isNew: boolean;
    actionLabel?: string;
}

export const mockUpdates: UpdateItem[] = [
    {
        id: 'u-1',
        type: 'feature',
        title: 'AI Sketchnotes',
        description: 'Automatically generate visual study notes from your extracted data. Check the Studio panel.',
        date: 'Just now',
        isNew: true,
        actionLabel: 'Try in Studio'
    },
    {
        id: 'u-2',
        type: 'update',
        title: 'Enhanced Accuracy',
        description: 'Improved extraction model for handwritten text and low-contrast scans.',
        date: '2 days ago',
        isNew: true
    },
    {
        id: 'u-3',
        type: 'maintenance',
        title: 'System Maintenance',
        description: 'Scheduled optimization on Aug 25, 10:00 PM UTC. Expect minimal downtime.',
        date: 'Upcoming',
        isNew: false
    }
];

interface UpdatesPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UpdatesPanel: React.FC<UpdatesPanelProps> = ({ isOpen, onClose }) => {
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const saved = localStorage.getItem('dataextract_updates_dismissed');
        if (saved) {
            setDismissedIds(new Set(JSON.parse(saved)));
        }
    }, []);

    const handleDismiss = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(dismissedIds);
        newSet.add(id);
        setDismissedIds(newSet);
        localStorage.setItem('dataextract_updates_dismissed', JSON.stringify(Array.from(newSet)));
    };

    const handleReset = () => {
        setDismissedIds(new Set());
        localStorage.removeItem('dataextract_updates_dismissed');
    };

    const visibleUpdates = mockUpdates.filter(u => !dismissedIds.has(u.id));

    const getTypeStyles = (type: UpdateType) => {
        switch (type) {
            case 'feature': return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', icon: SparklesIcon };
            case 'update': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: ArrowPathIcon };
            case 'maintenance': return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', icon: WrenchIcon };
            case 'announcement': return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: MegaphoneIcon };
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Updates & Notices" size="lg">
            <div className="space-y-3 pb-2">
                {visibleUpdates.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                            <SparklesIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium">You're all caught up!</p>
                        <button onClick={handleReset} className="mt-4 text-xs font-bold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            View Past Updates
                        </button>
                    </div>
                ) : (
                    visibleUpdates.map((update) => {
                        const style = getTypeStyles(update.type);
                        return (
                            <div key={update.id} className="relative flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-black/20 border border-black/5 dark:border-white/5 hover:border-blue-500/30 transition-colors group">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${style.bg} ${style.text}`}>
                                    <style.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0 pr-6">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{update.title}</h4>
                                        <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">{update.date}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{update.description}</p>
                                    
                                    {update.actionLabel && (
                                        <div className="mt-2">
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                                {update.actionLabel} <ChevronRightIcon className="w-3 h-3" />
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={(e) => handleDismiss(update.id, e)}
                                    className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 rounded-full hover:bg-black/5 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Dismiss"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                                {update.isNew && (
                                    <div className="absolute -left-1 top-4 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white dark:ring-zinc-900"></div>
                                )}
                            </div>
                        );
                    })
                )}
                
                {visibleUpdates.length > 0 && dismissedIds.size > 0 && (
                        <div className="text-center pt-4">
                        <button onClick={handleReset} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 uppercase tracking-widest transition-colors">
                            Show Hidden ({dismissedIds.size})
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};


import React, { useState, useEffect } from 'react';
import { BellIcon } from '../icons/BellIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';
import { WrenchIcon } from '../icons/WrenchIcon';
import { MegaphoneIcon } from '../icons/MegaphoneIcon';
import { XMarkIcon } from '../icons/XMarkIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';

type UpdateType = 'feature' | 'update' | 'maintenance' | 'announcement';

interface UpdateItem {
    id: string;
    type: UpdateType;
    title: string;
    description: string;
    date: string;
    isNew: boolean;
    actionLabel?: string;
}

const mockUpdates: UpdateItem[] = [
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

export const UpdatesBoard: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
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
    const hasNew = visibleUpdates.some(u => u.isNew);

    const getTypeStyles = (type: UpdateType) => {
        switch (type) {
            case 'feature': return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', icon: SparklesIcon };
            case 'update': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: ArrowPathIcon };
            case 'maintenance': return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', icon: WrenchIcon };
            case 'announcement': return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: MegaphoneIcon };
        }
    };

    if (visibleUpdates.length === 0 && isCollapsed) return null; // Hide completely if collapsed and empty? Or show "All caught up"

    return (
        <div className="w-full max-w-3xl mx-auto mb-8 animate-slide-in relative z-20 px-4">
            <div className={`glass-card bg-white/60 dark:bg-zinc-800/60 backdrop-blur-xl border border-white/40 dark:border-white/5 shadow-sm transition-all duration-300 overflow-hidden ${isCollapsed ? 'rounded-2xl' : 'rounded-3xl'}`}>
                {/* Header */}
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            {hasNew && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-800 animate-pulse"></span>}
                        </div>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 font-display">
                            Updates & Notices
                        </h3>
                        {hasNew && !isCollapsed && (
                             <span className="px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-full">New</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                         {visibleUpdates.length === 0 && (
                            <span className="text-xs text-gray-400 font-medium mr-2">All caught up</span>
                         )}
                         <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
                    </div>
                </button>

                {/* Content */}
                {!isCollapsed && (
                    <div className="px-4 pb-4 space-y-3">
                        {visibleUpdates.length === 0 ? (
                            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                <p className="text-sm font-medium">No new updates.</p>
                                <button onClick={handleReset} className="mt-2 text-xs text-blue-500 hover:underline">View History</button>
                            </div>
                        ) : (
                            visibleUpdates.map((update) => {
                                const style = getTypeStyles(update.type);
                                return (
                                    <div key={update.id} className="relative flex items-start gap-4 p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-white/50 dark:border-white/5 hover:border-blue-500/30 transition-colors group">
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
                                            <div className="absolute -left-1 top-4 w-2 h-2 bg-blue-500 rounded-full"></div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        
                        {visibleUpdates.length > 0 && dismissedIds.size > 0 && (
                             <div className="text-center pt-2">
                                <button onClick={handleReset} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 uppercase tracking-widest transition-colors">
                                    Show Hidden
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

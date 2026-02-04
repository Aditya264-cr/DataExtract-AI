
import React from 'react';
import { ChatPanel } from '../ChatPanel';
import type { ExtractedData } from '../../types';
import { PanelRightCloseIcon } from '../icons/PanelRightCloseIcon';
import { PanelRightOpenIcon } from '../icons/PanelRightOpenIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { Tooltip } from '../ui/Tooltip';

interface RightSidebarProps {
    extractedData: ExtractedData;
    isOpen: boolean;
    onToggle: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ extractedData, isOpen, onToggle }) => {
    return (
        <aside 
            className={`relative h-full bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-20 ${isOpen ? 'w-96' : 'w-[4.5rem] cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
            onClick={(e) => { if(!isOpen) { onToggle(); e.stopPropagation(); } }}
        >
            <div className="h-full flex flex-col overflow-hidden w-full">
                {/* Header with Absolute Positioning */}
                <div 
                    className="h-[68px] flex items-center relative border-b border-black/5 dark:border-white/5 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()} 
                >
                    <div className={`absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'left-4' : 'left-1/2 -translate-x-1/2'}`}>
                        <Tooltip text={isOpen ? "Collapse" : "Expand"} position="left">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-all flex-shrink-0"
                            >
                                {isOpen ? <PanelRightCloseIcon className="w-5 h-5" /> : <PanelRightOpenIcon className="w-6 h-6" />}
                            </button>
                        </Tooltip>
                    </div>
                    
                    <div className={`absolute left-14 transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest font-display">Assistant</h3>
                    </div>
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-hidden relative w-full">
                    {isOpen ? (
                        <div className="absolute inset-0 flex flex-col p-6 min-h-0 animate-fade-in w-full" onClick={(e) => e.stopPropagation()}>
                            <ChatPanel extractedData={extractedData} />
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center pt-4 w-full animate-fade-in">
                            <Tooltip text="AI Knowledge Guide" position="left">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                                    className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] shadow-inner hover:bg-[#007AFF]/20 transition-colors"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                </button>
                            </Tooltip>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};


import React, { useContext, useEffect, useState } from 'react';
import { HeaderSettingsIcon } from './icons/HeaderSettingsIcon';
import { HeaderFAQIcon } from './icons/HeaderFAQIcon';
import { HeaderHomeIcon } from './icons/HeaderHomeIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { BellIcon } from './icons/BellIcon';
import { FAQPanel } from './FAQPanel';
import { SettingsPanel } from './SettingsPanel';
import { CopyrightPanel } from './CopyrightPanel';
import { UpdatesPanel, mockUpdates } from './UpdatesPanel';
import { SettingsContext } from '../contexts/SettingsContext';
import { Tooltip } from './ui/Tooltip';

interface HeaderProps {
    onHomeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    onHomeClick
}) => {
    const { activePanel, setActivePanel } = useContext(SettingsContext);
    const [hasUnreadUpdates, setHasUnreadUpdates] = useState(false);

    // Check for unread updates
    useEffect(() => {
        const checkUpdates = () => {
            const dismissed = localStorage.getItem('dataextract_updates_dismissed');
            const dismissedSet = new Set(dismissed ? JSON.parse(dismissed) : []);
            // Update is "new" if it's marked isNew AND hasn't been dismissed
            const hasNew = mockUpdates.some(u => u.isNew && !dismissedSet.has(u.id));
            setHasUnreadUpdates(hasNew);
        };
        
        checkUpdates();
        window.addEventListener('storage', checkUpdates);
        return () => window.removeEventListener('storage', checkUpdates);
    }, [activePanel]); // Re-check when panel changes

    const handleHomeClick = () => { 
        setActivePanel(null); 
        onHomeClick(); 
    };

    const buttonClasses = "p-2.5 rounded-xl text-gray-500 dark:text-gray-300 hover:text-[#007AFF] hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300 active:scale-95 relative";

    return (
        <>
            <header className="sticky top-0 z-50 flex-shrink-0">
                <div className="absolute inset-0 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-md border-b border-white/20 dark:border-white/5"></div>
                <div className="relative container mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {/* Redesigned Logo - Black Background */}
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-lg shadow-black/20 border border-white/10 group cursor-pointer hover:scale-105 transition-transform duration-300" onClick={handleHomeClick}>
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 15l2 2 4-4" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" className="hidden" /> 
                                {/* Sparkle overlay */}
                                <path d="M16 3L16.5 4.5L18 5L16.5 5.5L16 7L15.5 5.5L14 5L15.5 4.5L16 3Z" fill="white" className="animate-pulse" />
                            </svg>
                        </div>
                        {/* Updated Title - DataExtract AI */}
                        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white font-display flex items-center gap-1.5">
                            <span>DataExtract</span>
                            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent font-extrabold drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">AI</span>
                        </h1>
                    </div>

                    <div className="flex items-center space-x-1">
                        <Tooltip text="Go to Home" position="bottom">
                            <button onClick={handleHomeClick} className={buttonClasses}>
                                <HeaderHomeIcon className="w-5 h-5" />
                            </button>
                        </Tooltip>
                        
                        <Tooltip text="Updates & Notices" position="bottom">
                            <button onClick={() => setActivePanel('updates')} className={`${buttonClasses} ${activePanel === 'updates' ? 'text-[#007AFF] bg-white/50 dark:bg-white/10' : ''}`}>
                                <BellIcon className="w-5 h-5" />
                                {hasUnreadUpdates && (
                                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#FF3B30] rounded-full border border-white dark:border-zinc-900 animate-pulse"></span>
                                )}
                            </button>
                        </Tooltip>

                        <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-2"></div>

                        <Tooltip text="Frequently Asked Questions" position="bottom">
                            <button onClick={() => setActivePanel('faq')} className={`${buttonClasses} ${activePanel === 'faq' ? 'text-[#007AFF] bg-white/50 dark:bg-white/10' : ''}`}>
                                <HeaderFAQIcon className="w-5 h-5" />
                            </button>
                        </Tooltip>
                        <Tooltip text="Settings & Preferences" position="bottom">
                            <button onClick={() => setActivePanel('settings')} className={`${buttonClasses} ${activePanel === 'settings' ? 'text-[#007AFF] bg-white/50 dark:bg-white/10' : ''}`}>
                                <HeaderSettingsIcon className="w-5 h-5" />
                            </button>
                        </Tooltip>
                        <Tooltip text="Copyright & Data Ownership" position="bottom">
                            <button onClick={() => setActivePanel('copyright')} className={`${buttonClasses} ${activePanel === 'copyright' ? 'text-[#007AFF] bg-white/50 dark:bg-white/10' : ''}`}>
                                <InformationCircleIcon className="w-5 h-5" />
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </header>
            <FAQPanel isOpen={activePanel === 'faq'} onClose={() => setActivePanel(null)} />
            <SettingsPanel isOpen={activePanel === 'settings'} onClose={() => setActivePanel(null)} />
            <CopyrightPanel isOpen={activePanel === 'copyright'} onClose={() => setActivePanel(null)} />
            <UpdatesPanel isOpen={activePanel === 'updates'} onClose={() => setActivePanel(null)} />
        </>
    );
};

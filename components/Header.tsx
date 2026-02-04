
import React, { useState, useContext } from 'react';
import { HeaderSettingsIcon } from './icons/HeaderSettingsIcon';
import { HeaderFAQIcon } from './icons/HeaderFAQIcon';
import { HeaderHomeIcon } from './icons/HeaderHomeIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { FAQPanel } from './FAQPanel';
import { SettingsPanel } from './SettingsPanel';
import { CopyrightPanel } from './CopyrightPanel';
import { SettingsContext } from '../contexts/SettingsContext';
import { Tooltip } from './ui/Tooltip';

interface HeaderProps {
    onHomeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    onHomeClick
}) => {
    const { setPanelOpen } = useContext(SettingsContext);
    const [isFaqOpen, setIsFaqOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCopyrightOpen, setIsCopyrightOpen] = useState(false);

    const openFaq = () => { setIsSettingsOpen(false); setIsCopyrightOpen(false); setIsFaqOpen(true); setPanelOpen(true); };
    const closeFaq = () => { setIsFaqOpen(false); setPanelOpen(false); };
    
    const openSettings = () => { setIsFaqOpen(false); setIsCopyrightOpen(false); setIsSettingsOpen(true); setPanelOpen(true); };
    const closeSettings = () => { setIsSettingsOpen(false); setPanelOpen(false); };

    const openCopyright = () => { setIsFaqOpen(false); setIsSettingsOpen(false); setIsCopyrightOpen(true); setPanelOpen(true); };
    const closeCopyright = () => { setIsCopyrightOpen(false); setPanelOpen(false); };

    const handleHomeClick = () => { closeFaq(); closeSettings(); closeCopyright(); onHomeClick(); };

    const buttonClasses = "p-2.5 rounded-xl text-gray-500 dark:text-gray-300 hover:text-[#007AFF] hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300 active:scale-95";

    return (
        <>
            <header className="sticky top-0 z-50 flex-shrink-0">
                <div className="absolute inset-0 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-md border-b border-white/20 dark:border-white/5"></div>
                <div className="relative container mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white font-display">
                            DataExtract <span className="opacity-50 font-medium">AI</span>
                        </h1>
                    </div>

                    <div className="flex items-center space-x-1">
                        <Tooltip text="Go to Home" position="bottom">
                            <button onClick={handleHomeClick} className={buttonClasses}>
                                <HeaderHomeIcon className="w-5 h-5" />
                            </button>
                        </Tooltip>
                        <Tooltip text="Frequently Asked Questions" position="bottom">
                            <button onClick={openFaq} className={buttonClasses}>
                                <HeaderFAQIcon className="w-5 h-5" />
                            </button>
                        </Tooltip>
                        <Tooltip text="Settings & Preferences" position="bottom">
                            <button onClick={openSettings} className={buttonClasses}>
                                <HeaderSettingsIcon className="w-5 h-5" />
                            </button>
                        </Tooltip>
                        <Tooltip text="Copyright & Data Ownership" position="bottom">
                            <button onClick={openCopyright} className={buttonClasses}>
                                <InformationCircleIcon className="w-5 h-5" />
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </header>
            <FAQPanel isOpen={isFaqOpen} onClose={closeFaq} />
            <SettingsPanel isOpen={isSettingsOpen} onClose={closeSettings} />
            <CopyrightPanel isOpen={isCopyrightOpen} onClose={closeCopyright} />
        </>
    );
};


import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '../icons/XMarkIcon';
import { useClickOutside } from '../../hooks/useClickOutside';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const wasOpen = useRef(false);
    const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);
    const [showModal, setShowModal] = useState(isOpen);

    useEffect(() => {
        setOverlayRoot(document.getElementById('overlay-root'));
    }, []);

    useClickOutside(modalRef, () => {
        if (isOpen) onClose();
    });

    // Handle exit animation delay to allow fade-out to play
    useEffect(() => {
        if (isOpen) {
            setShowModal(true);
        } else {
            const timer = setTimeout(() => setShowModal(false), 200); // Matches leave duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
            wasOpen.current = true;
        } else if (wasOpen.current) {
            document.body.style.overflow = '';
            wasOpen.current = false;
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
             if (wasOpen.current) {
                document.body.style.overflow = '';
             }
        };
    }, [isOpen, onClose]);

    // Refined iOS-style spring transitions
    // Enter: Fast elastic snap (0.16, 1, 0.3, 1)
    // Leave: Quick clean exit
    const transitionClasses = {
        enter: 'transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]',
        enterFrom: 'opacity-0 scale-95 translate-y-4',
        enterTo: 'opacity-100 scale-100 translate-y-0',
        leave: 'transition-all duration-200 ease-out',
        leaveFrom: 'opacity-100 scale-100 translate-y-0',
        leaveTo: 'opacity-0 scale-95 translate-y-2',
    };
    
    const sizeClasses = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
    };
    
    const currentTransition = isOpen ? `${transitionClasses.enter} ${transitionClasses.enterTo}` : `${transitionClasses.leave} ${transitionClasses.leaveTo}`;
    const initialTransition = isOpen ? transitionClasses.enterFrom : transitionClasses.leaveTo;

    // Heuristic: Larger modals (2xl+) denote complex panels (Settings) which handle their own layout/padding
    const isPanel = ['2xl', '3xl', '4xl'].includes(size);

    const modalContent = (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${showModal ? 'visible' : 'invisible'}`}
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            style={{ overscrollBehavior: 'contain' }} // Prevent background scroll chaining
        >
            {/* Overlay - Frosted Glass Strategy: 12px blur, 10% black opacity */}
            <div 
                className={`fixed inset-0 bg-black/[0.1] backdrop-blur-[12px] transition-opacity duration-500 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
                onClick={onClose} 
                aria-hidden="true"
            ></div>

            {/* Modal Container - Pure White, 24px Corners, Soft Shadow */}
            <div
                ref={modalRef}
                className={`relative w-full transform ${sizeClasses[size]} ${isOpen ? currentTransition : initialTransition}`}
            >
                <div className="flex flex-col max-h-[calc(100vh-4rem)] bg-white dark:bg-zinc-900 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden border border-white/40 dark:border-white/5">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
                        <h2 id="modal-title" className="text-xl font-bold text-[#1d1d1f] dark:text-white tracking-tight font-display">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            aria-label="Close panel"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                    {/* Content Area - conditionally padded for dialogs vs panels */}
                    <div className={`flex-grow overflow-hidden flex flex-col text-gray-700 dark:text-gray-300 ${isPanel ? '' : 'p-6 overflow-y-auto ios-scroll'}`}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );

    if (!overlayRoot) {
        return null;
    }

    return createPortal(modalContent, overlayRoot);
};


import React, { useEffect } from 'react';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';
import { Portal } from './Portal';

interface NotificationProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const Notification: React.FC<NotificationProps> = ({ message, type, onClose, action }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 8000); // Increased duration for complex feedback

        return () => clearTimeout(timer);
    }, [onClose]);

    const isSuccess = type === 'success';
    const isError = type === 'error';
    
    const bgColor = isSuccess 
        ? 'bg-green-500/90' 
        : isError 
            ? 'bg-red-500/90' 
            : 'bg-[#007AFF]/90';

    const Icon = isSuccess ? CheckCircleIcon : isError ? XCircleIcon : CheckCircleIcon;

    return (
        <Portal>
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md pointer-events-auto">
                <div className={`flex items-center justify-between gap-4 text-white font-medium px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-md ${bgColor} animate-slide-in border border-white/20`}>
                    <div className="flex items-center gap-3">
                        <Icon className="w-6 h-6 flex-shrink-0" />
                        <span className="text-sm">{message}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {action && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick();
                                }}
                                className="text-xs font-bold uppercase tracking-wider bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                                {action.label === 'Retry' && <ArrowPathIcon className="w-3.5 h-3.5" />}
                                {action.label}
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            aria-label="Close notification"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

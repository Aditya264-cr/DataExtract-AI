
import React, { useState, useEffect } from 'react';
import type { UploadedFile } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface ProcessingViewProps {
    files: UploadedFile[];
    currentIndex: number | null;
}

const PROCESSING_STEPS = [
    "Analyzing document structure...",
    "Understanding layout and context...",
    "Extracting meaningful data...",
    "Verifying data integrity...",
    "Preparing review-ready output..."
];

export const ProcessingView: React.FC<ProcessingViewProps> = ({ files, currentIndex }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [fade, setFade] = useState(true);
    const isBatch = files.length > 1;

    // Text Rotation Logic
    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false); // Start fade out
            setTimeout(() => {
                setStepIndex((prev) => (prev + 1) % PROCESSING_STEPS.length);
                setFade(true); // Start fade in
            }, 600); // Wait for fade out to complete (matches CSS duration)
        }, 3200); 

        return () => clearInterval(interval);
    }, []);

    const getFileStatus = (index: number) => {
        if (currentIndex === null || index > currentIndex) return 'Queued';
        if (index < currentIndex) return 'Done';
        return 'Processing';
    };

    return (
        <div className="relative flex flex-col items-center justify-center w-full h-[65vh] overflow-hidden">
            {/* --- Atmospheric Background --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Large gentle drifts */}
                <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-[120px] animate-drift-1 mix-blend-multiply dark:mix-blend-screen"></div>
                <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-violet-100/40 dark:bg-violet-900/10 rounded-full blur-[100px] animate-drift-2 mix-blend-multiply dark:mix-blend-screen"></div>
            </div>

            {/* --- Main Processing Card --- */}
            <div className="relative z-10 w-full max-w-[420px]">
                {/* Back Glow (Halo) */}
                <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 blur-2xl rounded-full scale-110 animate-pulse-slow"></div>

                <div className="relative bg-white dark:bg-[#1C1C1E] rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08),0_0_1px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5),0_0_1px_rgba(255,255,255,0.1)] p-10 flex flex-col items-center text-center border border-white/60 dark:border-white/5 overflow-hidden">
                    
                    {/* Subtle Surface Light Sweep */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent dark:via-white/5 skew-x-12 translate-x-[-200%] animate-shine pointer-events-none"></div>

                    {/* --- Breathing Orb Loader --- */}
                    <div className="relative w-16 h-16 mb-8 flex items-center justify-center">
                        {/* Core (Stable) */}
                        <div className="relative z-10 w-3 h-3 bg-[#007AFF] dark:bg-[#0A84FF] rounded-full shadow-[0_0_15px_rgba(0,122,255,0.4)]"></div>
                        
                        {/* Inner Ring (Breathing) */}
                        <div className="absolute inset-0 m-auto w-3 h-3 bg-[#007AFF]/20 dark:bg-[#0A84FF]/20 rounded-full animate-orb-breath-1 blur-[1px]"></div>
                        
                        {/* Outer Ring (Fading) */}
                        <div className="absolute inset-0 m-auto w-3 h-3 bg-[#007AFF]/10 dark:bg-[#0A84FF]/10 rounded-full animate-orb-breath-2 blur-[2px]"></div>
                    </div>

                    {/* --- Text --- */}
                    <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white tracking-tight font-display mb-3 relative z-10">
                        {isBatch ? `Processing Batch (${(currentIndex ?? 0) + 1}/${files.length})` : "Processing Document"}
                    </h2>

                    <div className="h-5 flex items-center justify-center overflow-hidden w-full relative z-10">
                        <p 
                            className={`text-[13px] font-medium text-[#86868b] dark:text-gray-400 transition-all duration-700 ease-in-out transform ${fade ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95'}`}
                        >
                            {PROCESSING_STEPS[stepIndex]}
                        </p>
                    </div>

                    {/* --- Batch Progress (Subtle) --- */}
                    {isBatch && (
                        <div className="w-full mt-8 pt-6 border-t border-gray-100 dark:border-white/5 relative z-10">
                            <div className="flex flex-col gap-2.5 max-h-32 overflow-y-auto ios-scroll pr-1">
                                {files.map((file, index) => {
                                    const status = getFileStatus(index);
                                    const isCurrent = status === 'Processing';
                                    const isDone = status === 'Done';
                                    
                                    return (
                                        <div 
                                            key={file.id} 
                                            className={`flex items-center gap-3 px-2 py-1.5 rounded-lg transition-all duration-500 ${isCurrent ? 'bg-blue-50/80 dark:bg-blue-500/10' : 'opacity-50 grayscale'}`}
                                        >
                                            <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isCurrent ? 'bg-[#007AFF] animate-pulse' : (isDone ? 'bg-[#34C759]' : 'bg-gray-300 dark:bg-gray-600')}`}></div>
                                            <span className={`text-[11px] font-semibold truncate flex-1 text-left ${isCurrent ? 'text-[#1d1d1f] dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {file.file.name}
                                            </span>
                                            {isDone && <CheckCircleIcon className="w-3.5 h-3.5 text-[#34C759]" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Animation Styles */}
            <style>{`
                @keyframes drift-1 {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    50% { transform: translate(-45%, -55%) rotate(10deg); }
                    100% { transform: translate(-50%, -50%) rotate(0deg); }
                }
                @keyframes drift-2 {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    50% { transform: translate(-55%, -45%) rotate(-10deg); }
                    100% { transform: translate(-50%, -50%) rotate(0deg); }
                }
                @keyframes orb-breath-1 {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(3.5); opacity: 0.1; }
                }
                @keyframes orb-breath-2 {
                    0%, 100% { transform: scale(1); opacity: 0; }
                    25% { opacity: 0.2; }
                    50% { transform: scale(5); opacity: 0; }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.05; transform: scale(1); }
                    50% { opacity: 0.12; transform: scale(1.05); }
                }
                @keyframes shine {
                    0% { transform: skewX(-12deg) translateX(-200%); }
                    20% { transform: skewX(-12deg) translateX(200%); }
                    100% { transform: skewX(-12deg) translateX(200%); }
                }
                .animate-drift-1 { animation: drift-1 45s infinite ease-in-out; }
                .animate-drift-2 { animation: drift-2 55s infinite ease-in-out reverse; }
                .animate-orb-breath-1 { animation: orb-breath-1 3s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                .animate-orb-breath-2 { animation: orb-breath-2 3s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.4s; }
                .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
                .animate-shine { animation: shine 8s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

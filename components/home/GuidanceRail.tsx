
import React, { useState, useEffect } from 'react';
import { ArrowUpTrayIcon } from '../icons/ArrowUpTrayIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ProcessingState } from '../../types';

interface GuidanceRailProps {
    fileCount?: number;
    hasPreset?: boolean;
    hasDescription?: boolean;
    processingState?: ProcessingState;
    lastUsedPreset?: string | null;
}

const TIPS = [
    "Drag & drop multiple files to batch process them instantly.",
    "Use 'Presets' to lock in rules for recurring documents.",
    "Check 'Recent Activity' to quickly restore past sessions."
];

export const GuidanceRail: React.FC<GuidanceRailProps> = ({ 
    fileCount = 0, 
    hasPreset = false, 
    hasDescription = false, 
    processingState = 'idle',
    lastUsedPreset 
}) => {
    const [tipIndex, setTipIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setTipIndex((prev) => (prev + 1) % TIPS.length);
                setFade(true);
            }, 500);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    // Determine Step States
    const isProcessing = processingState === 'processing';
    
    // Step 1: Upload
    const uploadState = fileCount > 0 ? 'completed' : 'active';
    
    // Step 2: Preset (Active if files uploaded, Completed if preset selected)
    const presetState = fileCount === 0 ? 'idle' : (hasPreset ? 'completed' : 'active');
    
    // Step 3: Describe (Active if files uploaded, Completed if description exists)
    const describeState = fileCount === 0 ? 'idle' : (hasDescription ? 'completed' : 'active');
    
    // Step 4: Review (Processing state acts as transition to Review)
    const reviewState = isProcessing ? 'processing' : 'idle';

    const renderStep = (
        icon: React.FC<React.SVGProps<SVGSVGElement>>, 
        title: string, 
        description: string, 
        state: 'idle' | 'active' | 'completed' | 'processing',
        delay: string
    ) => {
        const Icon = state === 'completed' ? CheckCircleIcon : icon;
        
        // Visual Style Config
        const styles = {
            idle: "opacity-40 grayscale",
            active: "opacity-100 scale-100",
            completed: "opacity-60",
            processing: "opacity-100 animate-pulse"
        };

        const iconStyles = {
            idle: "bg-gray-100 dark:bg-white/5 text-gray-400 border-transparent",
            active: "bg-white dark:bg-zinc-800 text-[#007AFF] border-[#007AFF]/30 shadow-[0_0_15px_rgba(0,122,255,0.15)]",
            completed: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/30",
            processing: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 border-blue-200 animate-pulse"
        };

        const activeIndicator = state === 'active' && (
            <div className="absolute -left-3 top-1.5 bottom-1.5 w-0.5 bg-[#007AFF] rounded-full shadow-[0_0_8px_#007AFF] animate-fade-in" />
        );

        return (
            <div className={`relative flex items-start gap-3 transition-all duration-500 ease-out group ${styles[state]}`} style={{ transitionDelay: delay }}>
                {activeIndicator}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500 ${iconStyles[state]}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="pt-0.5">
                    <p className={`text-[13px] font-bold transition-colors duration-300 ${state === 'active' ? 'text-[#1d1d1f] dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {title}
                    </p>
                    <p className="text-[11px] text-[#86868b] dark:text-gray-500 leading-snug mt-0.5 font-medium max-w-[180px]">
                        {description}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col w-full space-y-10 animate-fade-in pl-2">
            
            {/* Live Workflow Guide */}
            <div>
                <h4 className="text-[10px] font-bold text-[#86868b] dark:text-zinc-500 uppercase tracking-[0.2em] mb-6 pl-2 opacity-80">
                    Live Workflow
                </h4>
                
                <div className="space-y-7 relative">
                    {/* Connecting Line */}
                    <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gradient-to-b from-gray-200 via-gray-200 to-transparent dark:from-white/5 dark:via-white/5 rounded-full -z-10" />

                    {renderStep(
                        ArrowUpTrayIcon, 
                        "Upload", 
                        "Drop a document — Gemini prepares it instantly.", 
                        uploadState,
                        '0ms'
                    )}
                    
                    {renderStep(
                        SparklesIcon, 
                        "Preset", 
                        "AI selects the best preset automatically.", 
                        presetState,
                        '100ms'
                    )}
                    
                    {renderStep(
                        DocumentTextIcon, 
                        "Describe", 
                        "Tell AI what matters most — extraction adapts.", 
                        describeState,
                        '200ms'
                    )}
                    
                    {renderStep(
                        ShieldCheckIcon, 
                        "Review", 
                        "Verify results, ask questions, or export confidently.", 
                        reviewState,
                        '300ms'
                    )}
                </div>
            </div>

            {/* Smart Hint / Pro Tip */}
            <div className="glass-card p-5 rounded-[1.5rem] border border-white/40 dark:border-white/5 bg-white/30 dark:bg-zinc-800/30 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse" />
                    <h4 className="text-[10px] font-bold text-[#86868b] dark:text-zinc-500 uppercase tracking-widest font-body">
                        AI Tip
                    </h4>
                </div>
                <p className={`text-[12px] text-[#1d1d1f] dark:text-gray-300 leading-relaxed font-medium transition-opacity duration-700 ${fade ? 'opacity-100' : 'opacity-0'}`}>
                    {TIPS[tipIndex]}
                </p>
            </div>
        </div>
    );
};

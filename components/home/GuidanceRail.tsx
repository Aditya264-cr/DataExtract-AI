
import React from 'react';

const workflowSteps = [
    { number: '1', title: 'Upload', description: 'Drop any document or image.' },
    { number: '2', title: 'Preset', description: 'Choose a preset for accuracy.' },
    { number: '3', title: 'Describe', description: 'Refine your extraction goal.' },
    { number: '4', title: 'Review', description: 'Edit, verify, and export.' }
];

interface GuidanceRailProps {
    tip: string;
    lastUsedPreset: string | null;
}

export const GuidanceRail: React.FC<GuidanceRailProps> = ({ tip, lastUsedPreset }) => {
    return (
        <div className="hidden xl:flex flex-col w-64 space-y-8 sticky top-24 animate-fade-in pl-4">
            {/* Workflow Steps */}
            <div>
                <h4 className="text-[11px] font-bold text-[#86868b] dark:text-zinc-500 uppercase tracking-widest mb-4 font-body pl-2">
                    Workflow
                </h4>
                <div className="relative pl-6">
                    {/* Vertical Line */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-gray-200 via-gray-200 to-transparent dark:from-zinc-700 dark:via-zinc-700 rounded-full"></div>
                    
                    {workflowSteps.map((step) => (
                        <div key={step.title} className="relative mb-8 last:mb-0 group">
                            <div className="absolute -left-[19px] top-0.5 w-4 h-4 bg-white dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-600 rounded-full flex items-center justify-center shadow-sm group-hover:border-[#007AFF] group-hover:scale-110 transition-all">
                                <span className="text-[9px] font-bold text-[#86868b] dark:text-gray-400 group-hover:text-[#007AFF]">{step.number}</span>
                            </div>
                            <p className="text-[13px] font-bold text-[#1d1d1f] dark:text-gray-200">{step.title}</p>
                            <p className="text-[12px] text-[#86868b] dark:text-gray-400 leading-snug">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tip */}
            <div className="glass-card p-5 rounded-[1.5rem]">
                <h4 className="text-[11px] font-bold text-[#86868b] dark:text-zinc-500 uppercase tracking-widest mb-2 font-body">
                    Pro Tip
                </h4>
                <p className="text-[13px] text-[#1d1d1f] dark:text-gray-300 leading-relaxed font-medium">{tip}</p>
            </div>
            
            {/* Last Used Preset */}
            {lastUsedPreset && (
                 <div className="glass-card p-5 rounded-[1.5rem]">
                    <h4 className="text-[11px] font-bold text-[#86868b] dark:text-zinc-500 uppercase tracking-widest mb-2 font-body">
                        Recent Preset
                    </h4>
                    <p className="text-[13px] font-bold text-[#007AFF] dark:text-blue-400">{lastUsedPreset}</p>
                </div>
            )}
        </div>
    );
};

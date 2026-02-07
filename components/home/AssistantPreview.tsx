
import React, { useState } from 'react';
import { SparklesIcon } from '../icons/SparklesIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { SwatchIcon } from '../icons/SwatchIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';

interface Feature {
    id: string;
    title: string;
    desc: string;
    details: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    color: string;
    bg: string;
    border: string;
}

const features: Feature[] = [
    {
        id: 'assistant',
        title: 'AI Assistant',
        desc: 'Ask questions, explain data, and verify results.',
        details: 'Chat with your documents to extract specific insights, verify figures, and understand context instantly.',
        icon: SparklesIcon,
        color: 'text-purple-500',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'group-hover:border-purple-200 dark:group-hover:border-purple-800'
    },
    {
        id: 'summary',
        title: 'Smart Summary',
        desc: 'Generate clean, human-readable summaries.',
        details: 'Get a coherent, executive-level summary of any document, highlighting key dates, entities, and financial totals.',
        icon: DocumentTextIcon,
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'group-hover:border-blue-200 dark:group-hover:border-blue-800'
    },
    {
        id: 'sketchnotes',
        title: 'Sketch Notes',
        desc: 'Convert text into visual sketchnotes.',
        details: 'Transform textual content into visual knowledge maps and structured study notes for better retention.',
        icon: SwatchIcon,
        color: 'text-pink-500',
        bg: 'bg-pink-50 dark:bg-pink-900/20',
        border: 'group-hover:border-pink-200 dark:group-hover:border-pink-800'
    },
    {
        id: 'validate',
        title: 'Data Validation',
        desc: 'Check accuracy, confidence, and inconsistencies.',
        details: 'Run automated logic checks to catch math errors, missing fields, and date inconsistencies before you export.',
        icon: ShieldCheckIcon,
        color: 'text-orange-500',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'group-hover:border-orange-200 dark:group-hover:border-orange-800'
    }
];

const FeatureCard: React.FC<{ feature: Feature }> = ({ feature }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div 
            className="group relative h-32 w-full cursor-pointer"
            style={{ perspective: '1000px' }}
            onClick={() => setIsFlipped(!isFlipped)}
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
            onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsFlipped(!isFlipped); } }}
            tabIndex={0}
            role="button"
            aria-label={`View details for ${feature.title}`}
        >
            <div 
                className="relative w-full h-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{ 
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
            >
                {/* Front Face */}
                <div 
                    className={`absolute inset-0 w-full h-full rounded-[1.5rem] bg-white/60 dark:bg-zinc-800/40 border border-white/60 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-xl p-5 flex flex-col justify-center ${feature.border}`}
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${feature.bg} ${feature.color} shadow-sm border border-black/5 dark:border-white/5`}>
                            <feature.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 font-display transition-colors flex items-center justify-between">
                                {feature.title}
                                <div className="p-1 rounded-full bg-black/5 dark:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRightIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                </div>
                            </h4>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed mt-1.5 line-clamp-2">
                                {feature.desc}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Back Face */}
                <div 
                    className="absolute inset-0 w-full h-full rounded-[1.5rem] bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 shadow-xl p-5 flex flex-col justify-center items-center text-center overflow-hidden"
                    style={{ 
                        backfaceVisibility: 'hidden', 
                        transform: 'rotateY(180deg)' 
                    }}
                >
                    {/* Decorative blob */}
                    <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-10 blur-xl ${feature.bg}`} />
                    
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 font-medium leading-relaxed relative z-10">
                        {feature.details}
                    </p>
                </div>
            </div>
        </div>
    );
};

export const AssistantPreview: React.FC = () => {
    return (
        <div className="flex flex-col w-full space-y-8 animate-fade-in pr-2">
            {/* Header Section */}
            <div className="pl-1">
                <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white font-display tracking-tight mb-2">
                    What you can do
                </h3>
                <p className="text-sm text-[#86868b] dark:text-gray-400 font-medium leading-relaxed max-w-xs">
                    Explore powerful tools built into DataExtract AI
                </p>
            </div>

            <div className="space-y-4">
                {features.map((feature) => (
                    <FeatureCard key={feature.id} feature={feature} />
                ))}
            </div>
        </div>
    );
};

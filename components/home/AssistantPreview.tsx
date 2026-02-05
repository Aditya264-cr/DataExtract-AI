
import React, { useContext } from 'react';
import { SparklesIcon } from '../icons/SparklesIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { SwatchIcon } from '../icons/SwatchIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { SettingsContext } from '../../contexts/SettingsContext';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';

const features = [
    {
        id: 'assistant',
        title: 'AI Assistant',
        desc: 'Ask questions, explain data, and verify results.',
        icon: SparklesIcon,
        color: 'text-purple-500',
        bg: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
        id: 'summary',
        title: 'Smart Summary',
        desc: 'Generate clean, human-readable summaries.',
        icon: DocumentTextIcon,
        color: 'text-blue-500',
        bg: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
        id: 'sketchnotes',
        title: 'Sketch Notes',
        desc: 'Convert text into visual sketchnotes.',
        icon: SwatchIcon,
        color: 'text-pink-500',
        bg: 'bg-pink-100 dark:bg-pink-900/20'
    },
    {
        id: 'validate',
        title: 'Data Validation',
        desc: 'Check accuracy, confidence, and inconsistencies.',
        icon: ShieldCheckIcon,
        color: 'text-orange-500',
        bg: 'bg-orange-100 dark:bg-orange-900/20'
    }
];

export const FeatureHub: React.FC = () => {
    const { setActivePanel } = useContext(SettingsContext);

    const handleFeatureClick = (id: string) => {
        // For features, we gently guide the user to upload
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="hidden xl:flex flex-col w-72 space-y-6 sticky top-24 animate-fade-in pr-4">
            {/* Header Section */}
            <div className="pl-1">
                <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white font-display tracking-tight mb-1">
                    What you can do
                </h3>
                <p className="text-sm text-[#86868b] dark:text-gray-400 font-medium">
                    Explore powerful tools built into DataExtract AI
                </p>
            </div>

            <div className="h-px bg-gradient-to-r from-gray-200 via-gray-200 to-transparent dark:from-zinc-700 dark:via-zinc-700 w-full" />

            {/* Stacked Feature Cards */}
            <div className="flex flex-col gap-3">
                {features.map((feature, index) => (
                    <button
                        key={feature.id}
                        onClick={() => handleFeatureClick(feature.id)}
                        className="group flex items-start gap-4 p-3 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-left backdrop-blur-md"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${feature.bg} ${feature.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                            <feature.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 font-display group-hover:text-[#007AFF] transition-colors flex items-center justify-between">
                                {feature.title}
                                <ChevronRightIcon className="w-3 h-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                            </h4>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed mt-0.5 line-clamp-2">
                                {feature.desc}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

// Re-export as AssistantPreview to maintain compatibility if imported elsewhere by that name,
// though mostly used as default import or direct component.
// We rename the export to match the new component name but keep the file name.
export { FeatureHub as AssistantPreview };

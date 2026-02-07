
import React from 'react';
import { ArrowUpTrayIcon } from '../icons/ArrowUpTrayIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { ArrowDownTrayIcon } from '../icons/ArrowDownTrayIcon';

const STEPS = [
    {
        id: 1,
        title: "Upload Documents",
        description: "Drag & drop your files. We support PDF, PNG, and JPG formats for instant processing.",
        icon: ArrowUpTrayIcon,
    },
    {
        id: 2,
        title: "AI Analysis",
        description: "Gemini intelligently identifies fields, tables, and context to extract structured data.",
        icon: SparklesIcon,
    },
    {
        id: 3,
        title: "Review & Export",
        description: "Validate the results and download your data as JSON, Excel, CSV, or formatted Text.",
        icon: ArrowDownTrayIcon,
    }
];

export const HowItWorks: React.FC = () => {
    return (
        <section className="w-full max-w-6xl mx-auto mt-24 mb-24 px-6 relative z-10 animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-center mb-16">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 font-body">
                    Workflow
                </h4>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#1d1d1f] dark:text-white font-display tracking-tight">
                    How DataExtract Works
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                {STEPS.map((step, index) => (
                    <div key={step.id} className="relative flex flex-col items-center text-center group z-10">
                        
                        {/* Connecting Arrow (Desktop Only) */}
                        {index < STEPS.length - 1 && (
                            <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-12 z-0">
                                <svg 
                                    className="w-full h-full text-gray-300 dark:text-zinc-600" 
                                    viewBox="0 0 100 24" 
                                    fill="none" 
                                    preserveAspectRatio="none"
                                >
                                    <defs>
                                        <marker 
                                            id={`arrowhead-${index}`} 
                                            markerWidth="6" 
                                            markerHeight="6" 
                                            refX="5" 
                                            refY="3" 
                                            orient="auto"
                                        >
                                            <path d="M0,0 L6,3 L0,6" fill="currentColor" />
                                        </marker>
                                    </defs>
                                    <path 
                                        d="M0 12 Q 50 -5 95 12" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        strokeDasharray="4 4" 
                                        markerEnd={`url(#arrowhead-${index})`}
                                        vectorEffect="non-scaling-stroke" 
                                    />
                                </svg>
                            </div>
                        )}

                        {/* Numbered Circle - Solid Black */}
                        <div className="w-16 h-16 rounded-full bg-black dark:bg-white flex items-center justify-center text-2xl font-bold text-white dark:text-black shadow-xl mb-6 transform transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1 relative z-10">
                            {step.id}
                        </div>

                        {/* Icon Badge */}
                        <div className="mb-5 p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-all duration-300">
                            <step.icon className="w-6 h-6" />
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 font-display">
                            {step.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto font-medium">
                            {step.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

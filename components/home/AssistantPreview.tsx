
import React from 'react';
import { SparklesIcon } from '../icons/SparklesIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';

const exampleQuestions = [
    "What is the total payable amount?",
    "Summarize this document in 3 bullet points.",
    "Who are the key people mentioned?",
    "Extract all addresses from the page."
];

const trustSignals = [
    { icon: <ShieldCheckIcon className="w-4 h-4" />, text: 'ISO / GDPR / HIPAA Compliant' },
    { icon: <SparklesIcon className="w-4 h-4" />, text: 'Zero R&D Required' },
    { icon: <CheckCircleIcon className="w-4 h-4" />, text: '99.5+% Accuracy' }
];

export const AssistantPreview: React.FC = () => {
    return (
        <div className="hidden xl:flex flex-col w-64 space-y-8 sticky top-24 opacity-90 animate-fade-in pr-4">
            {/* AI Assistant Preview Card */}
            <div className="glass-card p-5 rounded-[1.5rem]">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-[#007AFF]/10 rounded-lg">
                        <SparklesIcon className="w-4 h-4 text-[#007AFF]" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 font-display">AI Assistant</h4>
                </div>
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                    Upload a document to activate the assistant and ask questions about your data.
                </p>
                <div className="space-y-2">
                    {exampleQuestions.map((q, i) => (
                        <div key={i} className="p-2.5 bg-white/40 dark:bg-white/5 rounded-xl border border-white/20 dark:border-white/5 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                            {q}
                        </div>
                    ))}
                </div>
            </div>

            {/* Trust Signals */}
             <div className="space-y-3 pl-2">
                {trustSignals.map((signal, index) => (
                     <div key={index} className="flex items-center gap-2.5 text-xs font-bold text-gray-500 dark:text-gray-400">
                        <div className="text-green-500 dark:text-green-400">{signal.icon}</div>
                        <span>{signal.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

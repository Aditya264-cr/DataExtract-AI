
import React, { useState } from 'react';
import { DocumentIcon } from '../icons/DocumentIcon';
import { PhotoIcon } from '../icons/PhotoIcon';

export interface SampleDoc {
    id: string;
    title: string;
    type: 'PDF' | 'Image';
    description: string;
    filename: string;
    path: string;
    prompt: string;
    thumbnail?: string; // Optional URL for specific thumbnail
}

// To enable samples, place files in public/samples/ and uncomment/add entries here.
const SAMPLES: SampleDoc[] = [
    // {
    //     id: 'sample-1',
    //     title: 'College Checklist',
    //     type: 'Image',
    //     description: 'Handwritten form with checkboxes',
    //     filename: 'handwritten_checklist.png',
    //     path: '/samples/handwritten_checklist.png', 
    //     prompt: 'Extract the checklist items, their checked status, and any additional notes or instructions.',
    //     thumbnail: '/samples/handwritten_checklist.png'
    // },
    // {
    //     id: 'sample-2',
    //     title: 'Product Review',
    //     type: 'Image',
    //     description: 'Handwritten journal entry',
    //     filename: 'handwritten_notes_2.jpg',
    //     path: '/samples/handwritten_notes_2.jpg',
    //     prompt: 'Transcribe the handwritten text exactly as written. Identify the product being reviewed and the sentiment.',
    //     thumbnail: '/samples/handwritten_notes_2.jpg'
    // },
    // {
    //     id: 'sample-3',
    //     title: 'CS Lecture Slides',
    //     type: 'PDF',
    //     description: 'Academic presentation slides',
    //     filename: '6.100L_Lecture_1.pdf',
    //     path: '/samples/6.100L_Lecture_1.pdf',
    //     prompt: 'Summarize the key concepts of computation and algorithms presented in these slides. Extract any code examples.',
    // }
];

interface SampleDocumentsProps {
    onSelectSample: (file: File, prompt: string) => void;
}

export const SampleDocuments: React.FC<SampleDocumentsProps> = ({ onSelectSample }) => {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleSampleClick = async (sample: SampleDoc) => {
        try {
            setLoadingId(sample.id);
            const response = await fetch(sample.path);
            if (!response.ok) throw new Error(`Sample file not found at ${sample.path}`);
            
            const blob = await response.blob();
            // Create a File object from the blob
            const file = new File([blob], sample.filename, { 
                type: sample.type === 'PDF' ? 'application/pdf' : 'image/jpeg',
                lastModified: Date.now()
            });
            
            onSelectSample(file, sample.prompt);
        } catch (error) {
            console.error("Failed to load sample:", error);
            // More user-friendly error
            alert(`Could not load sample file: ${sample.filename}.\n\nPlease ensure sample files are placed in the 'public/samples/' directory.`);
        } finally {
            setLoadingId(null);
        }
    };

    if (SAMPLES.length === 0) return null;

    return (
        <div className="w-full max-w-4xl mx-auto mt-12 px-4 animate-fade-in">
            <div className="flex items-center gap-4 mb-6 pl-2">
                <div className="h-px w-8 bg-gray-300 dark:bg-zinc-700"></div>
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest font-body whitespace-nowrap">
                    Try with Sample Documents
                </h3>
                <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-800"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {SAMPLES.map((sample) => (
                    <button
                        key={sample.id}
                        onClick={() => handleSampleClick(sample)}
                        disabled={loadingId !== null}
                        className="group relative flex flex-col items-start p-5 h-32 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden w-full"
                    >
                        {/* Decorative Background for Images */}
                        {sample.type === 'Image' && (
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                        )}
                        {/* Decorative Background for PDF */}
                        {sample.type === 'PDF' && (
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                        )}

                        <div className="relative z-10 flex flex-col h-full justify-between w-full">
                            <div className="flex items-start justify-between w-full">
                                <div className={`p-2 rounded-lg ${sample.type === 'PDF' ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'bg-blue-50 text-blue-500 dark:bg-blue-900/20'} transition-transform group-hover:scale-110`}>
                                    {sample.type === 'PDF' ? <DocumentIcon className="w-5 h-5" /> : <PhotoIcon className="w-5 h-5" />}
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-white/5 px-2 py-1 rounded-md group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {sample.type}
                                </span>
                            </div>
                            
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {sample.title}
                                </h4>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 font-medium">
                                    {sample.description}
                                </p>
                            </div>
                        </div>

                        {loadingId === sample.id && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 flex items-center justify-center backdrop-blur-sm z-20 transition-opacity duration-200">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};


import React from 'react';
import { Modal } from './ui/Modal';
import { Accordion, AccordionItem } from './ui/Accordion';

const faqContent = [
    {
        sectionTitle: "About DataExtract AI",
        questions: [
            { q: "What is DataExtract AI?", a: "DataExtract AI is a sophisticated web application that uses advanced AI to convert unstructured data from documents and images (like PDFs and photos) into structured, editable formats." },
            { q: "What types of documents does it support?", a: "It supports a wide range of documents including invoices, receipts, business cards, reports, forms, and even handwritten notes." },
            { q: "What AI model is used for extraction?", a: "The application is powered by Google's Gemini family of models to provide state-of-the-art data extraction and analysis." },
        ],
    },
    {
        sectionTitle: "Uploading Files",
        questions: [
            { q: "Which file formats are supported?", a: "You can upload PDF, PNG, JPG, JPEG, and WEBP files." },
            { q: "What is the maximum file size?", a: "The maximum size for any single file is 10MB." },
            { q: "Can I upload multiple files at once?", a: "Yes, you can drag and drop or select multiple files to be processed in a single batch." },
        ],
    },
    {
        sectionTitle: "How Extraction Works",
        questions: [
            { q: "How does DataExtract AI analyze documents?", a: "The AI uses multimodal understanding to analyze both the text and the layout of the document, identifying key-value pairs, tables, and other structures." },
            { q: "What does the confidence score mean?", a: "The confidence score (0-100) represents the AI's certainty in the accuracy of the extracted data. Higher scores indicate greater reliability." },
            { q: "How does the extraction logic work?", a: "We use a two-pass approach: a fast 'Scout' model first maps the document layout, and then a powerful 'Sniper' model performs deep, reasoning-based extraction based on that map." },
        ],
    },
    {
        sectionTitle: "Output & Editing",
        questions: [
            { q: "What output formats are available?", a: "You can view and work with data as JSON, Key-Value pairs, an editable Grid, Markdown, CSV, or formatted Text." },
            { q: "Can I edit extracted data?", a: "Yes, the 'Grid' and 'Key-Value' formats are directly editable. Edited fields are visually highlighted for easy tracking." },
            { q: "What is Split View?", a: "Split View allows you to see the original document side-by-side with the extracted data, making verification much easier." },
        ],
    },
    {
        sectionTitle: "AI Summary",
        questions: [
            { q: "What is the Intelligent Summary?", a: "It is an AI-generated natural language overview of the document, highlighting critical entities, totals, dates, and potential data quality issues." },
            { q: "Can I regenerate the summary?", a: "Yes, if the confidence score is low, you can regenerate the summary to trigger a deeper analysis pass." },
            { q: "How do I interpret confidence badges?", a: "Green indicates high reliability, orange suggests caution, and red implies the summary might be based on ambiguous data." },
        ],
    },
    {
        sectionTitle: "Downloads & Export",
        questions: [
            { q: "How can I export my data?", a: "Click the 'Download' button in the bottom bar to choose from JSON, Excel (XLSX), CSV, Text, PDF, or PNG Image formats." },
            { q: "Can I download individual tables?", a: "Yes, in Grid view, each detected table has a specific download button to export just that table as a CSV." },
        ],
    },
    {
        sectionTitle: "Privacy & Security",
        questions: [
            { q: "Are uploaded files stored?", a: "No, your files are processed in memory and are not stored on our servers. All processing is stateless." },
            { q: "Is my data shared or logged?", a: "Your data privacy is paramount. The content of your documents is not logged or used for any purpose other than providing you with the extraction service for your current session." },
        ],
    },
];

interface FAQPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FAQPanel: React.FC<FAQPanelProps> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Frequently Asked Questions">
            <div className="space-y-8 pb-4">
                {faqContent.map((section) => (
                    <div key={section.sectionTitle} className="animate-fade-in">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 tracking-tight font-display">{section.sectionTitle}</h3>
                        <div className="bg-gray-50/50 dark:bg-zinc-800/30 rounded-2xl overflow-hidden border border-black/5 dark:border-white/5">
                            <Accordion>
                                {section.questions.map((item) => (
                                    <div key={item.q} className="px-4">
                                        <AccordionItem title={item.q}>
                                            {item.a}
                                        </AccordionItem>
                                    </div>
                                ))}
                            </Accordion>
                        </div>
                    </div>
                ))}
            </div>
        </Modal>
    );
};

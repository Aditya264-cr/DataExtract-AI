
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import type { ChatMessage, ExtractedData } from '../types';
import { askDocumentChat } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';
import { flattenObject } from '../utils/dataAdapter';

interface ChatPanelProps {
    extractedData: ExtractedData;
}

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    const hasSources = message.sources && message.sources.length > 0;

    return (
        <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
                {!isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center shadow-inner mt-1">
                        <SparklesIcon className="w-4 h-4 text-[#5856D6]" />
                    </div>
                )}
                <div className={`flex flex-col max-w-[85%] leading-1.5 p-3.5 border border-black/5 dark:border-white/5 ${isUser ? 'bg-[#007AFF] text-white rounded-[1.25rem] rounded-tr-none shadow-sm' : 'bg-gray-100 dark:bg-zinc-700/60 text-gray-800 dark:text-gray-100 rounded-[1.25rem] rounded-tl-none'}`}>
                    <p className="text-sm font-medium whitespace-pre-wrap">{message.content}</p>
                </div>
            </div>
            {hasSources && !isUser && (
                <div className="ml-11 max-w-[85%] animate-fade-in">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Sources</p>
                    <div className="flex flex-wrap gap-2">
                        {message.sources!.map((source, idx) => (
                            <a 
                                key={idx} 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
                            >
                                <GlobeAltIcon className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
                                <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate max-w-[120px]">{source.title}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const ChatPanel: React.FC<ChatPanelProps> = ({ extractedData }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        setMessages([]);
        setInput('');
        setIsLoading(false);
    }, [extractedData]);

    const dynamicSuggestions = useMemo(() => {
        const type = (extractedData.documentType || 'Document').toLowerCase();
        const prompts: Set<string> = new Set();

        // 1. Data Integrity & Structure Checks
        const hasTables = extractedData.structuredData.tables && extractedData.structuredData.tables.length > 0;
        const lowConfidence = extractedData.confidenceScore < 85;

        if (lowConfidence) {
            prompts.add("Why is the confidence score low?");
            prompts.add("Identify fields that need human verification");
        }

        if (hasTables) {
            const tableName = extractedData.structuredData.tables[0].tableName || "the data table";
            prompts.add(`Summarize the rows in ${tableName}`);
            prompts.add(`Calculate column totals for ${tableName}`);
        }

        // 2. Content-Aware Checks (Deep Scan of Keys)
        const flattened = flattenObject(extractedData);
        const keys = Object.keys(flattened).map(k => k.toLowerCase());
        
        if (keys.some(k => k.includes('total') || k.includes('amount') || k.includes('price'))) {
            prompts.add("Verify the mathematical accuracy of the totals");
        }
        if (keys.some(k => k.includes('date'))) {
            prompts.add("Create a timeline of all dates in the document");
        }
        if (keys.some(k => k.includes('address') || k.includes('location'))) {
            prompts.add("List and verify all addresses found");
        }

        // 3. Type-Specific Context
        if (type.includes('invoice') || type.includes('receipt')) {
            prompts.add("Who is the vendor and what is the due date?");
            prompts.add("Break down the taxes applied");
        } else if (type.includes('contract') || type.includes('agreement')) {
            prompts.add("What are the key obligations?");
            prompts.add("List termination conditions");
        } else if (type.includes('resume')) {
            prompts.add("Summarize the candidate's core skills");
            prompts.add("What is the most recent experience?");
        } else if (type.includes('financial')) {
            prompts.add("Summarize the net profit/loss");
            prompts.add("Highlight any financial anomalies");
        }

        // Fallback
        if (prompts.size === 0) {
            prompts.add("Summarize this document");
            prompts.add("List all identified entities");
        }

        // Return top 4 distinct prompts
        return Array.from(prompts).slice(0, 4);
    }, [extractedData]);

    const handleSend = async (messageText?: string) => {
        const query = (messageText || input).trim();
        if (!query) return;

        setInput('');
        const userMessage: ChatMessage = { role: 'user', content: query };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Pass the current messages (history) + the extracted data context
            const { text, sources } = await askDocumentChat(extractedData, query, messages);
            setMessages(prev => [...prev, { role: 'model', content: text, sources }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: 'model', content: "I encountered an issue processing that request. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            <div className="flex-grow space-y-5 overflow-y-auto pr-2 ios-scroll">
                {messages.length === 0 && !isLoading && (
                    <div className="py-4 space-y-6">
                        <div className="text-center">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-1">
                                {extractedData.documentType} Assistant
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[260px] mx-auto leading-relaxed">
                                I have analyzed your document. Select a prompt or ask your own question to explore the data.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            {dynamicSuggestions.map(prompt => (
                                <button
                                    key={prompt}
                                    onClick={() => handleSend(prompt)}
                                    className="text-xs font-bold text-left px-4 py-3 bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-xl hover:bg-[#007AFF]/5 hover:text-[#007AFF] hover:border-[#007AFF]/20 transition-all shadow-sm group"
                                >
                                    <span className="group-hover:translate-x-1 transition-transform inline-block">{prompt}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map((msg, index) => <ChatBubble key={index} message={msg} />)}
                {isLoading && (
                    <div className="flex items-start gap-3 animate-fade-in">
                         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center shadow-inner">
                            <SparklesIcon className="w-4 h-4 text-[#5856D6]" />
                        </div>
                        <div className="flex items-center space-x-1.5 p-3.5 bg-gray-100 dark:bg-zinc-700/60 rounded-2xl rounded-tl-none">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex-shrink-0">
                <div className="relative group">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Ask about your data..."
                        rows={1}
                        className="w-full pl-4 pr-12 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-[1.5rem] focus:ring-2 focus:ring-[#007AFF]/50 focus:border-[#007AFF] transition-all resize-none text-sm font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-2 p-2 bg-[#007AFF] text-white rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-glow-blue-strong active:scale-90"
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

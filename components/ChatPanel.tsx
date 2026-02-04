
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import type { ChatMessage, ExtractedData } from '../types';
import { askDocumentChat } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';

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
        const type = extractedData.documentType.toLowerCase();
        if (type.includes('invoice') || type.includes('receipt')) {
            return ["What is the total payable?", "Is this vendor legitimate?", "Extract line items", "Check invoice currency rates"];
        }
        if (type.includes('resume') || type.includes('cv')) {
            return ["Summarize candidate in 3 points", "Verify company existence", "Key technical skills?", "Contact information"];
        }
        if (type.includes('contract') || type.includes('agreement')) {
            return ["Parties involved?", "Key termination clauses?", "Important dates?", "Summarize main obligations"];
        }
        return ["Summarize in 5 bullet points", "Search for related news", "Identify important dates", "Extract all amounts"];
    }, [extractedData]);

    const handleSend = async (messageText?: string) => {
        const query = (messageText || input).trim();
        if (!query) return;

        setInput('');
        const userMessage: ChatMessage = { role: 'user', content: query };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const { text, sources } = await askDocumentChat(extractedData, query, messages);
            setMessages(prev => [...prev, { role: 'model', content: text, sources }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', content: "Failed to process request." }]);
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
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-1">Knowledge Guide</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Ask questions about your {extractedData.documentType}. <br/> I can also search the web for verification.</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            {dynamicSuggestions.map(prompt => (
                                <button
                                    key={prompt}
                                    onClick={() => handleSend(prompt)}
                                    className="text-xs font-bold text-left px-4 py-3 bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-xl hover:bg-[#007AFF]/5 hover:text-[#007AFF] hover:border-[#007AFF]/20 transition-all shadow-sm"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map((msg, index) => <ChatBubble key={index} message={msg} />)}
                {isLoading && (
                    <div className="flex items-start gap-3">
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
            
            <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5 flex-shrink-0">
                <div className="relative group">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Ask anything..."
                        rows={1}
                        className="w-full pl-4 pr-12 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-[1.5rem] focus:ring-2 focus:ring-[#007AFF]/50 focus:border-[#007AFF] transition-all resize-none text-sm font-medium text-gray-800 dark:text-gray-100"
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

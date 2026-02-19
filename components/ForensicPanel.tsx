
import React from 'react';
import type { ForensicStep } from '../types';

interface ForensicPanelProps {
    reasoning: ForensicStep[];
    onClose: () => void;
}

export const ForensicPanel: React.FC<ForensicPanelProps> = ({ reasoning, onClose }) => {
    return (
        <div className="absolute top-16 right-4 w-96 max-h-[calc(100%-5rem)] bg-zinc-900/95 text-white backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 flex flex-col z-40 overflow-hidden animate-slide-in">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <h3 className="font-mono text-sm font-bold tracking-widest uppercase text-purple-400">Forensic Trace</h3>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto ios-scroll p-4 space-y-6">
                {reasoning.map((item, idx) => (
                    <div key={idx} className="relative pl-4 border-l border-purple-500/30">
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-zinc-900 border border-purple-500" />
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-mono text-[10px] text-purple-400 font-bold uppercase tracking-wider">{item.step}</span>
                            <span className={`text-[9px] font-mono font-bold ${item.confidence > 80 ? 'text-green-400' : 'text-orange-400'}`}>{item.confidence}% Conf</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed font-mono opacity-90">{item.details}</p>
                    </div>
                ))}
                {reasoning.length === 0 && (
                    <div className="text-center py-10 text-zinc-500 font-mono text-xs">
                        No forensic data traces found for this document.<br/>
                        <span className="opacity-50 text-[10px]">The model did not flag specific reasoning steps.</span>
                    </div>
                )}
            </div>
            <div className="p-3 bg-black/20 border-t border-white/5 text-[10px] text-zinc-600 font-mono text-center">
                GENERATED VIA GEMINI 2.0 THINKING PROCESS
            </div>
        </div>
    );
};

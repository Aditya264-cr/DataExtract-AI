
import React from 'react';
import type { Preset } from '../../types';

interface DocTypesProps {
    presets: Preset[];
}

export const DocTypes: React.FC<DocTypesProps> = ({ presets }) => {
    return (
        <section className="w-full max-w-5xl mx-auto mt-24 text-center animate-slide-in relative z-10" style={{ animationDelay: '0.3s' }}>
            <h4 className="text-xs font-bold text-[#86868b] dark:text-gray-500 uppercase tracking-widest mb-4 font-body">
                Use Cases
            </h4>
            <h3 className="text-4xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white font-display">
                Financial and Legal Data — Extracted
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mt-12">
                {presets.map((preset, index) => (
                    <div 
                        key={preset.id}
                        className="glass-card flex flex-col items-center justify-center p-8 rounded-[2rem] hover:scale-105 transition-all duration-300 animate-slide-in group cursor-default"
                        style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                    >
                        <span className="text-5xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">{preset.icon}</span>
                        <p className="mt-5 text-sm font-bold text-[#1d1d1f] dark:text-white tracking-wide uppercase">{preset.name}</p>
                    </div>
                ))}
                 <div 
                    className="flex flex-col items-center justify-center p-8 bg-white/30 dark:bg-white/5 backdrop-blur-md rounded-[2rem] border border-dashed border-gray-300 dark:border-zinc-700 transition-all duration-300 hover:bg-white/50 dark:hover:bg-white/10 animate-slide-in cursor-default"
                    style={{ animationDelay: `${0.4 + presets.length * 0.05}s` }}
                 >
                    <span className="text-5xl filter drop-shadow-md">✨</span>
                    <p className="mt-5 text-sm font-bold text-[#1d1d1f] dark:text-white tracking-wide uppercase">And More</p>
                </div>
            </div>
        </section>
    );
};

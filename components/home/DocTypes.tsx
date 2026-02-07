
import React from 'react';
import type { Preset } from '../../types';

interface DocTypesProps {
    presets: Preset[];
}

export const DocTypes: React.FC<DocTypesProps> = ({ presets }) => {
    return (
        <section className="w-full max-w-6xl mx-auto mt-32 text-center animate-slide-in relative z-10 px-4" style={{ animationDelay: '0.3s' }}>
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-6 font-body">
                Use Cases
            </h4>
            <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white font-display mb-16">
                Financial and Legal Data — Extracted
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {presets.map((preset, index) => (
                    <div 
                        key={preset.id}
                        className="glass-card flex flex-col items-center justify-center p-6 rounded-[2rem] hover:scale-105 hover:shadow-xl transition-all duration-300 animate-slide-in group cursor-default border border-white/60 dark:border-white/5 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-lg aspect-square"
                        style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                    >
                        <span className="text-5xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300 mb-5 select-none">{preset.icon}</span>
                        <p className="text-sm font-bold text-[#1d1d1f] dark:text-gray-100 tracking-wide uppercase text-center font-display leading-snug">{preset.name}</p>
                    </div>
                ))}
                 <div 
                    className="flex flex-col items-center justify-center p-6 bg-white/20 dark:bg-white/5 backdrop-blur-md rounded-[2rem] border border-dashed border-gray-300 dark:border-zinc-700 transition-all duration-300 hover:bg-white/40 dark:hover:bg-white/10 animate-slide-in cursor-default aspect-square"
                    style={{ animationDelay: `${0.4 + presets.length * 0.05}s` }}
                 >
                    <span className="text-5xl filter drop-shadow-sm mb-5 select-none">✨</span>
                    <p className="text-sm font-bold text-[#1d1d1f] dark:text-gray-100 tracking-wide uppercase text-center font-display leading-snug">And More</p>
                </div>
            </div>
        </section>
    );
};


import React from 'react';

interface StatsBarProps {
    docsProcessed: number;
    fieldsExtracted: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ docsProcessed, fieldsExtracted }) => {
    return (
        <section className="w-full max-w-4xl mx-auto mt-12 mb-10 animate-slide-in relative z-10 px-6" style={{ animationDelay: '0.3s' }}>
            <div className="grid grid-cols-2 gap-4 md:gap-8">
                {/* Documents Card */}
                <div className="relative overflow-hidden glass-card p-6 md:p-8 rounded-[2rem] flex flex-col items-center justify-center text-center group hover:scale-[1.02] hover:shadow-glow-blue-strong transition-all duration-500 border border-white/40 dark:border-white/10 bg-white/60 dark:bg-zinc-800/40 backdrop-blur-md">
                    {/* Background Decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent dark:from-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10">
                        <span className="block text-4xl md:text-6xl font-black text-black dark:text-white font-display tracking-tighter mb-1 group-hover:scale-105 transition-transform duration-300">
                            {docsProcessed.toLocaleString()}
                        </span>
                        <span className="block text-[10px] md:text-xs font-extrabold text-black dark:text-white uppercase tracking-[0.2em] font-body opacity-70">
                            Docs Processed
                        </span>
                    </div>
                </div>
                
                {/* Fields Card */}
                <div className="relative overflow-hidden glass-card p-6 md:p-8 rounded-[2rem] flex flex-col items-center justify-center text-center group hover:scale-[1.02] hover:shadow-lg transition-all duration-500 border border-white/40 dark:border-white/10 bg-white/60 dark:bg-zinc-800/40 backdrop-blur-md">
                    {/* Background Decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent dark:from-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10">
                        <span className="block text-4xl md:text-6xl font-black text-black dark:text-white font-display tracking-tighter mb-1 group-hover:scale-105 transition-transform duration-300">
                            {fieldsExtracted.toLocaleString()}
                        </span>
                        <span className="block text-[10px] md:text-xs font-extrabold text-black dark:text-white uppercase tracking-[0.2em] font-body opacity-70">
                            Fields Extracted
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};

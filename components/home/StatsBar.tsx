import React from 'react';

interface StatsBarProps {
    docsProcessed: number;
    fieldsExtracted: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ docsProcessed, fieldsExtracted }) => {
    return (
        <section className="w-full max-w-5xl mx-auto mt-16 mb-12 animate-slide-in relative z-10 px-6" style={{ animationDelay: '0.3s' }}>
            <div className="grid grid-cols-2 gap-6 md:gap-10">
                {/* Documents Card */}
                <div className="relative overflow-hidden glass-card p-8 md:p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center group hover:scale-[1.02] hover:shadow-glow-blue-strong transition-all duration-500 border border-white/40 dark:border-white/10 bg-white/60 dark:bg-zinc-800/40 backdrop-blur-md">
                    {/* Background Decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent dark:from-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10">
                        <span className="block text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#007AFF] to-blue-600 dark:from-blue-400 dark:to-blue-600 font-display tracking-tighter mb-2 group-hover:scale-105 transition-transform duration-300 drop-shadow-sm filter">
                            {docsProcessed.toLocaleString()}
                        </span>
                        <span className="block text-xs md:text-sm font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] font-body opacity-90">
                            Docs Processed
                        </span>
                    </div>
                </div>
                
                {/* Fields Card */}
                <div className="relative overflow-hidden glass-card p-8 md:p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center group hover:scale-[1.02] hover:shadow-lg transition-all duration-500 border border-white/40 dark:border-white/10 bg-white/60 dark:bg-zinc-800/40 backdrop-blur-md">
                    {/* Background Decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent dark:from-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10">
                        <span className="block text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-purple-500 to-indigo-600 dark:from-purple-400 dark:to-indigo-500 font-display tracking-tighter mb-2 group-hover:scale-105 transition-transform duration-300 drop-shadow-sm filter">
                            {fieldsExtracted.toLocaleString()}
                        </span>
                        <span className="block text-xs md:text-sm font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] font-body opacity-90">
                            Fields Extracted
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};
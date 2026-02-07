
import React from 'react';

interface StatsBarProps {
    docsProcessed: number;
    fieldsExtracted: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ docsProcessed, fieldsExtracted }) => {
    return (
        <section className="w-full max-w-5xl mx-auto mt-16 mb-12 animate-slide-in relative z-10 px-6" style={{ animationDelay: '0.3s' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Documents Card */}
                <div className="relative overflow-hidden glass-card p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center group hover:scale-[1.02] hover:shadow-2xl transition-all duration-500 border border-white/40 dark:border-white/10 bg-white/40 dark:bg-zinc-800/30 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <span className="block text-5xl md:text-7xl font-extrabold text-[#1d1d1f] dark:text-white font-display tracking-tighter mb-2 group-hover:translate-y-[-2px] transition-transform duration-300">
                            {docsProcessed.toLocaleString()}
                        </span>
                        <span className="block text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em] font-body opacity-90">
                            Docs Processed
                        </span>
                    </div>
                </div>
                
                {/* Fields Card */}
                <div className="relative overflow-hidden glass-card p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center group hover:scale-[1.02] hover:shadow-2xl transition-all duration-500 border border-white/40 dark:border-white/10 bg-white/40 dark:bg-zinc-800/30 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <span className="block text-5xl md:text-7xl font-extrabold text-[#1d1d1f] dark:text-white font-display tracking-tighter mb-2 group-hover:translate-y-[-2px] transition-transform duration-300">
                            {fieldsExtracted.toLocaleString()}
                        </span>
                        <span className="block text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em] font-body opacity-90">
                            Fields Extracted
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};

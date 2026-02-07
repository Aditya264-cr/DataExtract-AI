
import React, { useState } from 'react';
import { DocumentIcon } from '../icons/DocumentIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { CommandLineIcon } from '../icons/CommandLineIcon';

interface CardData {
    id: number;
    title: string;
    description: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    color: string;
    bg: string;
    gradient: string;
}

const cards: CardData[] = [
    {
        id: 1,
        title: "Diverse File Support",
        description: "Native support for PDFs, DOC/DOCX, and high-res images (PNG, JPG, WEBP). Handles multi-page documents with ease.",
        icon: DocumentIcon,
        color: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        gradient: "from-blue-600 to-cyan-400"
    },
    {
        id: 2,
        title: "99.5%+ Labeling Accuracy",
        description: "High-precision extraction using AI-driven validation and confidence checks to ensure superior data integrity.",
        icon: ShieldCheckIcon,
        color: "text-green-500",
        bg: "bg-green-50 dark:bg-green-900/20",
        gradient: "from-emerald-600 to-green-400"
    },
    {
        id: 3,
        title: "Enterprise Integration",
        description: "API-ready, scalable workflows designed to plug directly into your existing ERP, CRM, or production systems.",
        icon: CommandLineIcon,
        color: "text-purple-500",
        bg: "bg-purple-50 dark:bg-purple-900/20",
        gradient: "from-violet-600 to-purple-400"
    }
];

const FlipCard: React.FC<{ card: CardData }> = ({ card }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div 
            className="group relative h-[340px] w-full cursor-pointer"
            style={{ perspective: '1000px' }}
            onClick={() => setIsFlipped(!isFlipped)}
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
            onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsFlipped(!isFlipped); } }}
            tabIndex={0}
            role="button"
            aria-label={`View details for ${card.title}`}
        >
            <div 
                className="relative w-full h-full transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{ 
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transformStyle: 'preserve-3d' 
                }}
            >
                {/* Front Face */}
                <div 
                    className="absolute inset-0 w-full h-full"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                    <div className="h-full w-full glass-card bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-sm group-hover:shadow-2xl hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-300 backdrop-blur-xl">
                        
                        {/* Large Gradient Number (Replaces Icon) */}
                        <div className="mb-6 transform transition-transform duration-500 group-hover:scale-110">
                            <span className={`text-8xl font-extrabold bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent font-display select-none tracking-tighter drop-shadow-sm`}>
                                0{card.id}
                            </span>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-display tracking-tight">{card.title}</h3>
                        
                        <div className="absolute bottom-8 opacity-0 group-hover:opacity-60 transition-opacity text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Flip for Details
                        </div>
                    </div>
                </div>

                {/* Back Face */}
                <div 
                    className="absolute inset-0 w-full h-full"
                    style={{ 
                        transform: 'rotateY(180deg)', 
                        backfaceVisibility: 'hidden', 
                        WebkitBackfaceVisibility: 'hidden' 
                    }}
                >
                    <div className="h-full w-full bg-white/95 dark:bg-zinc-800/95 border border-gray-100 dark:border-white/10 p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden backdrop-blur-3xl">
                        {/* Decorative background blob */}
                        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl ${card.bg}`}></div>
                        
                        <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Key Benefit</h4>
                        <p className="text-lg font-medium text-gray-800 dark:text-gray-100 leading-relaxed">
                            {card.description}
                        </p>
                        <div className={`mt-8 w-16 h-1.5 rounded-full ${card.color.replace('text-', 'bg-')}`}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ThePlatform: React.FC = () => {
    return (
        <section className="w-full max-w-7xl mx-auto mt-32 mb-32 px-6 relative z-10 animate-slide-in" style={{ animationDelay: '0.25s' }}>
            <div className="text-center mb-20">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-4 font-body">
                    The Platform
                </h4>
                <h2 className="text-4xl md:text-5xl font-extrabold text-[#1d1d1f] dark:text-white font-display tracking-tight mb-6">
                    Effortless AI Integration
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium leading-relaxed">
                    Seamlessly bridge the gap between unstructured documents and actionable business intelligence.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                {cards.map((card) => (
                    <FlipCard key={card.id} card={card} />
                ))}
            </div>
        </section>
    );
};

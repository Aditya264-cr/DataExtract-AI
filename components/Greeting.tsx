
import React, { useContext, useMemo, useEffect, useState } from 'react';
import { useGreeting, GreetingPeriod } from '../hooks/useGreeting';
import { useSeason } from '../hooks/useSeason';
import { SettingsContext } from '../contexts/SettingsContext';

// Engaging sublines configuration
const SUBLINES: Record<GreetingPeriod, string[]> = {
    morning: [
        "Turn fresh documents into clear insights.",
        "Start your day by making sense of data.",
        "Morning clarity for your documents."
    ],
    afternoon: [
        "Keep the momentum going with clarity.",
        "Transform information into understanding.",
        "Power through your documents with ease."
    ],
    evening: [
        "Wrap up your work with confidence.",
        "Let your documents tell their story.",
        "Organize your day's findings effortlessly."
    ],
    night: [
        "Quiet hours, clear thinking.",
        "Understand more, with less effort.",
        "Simplify complexity while the world sleeps."
    ]
};

export const Greeting: React.FC = () => {
    const { word, gradientClasses, glowColor, period } = useGreeting();
    const { seasonalAccent } = useSeason();
    const { history } = useContext(SettingsContext);
    const [mounted, setMounted] = useState(false);
    
    // Subline rotation state
    const [sublineIndex, setSublineIndex] = useState(0);
    const [fadeSubline, setFadeSubline] = useState(true);

    useEffect(() => {
        // Trigger mount animation slightly after render to ensure transition plays
        const timer = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // Rotate sublines
    useEffect(() => {
        const interval = setInterval(() => {
            setFadeSubline(false);
            setTimeout(() => {
                setSublineIndex((prev) => (prev + 1) % SUBLINES[period].length);
                setFadeSubline(true);
            }, 500); // 500ms fade transition
        }, 8000); // 8 seconds per line

        return () => clearInterval(interval);
    }, [period]);

    // Reset on period change
    useEffect(() => {
        setSublineIndex(0);
        setFadeSubline(true);
    }, [period]);

    // Calculate monthly stats from history
    const monthlyCount = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const count = history.filter(h => new Date(h.timestamp) >= startOfMonth).length;
        // Default to 20 if count is 0, per request
        return count === 0 ? 20 : count;
    }, [history]);

    const currentSubline = SUBLINES[period][sublineIndex % SUBLINES[period].length];

    return (
        <div className="w-full max-w-5xl mx-auto my-12 text-center relative z-10 flex flex-col items-center justify-center px-6">
            
            {/* Ambient Aura System - Matches Text Gradient */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] pointer-events-none select-none z-0 transition-opacity duration-1000 ease-out motion-reduce:transition-none" style={{ opacity: mounted ? 1 : 0 }}>
                {/* Primary Time-Based Aura */}
                <div 
                    className={`absolute inset-0 bg-gradient-to-r ${gradientClasses} rounded-full blur-[90px] animate-pulse-slow transition-all duration-[2000ms] motion-reduce:animate-none ${mounted ? 'opacity-30 scale-100' : 'opacity-0 scale-90'}`}
                />
                
                {/* Secondary Seasonal Tint (Subtle Blend) */}
                <div 
                    className={`absolute inset-0 rounded-full blur-[100px] mix-blend-overlay transition-all duration-[2000ms] motion-reduce:transition-none ${mounted ? 'opacity-10' : 'opacity-0'}`}
                    style={{ backgroundColor: seasonalAccent }}
                />
            </div>

            {/* Capability Badge */}
            <div className={`relative mb-8 group z-10 transition-all duration-700 ease-out motion-reduce:transition-none ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div 
                    className="relative px-5 py-1.5 rounded-full border border-[#111827]/5 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-md shadow-md text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.25em] select-none"
                >
                    Explain • Extract • Visualise
                </div>
            </div>

            {/* Main Greeting Hero */}
            <h1 className="relative z-10 text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight font-display mb-6 leading-tight">
                {/* Solid 'Good' */}
                <span 
                    className={`text-[#111827] dark:text-white inline-block transition-all duration-700 ease-out delay-100 motion-reduce:transition-none ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    Good
                </span>
                <span> </span>
                {/* Gradient 'TimePeriod' */}
                <span 
                    key={period}
                    className={`inline-block bg-gradient-to-r ${gradientClasses} bg-clip-text text-transparent pb-1 transition-all duration-700 ease-out delay-200 motion-reduce:transition-none ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    {word}
                </span>
            </h1>

            {/* Rotating Secondary Headline - Color Changed to White */}
            <div className="h-8 flex items-center justify-center mb-8 relative z-10">
                <p 
                    className={`text-lg sm:text-xl text-white font-medium max-w-2xl mx-auto leading-relaxed tracking-wide transition-all duration-700 ease-in-out delay-300 motion-reduce:transition-none transform ${mounted && fadeSubline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    style={{ textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                >
                    {currentSubline}
                </p>
            </div>

            {/* Dynamic Stat Badge */}
            <div 
                className={`relative z-10 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 backdrop-blur-md shadow-sm transition-all duration-700 ease-out delay-[400ms] motion-reduce:transition-none ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} 
            >
                <span className="relative flex h-2 w-2">
                  <span 
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 transition-colors duration-1000 motion-reduce:animate-none"
                    style={{ backgroundColor: glowColor }} 
                  ></span>
                  <span 
                    className="relative inline-flex rounded-full h-2 w-2 transition-colors duration-1000"
                    style={{ backgroundColor: glowColor }}
                  ></span>
                </span>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 tracking-wide font-body">
                    Processed <span className="text-[#111827] dark:text-white font-extrabold">{monthlyCount.toLocaleString()}</span> docs this month
                </span>
            </div>
        </div>
    );
};

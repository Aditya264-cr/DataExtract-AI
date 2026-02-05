
import React, { useState, useEffect } from 'react';

const getSubtitleForTime = (hour: number): string => {
    // Morning: 05:00 – 12:00
    if (hour >= 5 && hour < 12) {
        return "Ready to bring clarity to the day ahead?";
    } 
    // Afternoon: 12:00 – 17:00
    else if (hour >= 12 && hour < 17) {
        return "Keeping the momentum going with clear focus.";
    } 
    // Evening: 17:00 – 21:00
    else if (hour >= 17 && hour < 21) {
        return "Let’s tidy up the details for a fresh tomorrow.";
    } 
    // Night: 21:00 – 05:00
    else {
        return "Quiet hours are perfect for finding clarity.";
    }
};

export const Greeting: React.FC = () => {
    const [timeData, setTimeData] = useState<{ 
        word: string; 
        gradient: string;
    } | null>(null);
    const [subtitle, setSubtitle] = useState<string>("");

    useEffect(() => {
        const hour = new Date().getHours();
        
        let word = "";
        let gradient = "";

        // Morning: Soft sky blue to light cyan
        if (hour >= 5 && hour < 12) {
            word = "Morning";
            gradient = "from-sky-400 to-cyan-300"; 
        } 
        // Afternoon: Warm yellow to orange
        else if (hour >= 12 && hour < 17) {
            word = "Afternoon";
            gradient = "from-yellow-400 to-orange-400";
        } 
        // Evening: Soft orange to pinkish purple
        else if (hour >= 17 && hour < 21) {
            word = "Evening";
            gradient = "from-orange-400 to-fuchsia-500";
        } 
        // Night: Deep indigo to violet
        else {
            word = "Night";
            gradient = "from-indigo-500 to-violet-500";
        }

        setTimeData({ word, gradient });
        setSubtitle(getSubtitleForTime(hour));
    }, []);

    if (!timeData) return null;

    return (
        <div className="w-full max-w-3xl mx-auto my-16 text-center relative z-10 flex flex-col items-center justify-center animate-slide-in">
            {/* Ambient Glow: Matches text gradient exactly */}
            <div 
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-24 bg-gradient-to-r ${timeData.gradient} blur-[60px] opacity-20 dark:opacity-25 rounded-full pointer-events-none select-none`}
                aria-hidden="true"
            />

            {/* Main Greeting */}
            <h2 className="relative text-6xl md:text-7xl font-semibold tracking-tighter font-display mb-6 select-none">
                <span className="text-[#111827] dark:text-white">Good</span>{" "}
                <span className={`bg-gradient-to-r ${timeData.gradient} bg-clip-text text-transparent`}>
                    {timeData.word}
                </span>
            </h2>

            {/* Subtitle */}
            <p className="relative text-lg text-gray-500 dark:text-gray-400 font-medium tracking-wide leading-relaxed max-w-lg mx-auto opacity-90">
                {subtitle}
            </p>
        </div>
    );
};

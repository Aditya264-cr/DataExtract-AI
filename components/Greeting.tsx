
import React, { useState, useEffect } from 'react';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { SunRiseIcon } from './icons/SunRiseIcon';

const getSubtitleForTime = (hour: number): string => {
    let options: string[] = [];
    
    // Morning: 05:00 – 12:00
    if (hour >= 5 && hour < 12) {
        options = [
            "Ready to bring clarity to the day ahead?",
            "A fresh start to get things organized.",
            "Let’s make today count with a clean slate.",
            "Perfect time to get your information in order.",
            "Let's set a productive tone for the day."
        ];
    } 
    // Afternoon: 12:00 – 17:00
    else if (hour >= 12 && hour < 17) {
        options = [
            "Keeping the momentum going with clear focus.",
            "Let’s help you power through the rest of the day.",
            "Making steady progress on what matters most.",
            "Let's get everything sorted and streamlined.",
            "Time to turn busy work into done work."
        ];
    } 
    // Evening: 17:00 – 21:00
    else if (hour >= 17 && hour < 21) {
        options = [
            "Let’s help you wrap things up smoothly.",
            "A calm moment to get everything organized.",
            "Finishing the day with a clear mind.",
            "Let's tidy up the details for a fresh tomorrow.",
            "Getting the last few things settled."
        ];
    } 
    // Night: 21:00 – 05:00
    else {
        options = [
            "Quiet hours are perfect for finding clarity.",
            "We are here to support your late-night focus.",
            "Let's make this late session worth it.",
            "The world is quiet, let's get this sorted.",
            "Here to help you cross the finish line."
        ];
    }
    
    // Fallback
    if (options.length === 0) return "Let’s turn your documents into something clear and useful.";
    
    return options[Math.floor(Math.random() * options.length)];
};

export const Greeting: React.FC = () => {
    const [greeting, setGreeting] = useState<{ text: string; icon: React.ReactNode } | null>(null);
    const [subtitle, setSubtitle] = useState<string>("");

    useEffect(() => {
        const hour = new Date().getHours();
        
        // Determine Greeting
        if (hour >= 5 && hour < 12) {
            setGreeting({ text: "Good Morning", icon: <SunRiseIcon className="w-8 h-8 text-yellow-500/90" /> });
        } else if (hour >= 12 && hour < 17) {
            setGreeting({ text: "Good Afternoon", icon: <SunIcon className="w-8 h-8 text-orange-500/90" /> });
        } else if (hour >= 17 && hour < 21) {
            setGreeting({ text: "Good Evening", icon: <MoonIcon className="w-8 h-8 text-indigo-400/90" /> });
        } else {
            setGreeting({ text: "Good Night", icon: <MoonIcon className="w-8 h-8 text-violet-400/90" /> });
        }

        // Determine Subtitle
        setSubtitle(getSubtitleForTime(hour));
    }, []);

    if (!greeting) return null;

    return (
        <div className="w-full max-w-lg mx-auto my-12 animate-fade-in text-center relative z-10">
            <div className="flex items-center justify-center gap-4 mb-3">
                {greeting.icon}
                <h2 className="text-5xl font-extrabold text-[#1d1d1f] dark:text-white tracking-tighter font-display">
                    {greeting.text}
                </h2>
            </div>
            <p className="text-xl leading-relaxed text-[#86868b] dark:text-gray-400 max-w-[95%] mx-auto font-medium tracking-tight">
                {subtitle}
            </p>
        </div>
    );
};

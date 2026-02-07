
import { useState, useEffect } from 'react';

export type GreetingPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export interface GreetingState {
    period: GreetingPeriod;
    word: string;
    gradientClasses: string;
    glowColor: string; // Kept for compatibility, though gradientClasses is primary
}

// Premium iOS-style Time-based Palettes
const GREETINGS: Record<GreetingPeriod, GreetingState> = {
    morning: {
        period: 'morning',
        word: 'Morning',
        // Bold: Sky 500 to Blue 600
        gradientClasses: 'from-sky-500 to-blue-600', 
        glowColor: '#0EA5E9'
    },
    afternoon: {
        period: 'afternoon',
        word: 'Afternoon',
        // Bold: Amber 500 to Orange 600
        gradientClasses: 'from-amber-500 to-orange-600',
        glowColor: '#F59E0B'
    },
    evening: {
        period: 'evening',
        word: 'Evening',
        // Bold: Orange 500 to Purple 600
        gradientClasses: 'from-orange-500 to-purple-600',
        glowColor: '#F97316'
    },
    night: {
        period: 'night',
        word: 'Night',
        // Bold: Indigo 500 to Violet 600
        gradientClasses: 'from-indigo-500 to-violet-600',
        glowColor: '#6366F1'
    }
};

const getPeriod = (date: Date): GreetingPeriod => {
    const hours = date.getHours();
    
    // Strict Boundary Definitions
    // Morning: 05:00:00 – 11:59:59
    if (hours >= 5 && hours < 12) return 'morning';
    
    // Afternoon: 12:00:00 – 16:59:59
    if (hours >= 12 && hours < 17) return 'afternoon';
    
    // Evening: 17:00:00 – 20:59:59
    if (hours >= 17 && hours < 21) return 'evening';
    
    // Night: 21:00:00 – 04:59:59 (Handles 21-23 and 0-4)
    return 'night';
};

/**
 * Hook to provide time-reactive greeting state.
 * Guaranteed to update exactly at second boundaries.
 */
export const useGreeting = () => {
    const [greeting, setGreeting] = useState<GreetingState>(() => GREETINGS[getPeriod(new Date())]);

    useEffect(() => {
        let timerId: number | undefined;

        const update = () => {
            const now = new Date();
            const currentPeriod = getPeriod(now);
            
            setGreeting(prev => {
                if (prev.period !== currentPeriod) {
                    return GREETINGS[currentPeriod];
                }
                return prev;
            });

            // Calculate delay to align with the next exact second boundary
            const msToNextSecond = 1000 - now.getMilliseconds();
            
            // Schedule next check
            timerId = window.setTimeout(update, msToNextSecond);
        };

        // Start the loop
        update();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                update();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearTimeout(timerId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return greeting;
};

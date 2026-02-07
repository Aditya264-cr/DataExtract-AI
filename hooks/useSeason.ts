
import { useContext, useMemo } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';

type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// Define seasonal color palettes for ambient background blobs and accents
const SEASONAL_CONFIG: Record<Season, { blob1: string; blob2: string; blob3: string; accent: string }> = {
    spring: {
        blob1: 'bg-green-100 dark:bg-green-900/20',
        blob2: 'bg-emerald-100 dark:bg-emerald-900/20',
        blob3: 'bg-orange-50 dark:bg-orange-900/10',
        accent: '#34D399' // Emerald 400 - Fresh & Vital
    },
    summer: {
        blob1: 'bg-yellow-100 dark:bg-yellow-900/20',
        blob2: 'bg-sky-100 dark:bg-sky-900/20',
        blob3: 'bg-cyan-100 dark:bg-cyan-900/20',
        accent: '#FBBF24' // Amber 400 - Warm & Bright
    },
    autumn: {
        blob1: 'bg-orange-100 dark:bg-orange-900/20',
        blob2: 'bg-amber-100 dark:bg-amber-900/20',
        blob3: 'bg-stone-200 dark:bg-stone-800/40',
        accent: '#FB923C' // Orange 400 - Earthy & Rich
    },
    winter: {
        blob1: 'bg-blue-100 dark:bg-blue-900/20',
        blob2: 'bg-indigo-100 dark:bg-indigo-900/20',
        blob3: 'bg-slate-200 dark:bg-slate-800/40',
        accent: '#60A5FA' // Blue 400 - Cool & Crisp
    }
};

const getAutoSeason = (): Season => {
    const month = new Date().getMonth(); // 0-11
    
    // Northern Hemisphere meteorological seasons
    // Spring: Mar (2) - May (4)
    if (month >= 2 && month <= 4) return 'spring';
    // Summer: Jun (5) - Aug (7)
    if (month >= 5 && month <= 7) return 'summer';
    // Autumn: Sep (8) - Nov (10)
    if (month >= 8 && month <= 10) return 'autumn';
    // Winter: Dec (11), Jan (0), Feb (1)
    return 'winter';
};

export const useSeason = () => {
    const { settings } = useContext(SettingsContext);

    const activeSeason = useMemo((): Season => {
        if (settings.season !== 'auto') {
            return settings.season as Season;
        }
        return getAutoSeason();
    }, [settings.season]);

    const config = SEASONAL_CONFIG[activeSeason];

    return {
        activeSeason,
        blobStyles: {
            blob1: config.blob1,
            blob2: config.blob2,
            blob3: config.blob3
        },
        seasonalAccent: config.accent
    };
};

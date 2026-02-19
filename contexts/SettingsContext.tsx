
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Template, Preset } from '../types';
import { audioAgent } from '../services/audioAgent';

type Settings = {
    // Appearance
    theme: 'light' | 'dark' | 'system';
    glassIntensity: 'low' | 'medium' | 'high';
    season: 'auto' | 'spring' | 'summer' | 'autumn' | 'winter';
    
    // Output
    defaultView: 'json' | 'text' | 'key_value' | 'grid';
    showSummary: boolean;
    showConfidence: boolean;
    showWatermark: boolean;

    // Extraction
    autoDetectDocType: boolean;
    highlightLowConfidence: boolean;
    enableValidation: boolean;

    // Upload
    allowMultipleUploads: boolean;
    autoStart: boolean;

    // Language & Accessibility
    documentLanguage: string;
    highContrast: boolean;
    tooltipsEnabled: boolean;
    soundEnabled: boolean; // New Setting

    // Data & Privacy
    savePreferences: boolean;
    
    // System Mode
    systemMode: 'STANDARD' | 'PROFESSIONAL' | 'ENTERPRISE';

    // Data
    templates: Template[];
    presets: Preset[];
};

export type ActivePanel = 'settings' | 'faq' | 'copyright' | 'updates' | null;

type SettingsContextType = {
    settings: Settings;
    history: any[];
    activePanel: ActivePanel;
    setActivePanel: (panel: ActivePanel) => void;
    updateSetting: (key: keyof Settings, value: any) => void;
    addTemplate: (template: Template) => void;
    deleteTemplate: (templateId: string) => void;
    addPreset: (preset: Preset) => void;
    updatePreset: (preset: Preset) => void;
    deletePreset: (presetId: string) => void;
    resetPresetsToDefault: () => void;
    addToHistory: (entry: any) => void;
    clearHistory: () => void;
};

const SETTINGS_KEY = 'dataextract_settings';
const HISTORY_KEY = 'extraction_history';

const defaultPresets: Preset[] = [
    { id: 'preset-1', name: 'Standard Invoice', docType: 'Invoice', icon: '🧾', prompt: 'Extract vendor name, invoice number, total amount, due date, and all line items. Clean and standardize all numeric values.' },
    { id: 'preset-2', name: 'Resume / CV', docType: 'Resume', icon: '🧑‍💼', prompt: 'Extract contact information (name, email, phone), work experience, education, and skills. Normalize dates to standard format.' },
    { id: 'preset-3', name: 'Legal Contract', docType: 'Contract', icon: '📄', prompt: 'Identify and extract specific clauses, terms, and standards. Organize into sections for "Obligations", "Termination", and "Governing Law".' },
    { id: 'preset-4', name: 'Technical Spec', docType: 'Technical Specification', icon: '⚙️', prompt: 'Analyze technical drawing or datasheet. Extract standards, dimensions, and compliance clauses. Clean any visual OCR artifacts.' },
];

const defaultSettings: Settings = {
    theme: 'system',
    glassIntensity: 'medium',
    season: 'auto',
    defaultView: 'key_value',
    showSummary: true,
    showConfidence: true,
    showWatermark: true,
    autoDetectDocType: true,
    highlightLowConfidence: true,
    enableValidation: true,
    allowMultipleUploads: true,
    autoStart: false,
    documentLanguage: 'auto',
    highContrast: false,
    tooltipsEnabled: true,
    soundEnabled: true, // Default to ON for the experience
    savePreferences: true,
    systemMode: 'PROFESSIONAL',
    templates: [],
    presets: defaultPresets,
};

export const SettingsContext = createContext<SettingsContextType>({
    settings: defaultSettings,
    history: [],
    activePanel: null,
    setActivePanel: () => {},
    updateSetting: () => {},
    addTemplate: () => {},
    deleteTemplate: () => {},
    addPreset: () => {},
    updatePreset: () => {},
    deletePreset: () => {},
    resetPresetsToDefault: () => {},
    addToHistory: () => {},
    clearHistory: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            const savedSettings = localStorage.getItem(SETTINGS_KEY);
            const initial = savedSettings ? JSON.parse(savedSettings) : null;
            
            if (initial) {
                const merged = { ...defaultSettings, ...initial };
                if (!Array.isArray(initial.presets)) {
                    merged.presets = defaultPresets;
                }
                if (!merged.systemMode) merged.systemMode = 'PROFESSIONAL';
                if (!merged.season) merged.season = 'auto';
                if (merged.showWatermark === undefined) merged.showWatermark = true;
                if (merged.soundEnabled === undefined) merged.soundEnabled = true;
                
                // Backwards compatibility for old 'darkMode' boolean if it exists
                if (initial.darkMode !== undefined && !initial.theme) {
                    merged.theme = initial.darkMode ? 'dark' : 'light';
                }
                delete merged.darkMode; 
                delete merged.isPanelOpen; 
                return merged;
            }
            return defaultSettings;
        } catch (error) {
            console.error("Failed to parse settings from localStorage", error);
            return defaultSettings;
        }
    });

    const [history, setHistory] = useState<any[]>(() => {
        try {
            const savedHistory = localStorage.getItem(HISTORY_KEY);
            return savedHistory ? JSON.parse(savedHistory) : [];
        } catch {
            return [];
        }
    });

    const [activePanel, setActivePanel] = useState<ActivePanel>(null);

    const saveSettings = useCallback((newSettings: Settings) => {
        if (!newSettings.savePreferences) {
            localStorage.removeItem(SETTINGS_KEY);
            return;
        }
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }, []);

    // Apply Audio Setting Side Effect
    useEffect(() => {
        audioAgent.setMuted(!settings.soundEnabled);
    }, [settings.soundEnabled]);

    // Apply Side Effects (Theme, Glass, Contrast)
    useEffect(() => {
        const root = document.documentElement;

        // 1. Theme Logic
        const applyTheme = () => {
            const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const shouldBeDark = settings.theme === 'dark' || (settings.theme === 'system' && isSystemDark);
            
            if (shouldBeDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };
        applyTheme();

        // Listen for system changes if mode is system
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = () => {
            if (settings.theme === 'system') applyTheme();
        };
        mediaQuery.addEventListener('change', handleSystemChange);

        // 2. High Contrast Logic
        if (settings.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

        // 3. Glass Intensity Logic
        if (settings.glassIntensity === 'low') {
            root.style.setProperty('--glass-surface', 'rgba(255, 255, 255, 0.98)');
            root.style.setProperty('--glass-blur', '0px');
        } else if (settings.glassIntensity === 'high') {
            root.style.setProperty('--glass-surface', 'rgba(255, 255, 255, 0.30)');
            root.style.setProperty('--glass-blur', '40px');
        } else {
            // Medium
            root.style.setProperty('--glass-surface', 'rgba(255, 255, 255, 0.55)');
            root.style.setProperty('--glass-blur', '20px');
        }

        return () => mediaQuery.removeEventListener('change', handleSystemChange);
    }, [settings.theme, settings.highContrast, settings.glassIntensity]);

    const updateSetting = (key: keyof Settings, value: any) => {
        setSettings(prevSettings => {
            const newSettings = { ...prevSettings, [key]: value };
            saveSettings(newSettings);
            return newSettings;
        });
    };

    const addTemplate = (template: Template) => {
        setSettings(prev => {
            const newSettings = { ...prev, templates: [...prev.templates, template] };
            saveSettings(newSettings);
            return newSettings;
        });
    };

    const deleteTemplate = (templateId: string) => {
        setSettings(prev => {
            const newSettings = { ...prev, templates: prev.templates.filter(t => t.id !== templateId) };
            saveSettings(newSettings);
            return newSettings;
        });
    };

    const addPreset = (preset: Preset) => {
        setSettings(prev => {
            const newSettings = { ...prev, presets: [...prev.presets, preset] };
            saveSettings(newSettings);
            return newSettings;
        });
    };
    
    const updatePreset = (updatedPreset: Preset) => {
        setSettings(prev => {
            const newSettings = { ...prev, presets: prev.presets.map(p => p.id === updatedPreset.id ? updatedPreset : p) };
            saveSettings(newSettings);
            return newSettings;
        });
    };

    const deletePreset = (presetId: string) => {
        setSettings(prev => {
            const newSettings = { ...prev, presets: prev.presets.filter(p => p.id !== presetId) };
            saveSettings(newSettings);
            return newSettings;
        });
    };

    const resetPresetsToDefault = () => {
        setSettings(prev => {
            const newSettings = { ...prev, presets: defaultPresets };
            saveSettings(newSettings);
            return newSettings;
        });
    };

    const addToHistory = (entry: any) => {
        setHistory(prev => {
            const updated = [entry, ...prev].slice(0, 10);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const clearHistory = () => {
        localStorage.removeItem(HISTORY_KEY);
        setHistory([]);
    };

    const contextValue = useMemo(() => ({
        settings,
        history,
        activePanel,
        setActivePanel,
        updateSetting,
        addTemplate,
        deleteTemplate,
        addPreset,
        updatePreset,
        deletePreset,
        resetPresetsToDefault,
        addToHistory,
        clearHistory,
    }), [settings, history, activePanel, saveSettings]);

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
};

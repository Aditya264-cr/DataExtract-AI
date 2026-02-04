
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Template, Preset } from '../types';

type Settings = {
    // Appearance
    darkMode: boolean;
    glassIntensity: 'low' | 'medium' | 'high';
    
    // Output
    defaultView: 'json' | 'text' | 'key_value' | 'grid';
    showSummary: boolean;
    showConfidence: boolean;

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

    // Data & Privacy
    savePreferences: boolean;
    
    // System Mode
    systemMode: 'STANDARD' | 'PROFESSIONAL' | 'ENTERPRISE';

    // Data
    templates: Template[];
    presets: Preset[];
    isPanelOpen: boolean; 
};

type SettingsContextType = {
    settings: Settings;
    history: any[];
    updateSetting: (key: keyof Omit<Settings, 'isPanelOpen' | 'templates' | 'presets'>, value: any) => void;
    setPanelOpen: (isOpen: boolean) => void;
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
    darkMode: false,
    glassIntensity: 'medium',
    defaultView: 'key_value',
    showSummary: true,
    showConfidence: true,
    autoDetectDocType: true,
    highlightLowConfidence: true,
    enableValidation: true,
    allowMultipleUploads: true,
    autoStart: false,
    documentLanguage: 'auto',
    highContrast: false,
    tooltipsEnabled: true,
    savePreferences: true,
    systemMode: 'PROFESSIONAL',
    templates: [],
    presets: defaultPresets,
    isPanelOpen: false,
};

export const SettingsContext = createContext<SettingsContextType>({
    settings: defaultSettings,
    history: [],
    updateSetting: () => {},
    setPanelOpen: () => {},
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
                const merged = { ...defaultSettings, ...initial, isPanelOpen: false };
                if (!Array.isArray(initial.presets)) {
                    merged.presets = defaultPresets;
                }
                // Ensure systemMode exists for legacy saved settings
                if (!merged.systemMode) merged.systemMode = 'PROFESSIONAL';
                return merged;
            }
            return { ...defaultSettings, isPanelOpen: false };
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

    const saveSettings = useCallback((newSettings: Settings) => {
        if (!newSettings.savePreferences) {
            localStorage.removeItem(SETTINGS_KEY);
            return;
        }
        try {
            const { isPanelOpen, ...settingsToSave } = newSettings;
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsToSave));
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }, []);

    useEffect(() => {
        // Apply Dark Mode
        if (settings.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Apply Glass Intensity
        const root = document.documentElement;
        if (settings.glassIntensity === 'low') {
            root.style.setProperty('--glass-surface', settings.darkMode ? 'rgba(30, 30, 32, 0.95)' : 'rgba(255, 255, 255, 0.95)');
            root.style.setProperty('--glass-blur', '10px');
        } else if (settings.glassIntensity === 'high') {
            root.style.setProperty('--glass-surface', settings.darkMode ? 'rgba(30, 30, 32, 0.40)' : 'rgba(255, 255, 255, 0.40)');
            root.style.setProperty('--glass-blur', '40px');
        } else {
            // Medium (Default) - Matching updated Global CSS
            root.style.setProperty('--glass-surface', settings.darkMode ? 'rgba(30, 30, 32, 0.60)' : 'rgba(255, 255, 255, 0.55)');
             root.style.setProperty('--glass-blur', '20px');
        }

    }, [settings.darkMode, settings.glassIntensity]);

    const updateSetting = (key: keyof Omit<Settings, 'isPanelOpen' | 'templates' | 'presets'>, value: any) => {
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

    const setPanelOpen = (isOpen: boolean) => {
        setSettings(prev => ({ ...prev, isPanelOpen: isOpen }));
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
        updateSetting,
        setPanelOpen,
        addTemplate,
        deleteTemplate,
        addPreset,
        updatePreset,
        deletePreset,
        resetPresetsToDefault,
        addToHistory,
        clearHistory,
    }), [settings, history, saveSettings]);

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
};

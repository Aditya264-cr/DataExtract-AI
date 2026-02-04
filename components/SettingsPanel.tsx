
import React, { useContext, useState } from 'react';
import { Modal } from './ui/Modal';
import { ToggleSwitch } from './ui/ToggleSwitch';
import { SettingsContext } from '../contexts/SettingsContext';
import { PaintBrushIcon } from './icons/PaintBrushIcon';
import { EyeIcon } from './icons/EyeIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { Notification } from './ui/Notification';
import { Preset } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { PresetEditorModal } from './ui/PresetEditorModal';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ArrowUpTrayIcon } from './icons/ArrowUpTrayIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';
import { CommandLineIcon } from './icons/CommandLineIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const languages = [
    { code: 'auto', name: 'Auto-Detect' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ru', name: 'Russian' },
];

const SettingRow: React.FC<{ title: string; description: string; control: React.ReactNode; isLast?: boolean }> = ({ title, description, control, isLast }) => (
    <div className={`flex items-center justify-between py-5 ${!isLast ? 'border-b border-gray-100 dark:border-white/5' : ''}`}>
        <div className="flex-1 pr-6">
            <p className="font-semibold text-[#1d1d1f] dark:text-gray-200 text-[15px]">{title}</p>
            <p className="text-[13px] text-[#86868b] dark:text-gray-400 mt-0.5 font-medium leading-relaxed">{description}</p>
        </div>
        <div className="flex-shrink-0">
            {control}
        </div>
    </div>
);

const ConfirmModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmText?: string; }> = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm" }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
        <div className="p-4 space-y-4 text-center">
            <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
            <div className="flex flex-col gap-3 pt-4">
                <button onClick={() => { onConfirm(); onClose(); }} className="w-full py-3.5 text-center font-bold text-white bg-[#FF3B30] hover:bg-red-600 rounded-2xl transition-all active:scale-95 shadow-sm">{confirmText}</button>
                <button onClick={onClose} className="w-full py-3.5 text-center font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-2xl transition-all active:scale-95">Cancel</button>
            </div>
        </div>
    </Modal>
);

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
    const { settings, updateSetting, clearHistory, addPreset, updatePreset, deletePreset, resetPresetsToDefault } = useContext(SettingsContext);
    const [activeTab, setActiveTab] = useState('appearance');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
    const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
    const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    const handleConfirmClear = () => { clearHistory(); setNotification("History cleared successfully"); setIsConfirmOpen(false); };
    const handleOpenPresetModal = (preset: Preset | null) => { setEditingPreset(preset); setIsPresetModalOpen(true); };
    const handleSavePreset = (preset: Preset) => { if (editingPreset) { updatePreset(preset); setNotification("Preset updated"); } else { addPreset(preset); setNotification("Preset added"); } setIsPresetModalOpen(false); };
    const handleDeletePreset = (presetId: string) => { setDeletingPresetId(presetId); };
    const handleConfirmDelete = () => { if (deletingPresetId) { deletePreset(deletingPresetId); setNotification("Preset deleted"); setDeletingPresetId(null); } };
    const handleResetPresets = () => { resetPresetsToDefault(); setNotification("Presets reset to defaults"); };

    const tabs = [
        { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
        { id: 'output', label: 'Output Rules', icon: EyeIcon },
        { id: 'extraction', label: 'Extraction', icon: CommandLineIcon },
        { id: 'upload', label: 'Uploads', icon: ArrowUpTrayIcon },
        { id: 'language', label: 'Language', icon: GlobeAltIcon },
        { id: 'data', label: 'Data & Privacy', icon: LockClosedIcon },
        { id: 'presets', label: 'Presets', icon: DocumentTextIcon },
    ];

    const Select = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: { value: string, label: string }[] }) => (
        <select 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="bg-gray-50 dark:bg-zinc-800 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-lg py-1.5 pl-3 pr-8 text-sm font-medium focus:ring-2 focus:ring-[#007AFF] outline-none text-gray-700 dark:text-gray-200 cursor-pointer"
        >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    );

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="3xl">
                <div className="flex h-[550px]">
                    {/* Left Rail (Navigation) */}
                    <aside className={`w-[30%] bg-gray-50/50 dark:bg-black/20 border-r border-gray-200 dark:border-white/5 p-3 flex flex-col gap-1 overflow-y-auto ios-scroll`}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all duration-200 text-left group ${
                                    activeTab === tab.id
                                        ? 'bg-white dark:bg-zinc-800 shadow-sm text-[#007AFF] ring-1 ring-black/5 dark:ring-white/5'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                <tab.icon className={`w-5 h-5 transition-colors ${activeTab === tab.id ? 'text-[#007AFF]' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </aside>

                    {/* Right Pane (Content Container) */}
                    <main className="w-[70%] bg-white dark:bg-zinc-900 flex flex-col relative overflow-hidden">
                        <div className="flex-1 p-8 overflow-y-auto ios-scroll">
                            <div className="pt-2">
                                {activeTab === 'appearance' && (
                                    <div className="animate-fade-in space-y-2">
                                        <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-6 font-display">Appearance</h3>
                                        <SettingRow 
                                            title="Glass Intensity" 
                                            description="Adjust the blur and transparency of UI panels." 
                                            control={
                                                <Select 
                                                    value={settings.glassIntensity} 
                                                    onChange={(v) => updateSetting('glassIntensity', v)}
                                                    options={[
                                                        { value: 'low', label: 'Low (Solid)' },
                                                        { value: 'medium', label: 'Medium' },
                                                        { value: 'high', label: 'High (Glassy)' }
                                                    ]}
                                                />
                                            } 
                                        />
                                    </div>
                                )}

                                {activeTab === 'output' && (
                                    <div className="animate-fade-in space-y-2">
                                        <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-6 font-display">Output Preferences</h3>
                                        <SettingRow 
                                            title="Default Tab View" 
                                            description="Choose which view to open after extraction." 
                                            control={
                                                <Select 
                                                    value={settings.defaultView} 
                                                    onChange={(v) => updateSetting('defaultView', v)}
                                                    options={[
                                                        { value: 'key_value', label: 'Key-Value' },
                                                        { value: 'grid', label: 'Grid / Tables' },
                                                        { value: 'json', label: 'JSON' },
                                                        { value: 'text', label: 'Rich Text' }
                                                    ]}
                                                />
                                            } 
                                        />
                                        <SettingRow title="Show Confidence Scores" description="Display reliability metrics for extracted fields." control={<ToggleSwitch checked={settings.showConfidence} onChange={(e) => updateSetting('showConfidence', e.target.checked)} />} />
                                        <SettingRow title="Show AI Summary" description="Generate a natural language summary of results." control={<ToggleSwitch checked={settings.showSummary} onChange={(e) => updateSetting('showSummary', e.target.checked)} />} />
                                    </div>
                                )}

                                {activeTab === 'extraction' && (
                                    <div className="animate-fade-in space-y-2">
                                        <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-6 font-display">Extraction Behavior</h3>
                                        <SettingRow title="Auto-Detect Document" description="Automatically identify document type before extracting." control={<ToggleSwitch checked={settings.autoDetectDocType} onChange={(e) => updateSetting('autoDetectDocType', e.target.checked)} />} />
                                        <SettingRow title="Highlight Low Confidence" description="Visually flag fields that might need review." control={<ToggleSwitch checked={settings.highlightLowConfidence} onChange={(e) => updateSetting('highlightLowConfidence', e.target.checked)} />} />
                                        <SettingRow title="Enable Validation" description="Run logic checks (sums, dates) on extracted data." control={<ToggleSwitch checked={settings.enableValidation} onChange={(e) => updateSetting('enableValidation', e.target.checked)} />} />
                                    </div>
                                )}

                                {activeTab === 'upload' && (
                                    <div className="animate-fade-in space-y-2">
                                        <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-6 font-display">Upload Preferences</h3>
                                        <SettingRow title="Allow Multiple Uploads" description="Enable batch processing for multiple files." control={<ToggleSwitch checked={settings.allowMultipleUploads} onChange={(e) => updateSetting('allowMultipleUploads', e.target.checked)} />} />
                                        <SettingRow title="Auto-Start Extraction" description="Begin processing immediately after file selection." control={<ToggleSwitch checked={settings.autoStart} onChange={(e) => updateSetting('autoStart', e.target.checked)} />} />
                                    </div>
                                )}

                                {activeTab === 'language' && (
                                    <div className="animate-fade-in space-y-2">
                                        <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-6 font-display">Language & Accessibility</h3>
                                        <SettingRow 
                                            title="Document Language" 
                                            description="Improve OCR accuracy by specifying primary language." 
                                            control={
                                                <select 
                                                    value={settings.documentLanguage} 
                                                    onChange={(e) => updateSetting('documentLanguage', e.target.value)} 
                                                    className="bg-gray-50 dark:bg-zinc-800 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-lg py-1.5 pl-3 pr-8 text-sm font-medium focus:ring-2 focus:ring-[#007AFF] outline-none text-gray-700 dark:text-gray-200 cursor-pointer"
                                                >
                                                    {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                                                </select>
                                            } 
                                        />
                                        <SettingRow title="High Contrast Mode" description="Increase contrast for better legibility." control={<ToggleSwitch checked={settings.highContrast} onChange={(e) => updateSetting('highContrast', e.target.checked)} />} />
                                        <SettingRow title="Tooltips" description="Show helper text when hovering UI elements." control={<ToggleSwitch checked={settings.tooltipsEnabled} onChange={(e) => updateSetting('tooltipsEnabled', e.target.checked)} />} />
                                    </div>
                                )}

                                {activeTab === 'data' && (
                                        <div className="animate-fade-in space-y-2">
                                        <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-6 font-display">Data & Privacy</h3>
                                        <SettingRow title="Save Preferences" description="Remember these settings for your next session." control={<ToggleSwitch checked={settings.savePreferences} onChange={(e) => updateSetting('savePreferences', e.target.checked)} />} />
                                        <div className="py-6 border-t border-gray-100 dark:border-white/5 mt-4">
                                            <h4 className="font-semibold text-[#1d1d1f] dark:text-gray-200 text-[15px] mb-2">Clear History</h4>
                                            <p className="text-[13px] text-[#86868b] dark:text-gray-400 font-medium leading-relaxed mb-4">Permanently remove all locally cached extraction results and history items.</p>
                                            <button onClick={() => setIsConfirmOpen(true)} className="text-xs font-bold text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 px-4 py-2.5 rounded-full transition-all border border-[#FF3B30]/20">
                                                Clear Local Data
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'presets' && (
                                    <div className="animate-fade-in">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white font-display">Presets</h3>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={handleResetPresets}
                                                    className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-full text-xs font-bold transition-all hover:bg-black/5 dark:hover:bg-white/10"
                                                    title="Restore default presets"
                                                >
                                                    <ArrowPathIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenPresetModal(null)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/20 rounded-full text-xs font-bold transition-all"
                                                >
                                                    <PlusIcon className="w-4 h-4" /> Add New
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {settings.presets.length === 0 ? (
                                                <div className="p-8 text-center text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-black/5 dark:border-white/5">
                                                    <p className="text-sm font-medium">No presets defined.</p>
                                                    <button onClick={handleResetPresets} className="mt-2 text-xs font-bold text-[#007AFF] hover:underline">Restore Defaults</button>
                                                </div>
                                            ) : (
                                                settings.presets.map((preset) => (
                                                        <div key={preset.id} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-zinc-800/30 rounded-2xl border border-black/5 dark:border-white/5 hover:border-blue-500/30 transition-all group">
                                                        <div className="flex items-center gap-4 overflow-hidden">
                                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center text-xl shadow-sm border border-black/5 dark:border-white/5">
                                                                {preset.icon}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-gray-800 dark:text-gray-200 truncate">{preset.name}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] bg-gray-200 dark:bg-zinc-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 font-mono">
                                                                        {preset.docType}
                                                                    </span>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{preset.prompt}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleOpenPresetModal(preset)} className="p-2 text-gray-400 hover:text-[#007AFF] hover:bg-blue-500/10 rounded-lg transition-colors"><PencilIcon className="w-4 h-4" /></button>
                                                            <button onClick={() => handleDeletePreset(preset.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </Modal>
            
            <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmClear} title="Clear All History" message="This will permanently delete all past extraction results and cannot be undone." confirmText="Clear History" />
            <ConfirmModal isOpen={!!deletingPresetId} onClose={() => setDeletingPresetId(null)} onConfirm={handleConfirmDelete} title="Delete Preset" message="Are you sure you want to delete this preset? This action cannot be undone." confirmText="Delete" />
            <PresetEditorModal isOpen={isPresetModalOpen} onClose={() => setIsPresetModalOpen(false)} onSave={handleSavePreset} preset={editingPreset} />
            {notification && <Notification message={notification} type="success" onClose={() => setNotification(null)} />}
        </>
    );
};

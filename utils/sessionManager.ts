
import type { UploadedFile, ExtractedData, ProcessingState } from '../types';
import { fileToBase64 } from './fileUtils';

const SESSION_KEY = 'dataextract_autosave_v1';

export interface SessionState {
    files: {
        name: string;
        type: string;
        lastModified: number;
        dataBase64: string | null; // null if too large to save
    }[];
    extractedData: ExtractedData | null;
    description: string;
    activePreset: string | null;
    processingState: ProcessingState;
    timestamp: number;
}

// Helper to check rough size of string in bytes
const roughSizeOfObject = (object: any) => {
    const objectList = [];
    const stack = [object];
    let bytes = 0;

    while (stack.length) {
        const value = stack.pop();
        if (typeof value === 'boolean') bytes += 4;
        else if (typeof value === 'string') bytes += value.length * 2;
        else if (typeof value === 'number') bytes += 8;
        else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
            objectList.push(value);
            for (const key in value) {
                stack.push(value[key]);
            }
        }
    }
    return bytes;
};

export const saveSession = async (
    files: UploadedFile[],
    extractedData: ExtractedData | null,
    description: string,
    activePreset: string | null,
    processingState: ProcessingState
): Promise<boolean> => {
    // 1. Prepare minimal state
    const session: SessionState = {
        files: [],
        extractedData,
        description,
        activePreset,
        processingState: processingState === 'error' ? 'idle' : processingState, // Don't save error states
        timestamp: Date.now(),
    };

    // 2. Try to serialize files
    // Limit: LocalStorage is approx 5MB. We try to be conservative.
    let totalSize = roughSizeOfObject(session); 
    const MAX_SIZE = 4 * 1024 * 1024; // 4MB safety limit

    for (const f of files) {
        try {
            // If file is > 2MB individually, skip content to be safe
            if (f.file.size > 2 * 1024 * 1024) {
                 session.files.push({
                    name: f.file.name,
                    type: f.file.type,
                    lastModified: f.file.lastModified,
                    dataBase64: null 
                });
                continue;
            }

            const base64 = await fileToBase64(f.file);
            // Check if adding this file exceeds quota
            if (totalSize + base64.length * 2 > MAX_SIZE) {
                session.files.push({
                    name: f.file.name,
                    type: f.file.type,
                    lastModified: f.file.lastModified,
                    dataBase64: null 
                });
            } else {
                session.files.push({
                    name: f.file.name,
                    type: f.file.type,
                    lastModified: f.file.lastModified,
                    dataBase64: base64
                });
                totalSize += base64.length * 2;
            }
        } catch (e) {
            console.warn("Failed to serialize file for autosave", e);
        }
    }

    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return true;
    } catch (e) {
        console.error("Auto-save failed (likely quota exceeded)", e);
        return false;
    }
};

export const loadSession = async (): Promise<{
    files: UploadedFile[];
    extractedData: ExtractedData | null;
    description: string;
    activePreset: string | null;
    processingState: ProcessingState;
} | null> => {
    try {
        const json = localStorage.getItem(SESSION_KEY);
        if (!json) return null;

        const session: SessionState = JSON.parse(json);
        
        // Expire sessions older than 24 hours
        if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }

        // Reconstruct Files
        const reconstructedFiles: UploadedFile[] = [];
        
        for (const f of session.files) {
            if (f.dataBase64) {
                // Convert Base64 back to Blob/File
                const res = await fetch(`data:${f.type};base64,${f.dataBase64}`);
                const blob = await res.blob();
                const file = new File([blob], f.name, { type: f.type, lastModified: f.lastModified });
                reconstructedFiles.push({
                    id: crypto.randomUUID(),
                    file,
                    preview: URL.createObjectURL(file)
                });
            } else {
                // Placeholder for large files that weren't saved
                // We create a dummy file to keep the state valid, but preview might fail
                const file = new File(["Content not saved (too large)"], f.name, { type: "text/plain" });
                reconstructedFiles.push({
                    id: crypto.randomUUID(),
                    file,
                    preview: "" // UI should handle empty preview gracefully
                });
            }
        }

        return {
            files: reconstructedFiles,
            extractedData: session.extractedData,
            description: session.description,
            activePreset: session.activePreset,
            processingState: session.processingState
        };

    } catch (e) {
        console.error("Failed to load session", e);
        return null;
    }
};

export const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
};

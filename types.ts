
export interface UploadedFile {
    id: string;
    file: File;
    preview: string; // URL for preview
}

export type ProcessingState = 'idle' | 'files_selected' | 'processing' | 'awaiting_classification' | 'results' | 'error' | 'batch_complete';

export interface Highlight {
    fieldName: string;
    text: string;
    boundingBox: [number, number, number, number]; // [x_min, y_min, x_max, y_max] normalized
    confidence: number;
}

export interface ExtractedField {
    value: string | number | boolean | null;
    confidence: number;
    boundingBox?: [number, number, number, number];
    label?: string;
}

export interface ExtractedSection {
    heading: string;
    content: {
        label: string;
        value: string | number | boolean | null;
        confidence: number;
        boundingBox?: [number, number, number, number];
    }[];
}

export interface ExtractedTable {
    tableName: string;
    headers: string[];
    rows: Record<string, ExtractedField>[];
}

export interface ExtractedData {
    documentType: string; // Mapped from meta.contentType
    confidenceScore: number; // Aggregate or meta confidence
    
    // New Schema Root
    meta: {
        contentType: string;
        detectedLanguage: string;
        hasImages: boolean;
        hasTables: boolean;
        hasHandwriting: boolean;
    };
    
    structuredData: {
        title: ExtractedField;
        sections: ExtractedSection[];
        tables: ExtractedTable[];
    };

    imageAnalysis: {
        objectsDetected: { objectName: string; description: string; confidence: number }[];
        extractedText: { text: string; confidence: number }[];
    } | null;

    rawTextSummary: string;

    // Legacy/UI Compatibility
    data: any; // Mapped view for backward compatibility (e.g., flat KV)
    highlights?: Highlight[];
}

export interface AISummaryData {
    summary: string;
    confidenceScore: number;
}

export type OutputFormat = 'json' | 'text' | 'grid' | 'key_value';

export interface Template {
    id: string;
    name: string;
    description: string; // The JSON schema as a string
}

export interface Preset {
    id:string;
    name: string;
    docType: string;
    prompt: string;
    icon: string; // Emoji or icon identifier
}

export type ChatMessage = {
    role: 'user' | 'model';
    content: string;
    sources?: { title: string; uri: string }[];
};

export interface BatchResult {
    file: UploadedFile;
    status: 'success' | 'error';
    data?: ExtractedData;
    error?: string;
}

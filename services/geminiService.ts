
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import type { UploadedFile, ExtractedData, AISummaryData, ChatMessage, ForensicStep, EntityVerification } from "../types";
import { fileToBase64 } from "../utils/fileUtils";
import { classifyError, handleFailure, AppError } from "../utils/errorManager";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_STD = "gemini-3-flash-preview";
const MODEL_REASONING = "gemini-3-pro-preview";
const MODEL_IMG_GEN = "gemini-2.5-flash-image";

// Helper to clean JSON output from model
const cleanJsonOutput = (text: string): string => {
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\n/, "").replace(/\n```$/, "");
    }
    return cleaned;
};

// Robust Retry Wrapper enforcing Segment 7.2 rules
async function withRetry<T>(fn: () => Promise<T>, context: string, attempt = 0): Promise<T> {
    try {
        return await fn();
    } catch (e) {
        const appError = classifyError(e, context);
        const resolution = await handleFailure(appError, attempt);

        if (resolution.action === 'retry') {
            console.warn(`[${context}] Retry ${attempt + 1}: ${resolution.message}`);
            // Exponential backoff: 1s, 2s
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
            return withRetry(fn, context, attempt + 1);
        } else if (resolution.action === 'freeze') {
            // Critical errors must bubble up to UI to trigger freeze
            throw appError;
        } else {
            // Halt means we throw the final error to be caught by the caller (displayed as failure)
            throw new Error(resolution.message);
        }
    }
}

// Convert UploadedFile to GenAI Part
const fileToPart = async (file: UploadedFile): Promise<Part> => {
    const base64Data = await fileToBase64(file.file);
    return {
        inlineData: {
            data: base64Data,
            mimeType: file.file.type
        }
    };
};

export const classifyDocument = async (files: UploadedFile[], language: string): Promise<{ docType: string; confidence: number; }> => {
    const parts = await Promise.all(files.map(fileToPart));
    const prompt = `Classify this document type (e.g., Invoice, Resume, Contract, Receipt, ID Card, etc.). 
    Return strictly JSON: { "docType": "string", "confidence": number (0-100) }`;
    
    return withRetry<any>(async () => {
        const response = await ai.models.generateContent({
            model: MODEL_STD,
            contents: {
                parts: [...parts, { text: prompt }]
            },
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{}');
    }, 'Document Classification');
};

export const proposeExtractionSchema = async (files: UploadedFile[], docType: string): Promise<string[]> => {
    const parts = await Promise.all(files.map(fileToPart));
    const prompt = `For a document of type "${docType}", list the most important fields to extract. Return strictly JSON array of strings.`;
    
    return withRetry<string[]>(async () => {
        const response = await ai.models.generateContent({
            model: MODEL_STD,
            contents: {
                parts: [...parts, { text: prompt }]
            },
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '[]');
    }, 'Schema Proposal');
};

export const performExtraction = async (files: UploadedFile[], docType: string, description: string, language: string, previousData?: ExtractedData): Promise<ExtractedData> => {
    const parts = await Promise.all(files.map(fileToPart));
    const taskId = crypto.randomUUID();
    const agentSignature = `CEE-v1-${Date.now()}`;
    
    const systemPrompt = `
    [AGENT IDENTITY]
    You are the Core Extraction Engine (CEE). Your role is to perform high-fidelity data extraction.
    You operate within the Iterative Cognitive Loop (ICL).
    
    [ICL PROTOCOL - EXECUTE THESE STEPS INTERNALLY]
    1. Context Assimilation: Read the document completely.
    2. Risk Evaluation: Assess complexity and ambiguity (output as riskScore).
    3. Plan Formulation: Determine extraction strategy for "${docType}".
    4. Tool Execution: Extract the data.
    5. Result Verification: Cross-check types and math.
    6. Confidence Scoring: Assign specific scores to every field.
    
    [TASK PARAMETERS]
    Task ID: ${taskId}
    Target Document Type: ${docType}
    User Instructions: ${description}
    Target Language: ${language !== 'auto' ? language : 'Detected Language'}
    
    [OUTPUT SCHEMA]
    Return strictly JSON matching this structure:
    {
        "documentType": "${docType}",
        "confidenceScore": number (0-100),
        "taskId": "${taskId}",
        "agentSignature": "${agentSignature}",
        "riskScore": number (0-100),
        "meta": {
            "contentType": "string",
            "detectedLanguage": "string",
            "hasImages": boolean,
            "hasTables": boolean,
            "hasHandwriting": boolean
        },
        "structuredData": {
            "title": { "value": "string", "confidence": number },
            "sections": [
                {
                    "heading": "string",
                    "content": [
                        { "label": "string", "value": "string | number | boolean | null", "confidence": number }
                    ]
                }
            ],
            "tables": [
                {
                    "tableName": "string",
                    "headers": ["string"],
                    "rows": [
                        { "colName": { "value": "val", "confidence": number } }
                    ]
                }
            ]
        },
        "rawTextSummary": "string"
    }
    
    Ensure all fields have a confidence score. Identify tables clearly.
    `;

    return withRetry<ExtractedData>(async () => {
        const response = await ai.models.generateContent({
            model: MODEL_REASONING,
            contents: {
                parts: [...parts, { text: systemPrompt }]
            },
            config: { responseMimeType: "application/json" }
        });

        const json = JSON.parse(response.text || '{}');
        
        return {
            ...json,
            taskId, 
            agentSignature,
            data: json.structuredData || {}, 
            imageAnalysis: null
        } as ExtractedData;
    }, 'Core Extraction');
};

export const askDocumentChat = async (data: ExtractedData, query: string, history: ChatMessage[]): Promise<{ text: string; sources?: { title: string; uri: string }[] }> => {
    const contextData = JSON.stringify(data.structuredData).slice(0, 30000);
    const systemInstruction = `You are DataExtract AI's specialized assistant. Context: ${contextData}`;

    const contents = history.map(msg => ({ role: msg.role, parts: [{ text: msg.content }] }));
    contents.push({ role: 'user', parts: [{ text: query }] });
    
    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: MODEL_REASONING,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }] 
            }
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources = groundingChunks?.map((chunk: any) => ({
            title: chunk.web?.title || "Source",
            uri: chunk.web?.uri || ""
        })).filter((s: any) => s.uri) || [];

        return { text: response.text || "No response generated.", sources };
    }, 'Chat Assistant');
};

export const generateSummaryFromData = async (data: ExtractedData, refined: boolean): Promise<AISummaryData> => {
    const context = JSON.stringify(data.structuredData);
    const prompt = `Generate a ${refined ? 'detailed executive' : 'brief'} summary of this data:\n${context.slice(0, 10000)}`;
    
    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: MODEL_STD,
            contents: prompt
        });
        return { summary: response.text || "", confidenceScore: 90 };
    }, 'Summary Generation');
};

export const generateSketchnotes = async (data: ExtractedData): Promise<string> => {
    const context = JSON.stringify(data.structuredData);
    const prompt = `Convert this data into ASCII Sketchnotes:\n${context.slice(0, 20000)}`;
    
    return withRetry(async () => {
        const response = await ai.models.generateContent({ model: MODEL_REASONING, contents: prompt });
        let text = response.text || "";
        if (text.startsWith("```")) {
            text = text.replace(/^```[a-z]*\n/i, "").replace(/\n```$/, "");
        }
        return text;
    }, 'Sketchnote Generation');
};

export const generateCreativeImage = async (prompt: string, size: '1K' | '2K' | '4K'): Promise<string> => {
    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: MODEL_IMG_GEN,
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image generated");
    }, 'Image Generation');
};

export const generateInfographicPrompt = async (data: ExtractedData): Promise<string> => {
    const context = JSON.stringify(data.structuredData);
    const prompt = `Describe a visual infographic that represents this data:\n${context.slice(0, 5000)}`;
    return withRetry(async () => {
        const response = await ai.models.generateContent({ model: MODEL_STD, contents: prompt });
        return response.text || "";
    }, 'Infographic Prompt');
};

export const analyzeDocumentGaps = async (data: ExtractedData): Promise<string> => {
    const context = JSON.stringify(data.structuredData);
    const prompt = `Analyze this data for missing information or gaps typical for a ${data.documentType}:\n${context.slice(0, 5000)}`;
    return withRetry(async () => {
        const response = await ai.models.generateContent({ model: MODEL_STD, contents: prompt });
        return response.text || "";
    }, 'Gap Analysis');
};

export const generateAudienceSummary = async (data: ExtractedData, audience: string): Promise<string> => {
    const context = JSON.stringify(data.structuredData);
    const prompt = `Summarize this document for a ${audience} audience:\n${context.slice(0, 5000)}`;
    return withRetry(async () => {
        const response = await ai.models.generateContent({ model: MODEL_STD, contents: prompt });
        return response.text || "";
    }, 'Audience Summary');
};

export const generateBenchmarkReport = async (data: ExtractedData): Promise<string> => {
    const context = JSON.stringify(data.structuredData);
    const prompt = `Benchmark this ${data.documentType} against industry standards based on the extracted data:\n${context.slice(0, 5000)}`;
    return withRetry(async () => {
        const response = await ai.models.generateContent({ model: MODEL_STD, contents: prompt });
        return response.text || "";
    }, 'Benchmark Report');
};

export const generateWrittenReport = async (data: ExtractedData): Promise<string> => {
    const context = JSON.stringify(data.structuredData);
    const prompt = `Write a formal report based on this data:\n${context.slice(0, 5000)}`;
    return withRetry(async () => {
        const response = await ai.models.generateContent({ model: MODEL_STD, contents: prompt });
        return response.text || "";
    }, 'Written Report');
};

export const verifyEntitiesBackground = async (extractedData: ExtractedData): Promise<EntityVerification[]> => {
    const prompt = `Analyze the provided extracted data and identify key real-world entities. Data Context: ${JSON.stringify(extractedData.structuredData).slice(0, 5000)}`;
    
    return withRetry<EntityVerification[]>(async () => {
        const response = await ai.models.generateContent({
            model: MODEL_STD,
            contents: prompt,
            config: { 
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            },
        });
        
        const responseText = response.text;
        if (!responseText) return [];
        const parsed = JSON.parse(cleanJsonOutput(responseText));
        if (Array.isArray(parsed)) return parsed as EntityVerification[];
        if (parsed && typeof parsed === 'object') {
            const possibleArray = Object.values(parsed).find(val => Array.isArray(val));
            if (possibleArray) return possibleArray as EntityVerification[];
        }
        return [];
    }, 'Entity Verification');
};

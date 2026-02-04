
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import type { UploadedFile, ExtractedData, AISummaryData, ChatMessage } from '../types';
import { fileToBase64 } from '../utils/fileUtils';

// Always initialize GoogleGenAI using the process.env.API_KEY environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Model definitions based on task complexity
const MODEL_LITE = "gemini-flash-lite-latest"; // Low-latency, cost-effective
const MODEL_STD = "gemini-3-flash-preview";    // Standard, tool-capable
const MODEL_PRO = "gemini-3-pro-preview";      // High-intelligence, reasoning

export const classifyDocument = async (files: UploadedFile[], language: string): Promise<{ docType: string; confidence: number; }> => {
    const languageHint = language !== 'auto' ? ` The document's primary language is ${language}.` : '';
    const prompt = `Identify the type of the document(s).${languageHint} Return a single JSON object with two keys: 'docType' (e.g., 'Invoice', 'Resume', 'Contract') and 'confidence' (0-100 certainty).`;
    
    const imageParts = await Promise.all(
        files.map(async (file) => ({
            inlineData: { mimeType: file.file.type, data: await fileToBase64(file.file) },
        }))
    );

    try {
        const response = await ai.models.generateContent({
            model: MODEL_LITE, // Use Flash Lite for ultra-fast classification
            contents: { parts: [{ text: prompt }, ...imageParts] },
            config: { responseMimeType: "application/json" },
        });
        
        const responseText = response.text;
        if (!responseText) {
            throw new Error("Classification returned empty response.");
        }
        
        const parsed = JSON.parse(responseText.trim());
        return {
            docType: parsed.docType || "Uncategorized",
            confidence: parsed.confidence || 0,
        };
    } catch (e) {
        console.error("Classification error:", e);
        return { docType: "Unknown", confidence: 0 };
    }
};

export const performExtraction = async (
    files: UploadedFile[], 
    docType: string, 
    userDescription: string, 
    language: string,
    editedData?: ExtractedData
): Promise<ExtractedData> => {
    const languageHint = language !== 'auto' ? ` The document is written in ${language}.` : '';
    const imageParts = await Promise.all(
        files.map(async (file) => ({
            inlineData: { mimeType: file.file.type, data: await fileToBase64(file.file) },
        }))
    );

    // --- Step 1: The Scout (Layout Analysis) ---
    // Uses the low-latency model to build a roadmap of the document structure.
    let scoutContext = "";
    try {
        const scoutPrompt = `
        Analyze the visual layout of this ${docType}. 
        Identify the distinct sections (e.g., Header, Vendor Details, Clauses, Standards, Line Items).
        List what key data resides in each to guide intelligent extraction.
        `;
        
        const scoutResponse = await ai.models.generateContent({
            model: MODEL_LITE,
            contents: { parts: [{ text: scoutPrompt }, ...imageParts] },
        });
        scoutContext = scoutResponse.text || "No distinct sections identified.";
    } catch (e) {
        console.warn("Scout pass failed, proceeding to direct extraction.", e);
        scoutContext = "Layout analysis unavailable.";
    }

    // --- Step 2: The Sniper (Deep Intelligent Extraction) ---
    // Uses the Pro model with reasoning, guided by the Scout's map.
    const prompt = `
Analyze this ${docType} and extract all structured data.${languageHint}

INPUT CONTEXT (Layout Analysis):
${scoutContext}

CRITICAL INSTRUCTIONS FOR DATA QUALITY & VERIFICATION:
1. **High-Fidelity Extraction**: Prioritize exactness over estimation. If a field is ambiguous or illegible, mark it as null or provide the closest possible value with a lower confidence score.
2. **Human-in-the-Loop Prep**: Your output is the first step in a verification chain. Flag any potential errors, inconsistencies, or low-quality regions by assigning appropriate confidence scores.
3. **Validation**: Perform internal validation where possible (e.g., check if line item totals sum to the subtotal, verify date formats).
4. **Standardization**: Ensure all extracted data adheres to a strict schema for consistency. Normalize entity names and codes to reduce data noise.
5. **Relationships**: Preserve the logical relationships between data points (e.g., which tax applies to which line item).

STRICT DATA TYPE ENFORCEMENT:
- DATES: MUST be ISO 8601 "YYYY-MM-DD".
- NUMBERS: MUST be raw Floats/Integers.
- BOOLEANS: Use JSON true/false.

The final output must be a single, well-formed JSON object.

The JSON object must have:
1. "documentType": "${docType}"
2. "confidenceScore": (0-100)
3. "data": Object or Array of objects containing key-value pairs, tables, and lists.
4. "highlights": Array of objects for EACH field in "data":
    - "fieldName": corresponding key
    - "text": exact extracted text
    - "boundingBox": [x_min, y_min, x_max, y_max] normalized (0-1)
    - "confidence": (0-100)

${userDescription ? `User Requirements: "${userDescription}"` : ''}
${editedData ? `Previous Correction Context: ${JSON.stringify(editedData.data)}` : ''}
`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_PRO, // Use Pro for complex extraction
            contents: { parts: [{ text: prompt }, ...imageParts] },
            config: { 
                responseMimeType: "application/json",
                // Enable Thinking Mode with max budget for reasoning
                thinkingConfig: { thinkingBudget: 32768 }
            },
        });

        const responseText = response.text;
        if (!responseText) {
            throw new Error("Extraction engine returned an empty response.");
        }
        const parsed = JSON.parse(responseText.trim().replace(/^```json\n/, '').replace(/\n```$/, ''));
        return parsed as ExtractedData;
    } catch (e) {
        console.error(e);
        throw new Error("Extraction engine failed to parse document content.");
    }
};

export const generateSummaryFromData = async (extractedData: ExtractedData, isDetailed = false): Promise<AISummaryData> => {
    const detailInstruction = isDetailed 
        ? "Provide a highly comprehensive summary focusing on nuances, specific clauses, and edge cases."
        : "Generate a concise human-readable summary of 2 to 4 sentences.";

    const prompt = `
${detailInstruction}
Target document type: ${extractedData.documentType}.
Key findings needed: totals, critical dates, main entities, clauses, and standards found.
**Insight Requirement**: Highlight potential data quality issues, ambiguities, or areas requiring human verification.
Data source: ${JSON.stringify(extractedData.data)}.
Return as JSON: { "summary": "string", "confidenceScore": number (0-100) }.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: MODEL_LITE, // Use Flash Lite for fast text-based summarization
            contents: prompt,
            config: { responseMimeType: "application/json" },
        });
        const responseText = response.text;
        if (responseText) {
            return JSON.parse(responseText.trim()) as AISummaryData;
        }
        throw new Error("Summary generation returned an empty response.");
    } catch {
        return { summary: "Summary generation failed.", confidenceScore: 0 };
    }
};

export const getExplanationForField = async (fieldName: string, fieldValue: string, files: UploadedFile[]): Promise<string> => {
    const prompt = `Explain why "${fieldValue}" was extracted as "${fieldName}". Did you reconstruct this data from a mismatch? Is this a standard term? Be concise.`;
    const imageParts = await Promise.all(files.map(async (f) => ({ inlineData: { mimeType: f.file.type, data: await fileToBase64(f.file) } })));
    try {
        const response = await ai.models.generateContent({ 
            model: MODEL_PRO, // Use Pro for detailed visual reasoning
            contents: { parts: [{ text: prompt }, ...imageParts] } 
        });
        return response.text ?? "Explanation unavailable.";
    } catch { return "Explanation unavailable."; }
};

export const askDocumentChat = async (extractedData: ExtractedData, question: string, chatHistory: ChatMessage[]): Promise<{ text: string; sources?: { title: string; uri: string }[] }> => {
    const chat = ai.chats.create({
        model: MODEL_STD, // Use Standard Flash for tool support (Google Search)
        config: { 
            systemInstruction: "You are a helpful AI assistant. Answer questions based on the provided document JSON data. If the user asks for external information not found in the document (e.g., verifying a company, checking stock prices, news, or regulatory compliance), you MUST use the Google Search tool to find the answer.",
            tools: [{ googleSearch: {} }] 
        },
        history: chatHistory.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
    });

    const result = await chat.sendMessage({ message: `Document Data: ${JSON.stringify(extractedData.data)}\n\nUser Question: ${question}` });
    const text = result.text ?? "Sorry, I could not generate a response.";

    // Extract grounding sources
    const sources: { title: string; uri: string }[] = [];
    const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
        chunks.forEach(chunk => {
            if (chunk.web?.uri && chunk.web?.title) {
                sources.push({ title: chunk.web.title, uri: chunk.web.uri });
            }
        });
    }

    return { text, sources };
};

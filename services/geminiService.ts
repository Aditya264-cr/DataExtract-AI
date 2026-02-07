
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import type { UploadedFile, ExtractedData, AISummaryData, ChatMessage, Highlight } from '../types';
import { fileToBase64 } from '../utils/fileUtils';

// Always initialize GoogleGenAI using the process.env.API_KEY environment variable.
const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.warn("API_KEY is missing. Calls to Google Gemini will likely fail. Check your environment configuration.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Model definitions based on task complexity
const MODEL_LITE = "gemini-2.5-flash-lite";      // Low-latency, cost-effective (Updated to 2.5 Flash Lite)
const MODEL_STD = "gemini-3-flash-preview";      // Standard, tool-capable
const MODEL_PRO = "gemini-3-pro-preview";        // High-intelligence, reasoning
const MODEL_IMAGE = "gemini-3-pro-image-preview"; // High-quality image generation

// Helper to robustly extract JSON from potentially Markdown-wrapped or dirty text
const cleanJsonOutput = (text: string): string => {
    if (!text) return "{}";
    
    // 1. Try to extract from Markdown code blocks first (most reliable)
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
        return jsonBlockMatch[1].trim();
    }

    // 2. Try to find the first valid outer JSON object
    let firstBrace = text.indexOf('{');
    if (firstBrace === -1) return "{}";

    let balance = 0;
    let inString = false;
    let escape = false;
    let endBrace = -1;

    for (let i = firstBrace; i < text.length; i++) {
        const char = text[i];
        
        if (escape) {
            escape = false;
            continue;
        }

        if (char === '\\') {
            escape = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (char === '{') {
                balance++;
            } else if (char === '}') {
                balance--;
                if (balance === 0) {
                    endBrace = i;
                    break; 
                }
            }
        }
    }

    if (endBrace !== -1) {
        return text.substring(firstBrace, endBrace + 1);
    }
    
    // 3. Fallback
    const lastBrace = text.lastIndexOf('}');
    if (lastBrace > firstBrace) {
        return text.substring(firstBrace, lastBrace + 1);
    }

    return text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
};

// --- Retry Logic for Handling Quota Errors (429) ---
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            const msg = (error.message || error.toString()).toLowerCase();
            const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted');
            const isServer = msg.includes('503') || msg.includes('500') || msg.includes('overloaded');

            if ((isQuota || isServer) && i < retries - 1) {
                const waitTime = INITIAL_RETRY_DELAY * Math.pow(2, i);
                console.warn(`API Busy (Attempt ${i + 1}/${retries}). Retrying in ${waitTime}ms...`, error);
                await delay(waitTime);
                continue;
            }
            
            if (isQuota) {
                throw new Error("System is currently at capacity (Quota Exceeded). Please try again in a moment.");
            }
            throw error;
        }
    }
    throw new Error("Operation failed after multiple retries.");
}

export const classifyDocument = async (files: UploadedFile[], language: string): Promise<{ docType: string; confidence: number; }> => {
    const languageHint = language !== 'auto' ? ` The document's primary language is ${language}.` : '';
    const prompt = `Identify the type of the document(s).${languageHint} Return a single JSON object with two keys: 'docType' (e.g., 'Invoice', 'Resume', 'Contract') and 'confidence' (0-100 certainty).`;
    
    // Ensure MIME type is valid
    const imageParts = await Promise.all(
        files.map(async (file) => ({
            inlineData: { 
                mimeType: file.file.type || 'application/pdf', 
                data: await fileToBase64(file.file) 
            },
        }))
    );

    let responseText = '';
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: MODEL_LITE, // Use Flash Lite for ultra-fast classification
            contents: { parts: [{ text: prompt }, ...imageParts] },
            config: { responseMimeType: "application/json" },
        }));
        
        responseText = response.text || '';
        if (!responseText) {
            throw new Error("Classification returned empty response.");
        }
        
        const parsed = JSON.parse(cleanJsonOutput(responseText));
        return {
            docType: parsed.docType || "Uncategorized",
            confidence: parsed.confidence || 0,
        };
    } catch (e) {
        console.error("Classification error. Response was:", responseText, e);
        if (e instanceof Error && e.message.includes("Quota")) throw e;
        // Don't crash on classification failure, just fallback
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
    const languageHint = language !== 'auto' ? ` The content language is ${language}.` : '';
    
    // Ensure MIME type is valid (fallback to PDF if empty, or octet-stream)
    const imageParts = await Promise.all(
        files.map(async (file) => ({
            inlineData: { 
                mimeType: file.file.type || 'application/pdf', 
                data: await fileToBase64(file.file) 
            },
        }))
    );

    const prompt = `
You are a multimodal data extraction and analysis system.

Your task is to analyze ANY unstructured input and convert it into a clean, structured, machine‑readable format.
Context: The user identifies this document as: "${docType}". ${userDescription ? `User instructions: "${userDescription}".` : ''}
${languageHint}

==============================
ABSOLUTE RULES (CRITICAL)
==============================

1. DO NOT hallucinate missing information.
2. DO NOT guess unclear values.
3. If something is unreadable or ambiguous, mark it explicitly.
4. Preserve original meaning and context.
5. Output MUST be structured JSON only.
6. Never output raw or unstructured text.

==============================
ANALYSIS RESPONSIBILITIES
==============================

You must perform ALL applicable steps:

1️⃣ CONTENT UNDERSTANDING  
• Identify the type of content (document, notice, form, image, mixed)
• Detect language
• Detect presence of tables, lists, images, or handwriting

2️⃣ TEXT & DATA EXTRACTION  
• Extract all meaningful text
• Identify titles, headings, sections
• Extract dates, names, numbers, schedules, steps, metadata
• Preserve hierarchy and relationships

3️⃣ TABLE & LIST HANDLING  
• Convert tables into structured rows and columns
• Convert bullet points into structured arrays
• Maintain original ordering

4️⃣ IMAGE ANALYSIS (MANDATORY IF IMAGE EXISTS)  
If the input contains images:
• Detect and list all visible objects
• Identify object names (e.g., person, building, car, logo, document, signature, stamp)
• If text is present in the image, extract it (OCR)
• If objects are unclear, label them as "Unidentified Object"

5️⃣ CONFIDENCE & READABILITY  
• For each extracted field, assign a confidence score (0–100)
• If unreadable → value = "[Unreadable]" and confidence = 0
• **IMPORTANT**: For every extracted text value in "structuredData", you MUST include a "boundingBox" field with [ymin, xmin, ymax, xmax] coordinates (normalized 0-1) if the text is visible in the image.

==============================
OUTPUT STRUCTURE (STRICT)
==============================

Return a SINGLE JSON object in the following format:

{
  "meta": {
    "contentType": "text | document | image | mixed",
    "detectedLanguage": "ISO-639-1 code",
    "hasImages": true | false,
    "hasTables": true | false,
    "hasHandwriting": true | false
  },

  "structuredData": {
    "title": {
      "value": "string",
      "confidence": number,
      "boundingBox": [ymin, xmin, ymax, xmax]
    },

    "sections": [
      {
        "heading": "string",
        "content": [
          {
            "label": "field name",
            "value": "string | number | boolean | null",
            "confidence": number,
            "boundingBox": [ymin, xmin, ymax, xmax]
          }
        ]
      }
    ],

    "tables": [
      {
        "tableName": "string",
        "headers": ["Column1", "Column2"],
        "rows": [
          {
            "Column1": { "value": "string", "confidence": number, "boundingBox": [...] },
            "Column2": { "value": "string", "confidence": number, "boundingBox": [...] }
          }
        ]
      }
    ]
  },

  "imageAnalysis": {
    "objectsDetected": [
      {
        "objectName": "string",
        "description": "short description",
        "confidence": number
      }
    ],
    "extractedText": [
      {
        "text": "string",
        "confidence": number
      }
    ]
  },

  "rawTextSummary": "1–2 sentence factual summary of the content"
}

==============================
IMPORTANT BEHAVIOR RULES
==============================

• If an element does NOT exist, omit it entirely.
• If tables do not exist, return "tables": [].
• If no images exist, return "imageAnalysis": null.
• Never merge unrelated data.
• Accuracy is more important than completeness.

${editedData ? `PREVIOUS CONTEXT (User Edits): ${JSON.stringify(editedData.data)}` : ''}
`;

    let responseText = '';

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: MODEL_PRO, // gemini-3-pro-preview for deep analysis
            contents: { parts: [{ text: prompt }, ...imageParts] },
            config: { 
                responseMimeType: "application/json",
                // Enable Thinking Mode with max budget for detailed forensic analysis
                thinkingConfig: { thinkingBudget: 32768 } 
            },
        }));

        responseText = response.text || '';
        if (!responseText) {
            throw new Error("Extraction engine returned an empty response.");
        }
        
        let parsed;
        try {
            parsed = JSON.parse(cleanJsonOutput(responseText));
        } catch (jsonErr) {
            console.error("JSON Parse Failure. Raw Text:", responseText);
            throw new Error(`The API returned invalid data. Check Developer Console for raw response. (Error: ${jsonErr})`);
        }
        
        const highlights: Highlight[] = [];
        const processField = (field: any, name: string) => {
            if (field && field.boundingBox && Array.isArray(field.boundingBox)) {
                highlights.push({
                    fieldName: name,
                    text: String(field.value),
                    boundingBox: [
                        field.boundingBox[1], 
                        field.boundingBox[0], 
                        field.boundingBox[3], 
                        field.boundingBox[2]  
                    ],
                    confidence: field.confidence || 0
                });
            }
        };

        if (parsed.structuredData?.title) {
            processField(parsed.structuredData.title, "Document Title");
        }

        if (Array.isArray(parsed.structuredData?.sections)) {
            parsed.structuredData.sections.forEach((section: any) => {
                if (Array.isArray(section.content)) {
                    section.content.forEach((item: any) => {
                        const fieldName = `${section.heading || 'General'} > ${item.label}`;
                        processField(item, fieldName);
                    });
                }
            });
        }

        if (Array.isArray(parsed.structuredData?.tables)) {
            parsed.structuredData.tables.forEach((table: any) => {
                if (Array.isArray(table.rows)) {
                    table.rows.forEach((row: any, rowIndex: number) => {
                        Object.entries(row).forEach(([colName, cell]: [string, any]) => {
                            const fieldName = `${table.tableName || 'Table'} [Row ${rowIndex + 1}] > ${colName}`;
                            processField(cell, fieldName);
                        });
                    });
                }
            });
        }

        return {
            documentType: parsed.meta?.contentType || docType,
            confidenceScore: parsed.structuredData?.title?.confidence || 90, 
            meta: parsed.meta,
            structuredData: parsed.structuredData,
            imageAnalysis: parsed.imageAnalysis,
            rawTextSummary: parsed.rawTextSummary,
            data: parsed.structuredData, 
            highlights: highlights
        };

    } catch (e) {
        console.error("Extraction Critical Failure:", e);
        if (responseText) {
            console.error("Raw response content that failed:", responseText);
        }
        
        if (e instanceof Error) {
            if (e.message.includes("Quota") || e.message.includes("429")) {
                throw new Error("Google Gemini API Quota Exceeded. Please check your billing or try again later.");
            }
            if (e.message.includes("API key")) {
                throw new Error("Invalid or missing API Key. Please configure process.env.API_KEY.");
            }
        }
        
        throw new Error("Extraction failed to parse document content. Please check the console for the raw API response.");
    }
};

export const generateSummaryFromData = async (extractedData: ExtractedData, isDetailed = false): Promise<AISummaryData> => {
    if (!isDetailed && extractedData.rawTextSummary) {
        return {
            summary: extractedData.rawTextSummary,
            confidenceScore: extractedData.confidenceScore
        };
    }

    const detailInstruction = isDetailed 
        ? "Provide a highly comprehensive summary focusing on nuances, specific clauses, and edge cases."
        : "Generate a concise human-readable summary of 2 to 4 sentences.";

    const prompt = `
${detailInstruction}
Target document type: ${extractedData.documentType}.
Data source: ${JSON.stringify(extractedData.structuredData)}.
Return as JSON: { "summary": "string", "confidenceScore": number (0-100) }.
    `;
    
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: MODEL_LITE, // Use Flash Lite for fast text-based summarization
            contents: prompt,
            config: { responseMimeType: "application/json" },
        }));
        const responseText = response.text;
        if (responseText) {
            return JSON.parse(cleanJsonOutput(responseText)) as AISummaryData;
        }
        throw new Error("Summary generation returned an empty response.");
    } catch {
        return { summary: "Summary generation failed or service busy.", confidenceScore: 0 };
    }
};

export const getExplanationForField = async (fieldName: string, fieldValue: string, files: UploadedFile[]): Promise<string> => {
    const prompt = `Explain the extraction of the field "${fieldName}" with value "${fieldValue}".
1. Location: Where is this visually located in the document? (e.g., top-right, table header)
2. Labeling: Is there an explicit label nearby (e.g., "Total:", "Date:")?
3. Reasoning: Why is this value correct? Did you correct any OCR errors or formatting?
Be concise and direct.`;
    const imageParts = await Promise.all(files.map(async (f) => ({ inlineData: { mimeType: f.file.type || 'application/pdf', data: await fileToBase64(f.file) } })));
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ 
            model: MODEL_PRO, // Use Pro with thinking for detailed visual reasoning
            contents: { parts: [{ text: prompt }, ...imageParts] },
            config: { 
                thinkingConfig: { thinkingBudget: 32768 } // Enable Thinking for explanations
            }
        }));
        return response.text ?? "Explanation unavailable.";
    } catch { return "Explanation unavailable due to high traffic."; }
};

export const askDocumentChat = async (extractedData: ExtractedData, question: string, chatHistory: ChatMessage[]): Promise<{ text: string; sources?: { title: string; uri: string }[] }> => {
    const chat = ai.chats.create({
        model: MODEL_STD, // Use Standard Flash for tool support
        config: { 
            systemInstruction: "You are a helpful AI assistant. Answer questions based on the provided document JSON data. If the user asks for external information not found in the document, use Google Search.",
            tools: [{ googleSearch: {} }] 
        },
        history: chatHistory.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
    });

    try {
        const result = await withRetry<GenerateContentResponse>(() => chat.sendMessage({ message: `Document Data: ${JSON.stringify(extractedData.structuredData)}\n\nUser Question: ${question}` }));
        const text = result.text ?? "Sorry, I could not generate a response.";

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
    } catch (e) {
        console.error(e);
        return { text: "I'm having trouble connecting right now due to high traffic. Please try asking again in a moment." };
    }
};

export const generateSketchnotes = async (extractedData: ExtractedData): Promise<string> => {
    const dataStr = JSON.stringify(extractedData.structuredData, null, 2);
    const dateStr = new Date().toLocaleDateString();

    const prompt = `
You are an AI visual note designer.
Your task is to convert the provided extracted document content into visually structured SKETCHNOTES.
Transform plain text into sketchnotes that are easy to understand, visually organized, and suitable for quick revision.
Produce a SKETCHNOTES-style layout in clean visual text format.
\n\n${dataStr}\n\nwatermark :Generated by DataExtract AI • ${dateStr}
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: MODEL_PRO,
            contents: prompt,
        }));
        return response.text ?? "Could not generate sketchnotes.";
    } catch {
        return "Sketchnote generation unavailable due to high traffic.";
    }
};

export const generateCreativeImage = async (prompt: string, size: '1K' | '2K' | '4K'): Promise<string> => {
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: MODEL_IMAGE,
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    imageSize: size,
                    aspectRatio: "16:9" // Default to landscape for broad applicability
                }
            }
        }));

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("No image data found in response.");
    } catch (e) {
        console.error("Image generation error:", e);
        throw new Error("Failed to generate image. Please try again.");
    }
};

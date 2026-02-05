
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import type { UploadedFile, ExtractedData, AISummaryData, ChatMessage, Highlight } from '../types';
import { fileToBase64 } from '../utils/fileUtils';

// Always initialize GoogleGenAI using the process.env.API_KEY environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Model definitions based on task complexity
const MODEL_LITE = "gemini-flash-lite-latest"; // Low-latency, cost-effective
const MODEL_STD = "gemini-3-flash-preview";    // Standard, tool-capable
const MODEL_PRO = "gemini-3-pro-preview";      // High-intelligence, reasoning

// Helper to robustly extract JSON from potentially Markdown-wrapped or dirty text
const cleanJsonOutput = (text: string): string => {
    if (!text) return "{}";
    
    // 1. Try to find the outermost JSON object bounds
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return text.substring(firstBrace, lastBrace + 1);
    }
    
    // 2. Fallback: Standard Markdown cleaning
    return text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
};

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
        
        const parsed = JSON.parse(cleanJsonOutput(responseText));
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
    const languageHint = language !== 'auto' ? ` The content language is ${language}.` : '';
    const imageParts = await Promise.all(
        files.map(async (file) => ({
            inlineData: { mimeType: file.file.type, data: await fileToBase64(file.file) },
        }))
    );

    // New System Prompt Definition
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

    try {
        const response = await ai.models.generateContent({
            model: MODEL_PRO, // gemini-3-pro-preview
            contents: { parts: [{ text: prompt }, ...imageParts] },
            config: { 
                responseMimeType: "application/json",
                // Enable Thinking Mode with max budget for detailed forensic analysis
                thinkingConfig: { thinkingBudget: 32768 } 
            },
        });

        const responseText = response.text;
        if (!responseText) {
            throw new Error("Extraction engine returned an empty response.");
        }
        
        const parsed = JSON.parse(cleanJsonOutput(responseText));
        
        // --- Post-Processing: Map to ExtractedData Interface & Extract Highlights ---
        const highlights: Highlight[] = [];
        
        // Helper to extract highlight from a field object
        const processField = (field: any, name: string) => {
            if (field && field.boundingBox && Array.isArray(field.boundingBox)) {
                highlights.push({
                    fieldName: name,
                    text: String(field.value),
                    boundingBox: [
                        field.boundingBox[1], // x_min
                        field.boundingBox[0], // y_min
                        field.boundingBox[3], // x_max
                        field.boundingBox[2]  // y_max
                    ],
                    confidence: field.confidence || 0
                });
            }
        };

        // 1. Process Title
        if (parsed.structuredData?.title) {
            processField(parsed.structuredData.title, "Document Title");
        }

        // 2. Process Sections
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

        // 3. Process Tables
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

        // Return strictly typed ExtractedData
        return {
            documentType: parsed.meta?.contentType || docType,
            confidenceScore: parsed.structuredData?.title?.confidence || 90, // Fallback confidence
            meta: parsed.meta,
            structuredData: parsed.structuredData,
            imageAnalysis: parsed.imageAnalysis,
            rawTextSummary: parsed.rawTextSummary,
            data: parsed.structuredData, // Keep for legacy refs if needed, though Adapter handles it
            highlights: highlights
        };

    } catch (e) {
        console.error(e);
        throw new Error("Extraction engine failed to parse document content.");
    }
};

export const generateSummaryFromData = async (extractedData: ExtractedData, isDetailed = false): Promise<AISummaryData> => {
    // If we already have a rawTextSummary from the main pass, use it first if it's simple
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
        const response = await ai.models.generateContent({
            model: MODEL_LITE, // Use Flash Lite for fast text-based summarization
            contents: prompt,
            config: { responseMimeType: "application/json" },
        });
        const responseText = response.text;
        if (responseText) {
            return JSON.parse(cleanJsonOutput(responseText)) as AISummaryData;
        }
        throw new Error("Summary generation returned an empty response.");
    } catch {
        return { summary: "Summary generation failed.", confidenceScore: 0 };
    }
};

export const getExplanationForField = async (fieldName: string, fieldValue: string, files: UploadedFile[]): Promise<string> => {
    const prompt = `Explain the extraction of the field "${fieldName}" with value "${fieldValue}".
1. Location: Where is this visually located in the document? (e.g., top-right, table header)
2. Labeling: Is there an explicit label nearby (e.g., "Total:", "Date:")?
3. Reasoning: Why is this value correct? Did you correct any OCR errors or formatting?
Be concise and direct.`;
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
        model: MODEL_STD, // Use Standard Flash for tool support
        config: { 
            systemInstruction: "You are a helpful AI assistant. Answer questions based on the provided document JSON data. If the user asks for external information not found in the document, use Google Search.",
            tools: [{ googleSearch: {} }] 
        },
        history: chatHistory.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
    });

    const result = await chat.sendMessage({ message: `Document Data: ${JSON.stringify(extractedData.structuredData)}\n\nUser Question: ${question}` });
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
};


import { ExtractedData } from '../types';

/**
 * Formats extracted data into a clean, professional text document.
 * Follows rules: Title, Separators, ISO Dates, Numbered Lists, indentation.
 */
export const formatAsOfficialDocument = (extracted: ExtractedData): string => {
    const lines: string[] = [];
    const push = (str: string) => lines.push(str);
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    // --- Header ---
    push(extracted.documentType.toUpperCase());
    push("------------------------------------");
    push(`Date Processed: ${dateStr}`);
    push(`Confidence Score: ${extracted.confidenceScore}%`);
    push("");

    // --- Formatting Helpers ---
    const formatValue = (val: any): string => {
        if (val === null || val === undefined) return "N/A";
        if (typeof val === 'boolean') return val ? "Yes" : "No";
        // Check for ISO Date strings
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
             const d = new Date(val);
             if(!isNaN(d.getTime())) return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        }
        return String(val);
    };

    const toTitleCase = (str: string) => str.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

    // --- Recursive Processor ---
    const process = (data: any, depth: number = 0) => {
        const indent = " ".repeat(depth);
        
        if (Array.isArray(data)) {
            data.forEach((item, idx) => {
                if (typeof item === 'object' && item !== null) {
                    push(`${indent}${idx + 1}. Item #${idx + 1}`); // Generic header for list items
                    Object.entries(item).forEach(([k, v]) => {
                        const label = toTitleCase(k);
                        // Recurse for nested objects/arrays inside list items
                        if (typeof v === 'object' && v !== null) {
                            push(`${indent}   ${label}:`);
                            process(v, depth + 4);
                        } else {
                            push(`${indent}   ${label}: ${formatValue(v)}`);
                        }
                    });
                } else {
                    // Simple array of primitives
                    push(`${indent}${idx + 1}. ${formatValue(item)}`);
                }
            });
        } else if (typeof data === 'object' && data !== null) {
            Object.entries(data).forEach(([k, v]) => {
                const label = toTitleCase(k);
                
                if (v === null || v === undefined) return;

                if (Array.isArray(v)) {
                    // Section Header for Arrays
                    push("");
                    push(`${indent}${label}`);
                    push(`${indent}${"-".repeat(label.length)}`);
                    process(v, depth); // Don't indent lists too much, keep aligned
                    push("");
                } else if (typeof v === 'object') {
                    // Subsection for Objects
                    push("");
                    push(`${indent}${label}`);
                    process(v, depth + 2);
                } else {
                    // Key-Value Pair
                    if (k.toLowerCase().includes('note')) {
                        push(`${indent}Note:`);
                        push(`${indent}  ${formatValue(v)}`);
                    } else {
                        push(`${indent}${label}: ${formatValue(v)}`);
                    }
                }
            });
        }
    };

    // --- Main Body Processing ---
    // Handle root being an array (Batch) vs Object (Single Doc)
    if (Array.isArray(extracted.data)) {
        extracted.data.forEach((d, i) => {
            push(`RECORD #${i + 1}`);
            push("================");
            process(d);
            push("\n");
        });
    } else {
        process(extracted.data);
    }

    // --- Footer ---
    push("");
    push("------------------------------------");
    push("End of Report");

    return lines.join("\n");
};

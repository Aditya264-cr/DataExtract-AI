import { ExtractedData, ExtractedSection, ExtractedTable } from '../types';

/**
 * Formats extracted data into a professional, structured report.
 * Ensures human readability with proper sections and numbering, avoiding markdown.
 */
export const formatAsOfficialDocument = (extracted: ExtractedData, showWatermark: boolean = true): string => {
    const lines: string[] = [];
    const push = (str: string) => lines.push(str);
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    // --- Report Header ---
    push(`${(extracted.documentType || 'DOCUMENT').toUpperCase()} REPORT`);
    push("=".repeat(40));
    push(`Date Processed: ${dateStr}`);
    push(`Confidence Score: ${extracted.confidenceScore}%`);
    push("");

    if (extracted.rawTextSummary) {
        push("EXECUTIVE SUMMARY");
        push("-".repeat(17));
        push(extracted.rawTextSummary);
        push("");
    }

    // --- Structured Data Processing ---
    // We prioritize the known schema (sections/tables) over generic recursion for better readability.
    
    const root = extracted.structuredData || extracted.data; // Fallback for legacy

    // 1. Document Title
    const titleVal = root.title && typeof root.title === 'object' && 'value' in root.title 
        ? root.title.value 
        : root.title;
        
    if (titleVal) {
        push(`TITLE: ${String(titleVal).toUpperCase()}`);
        push("");
    }

    // 2. Sections
    if (Array.isArray(root.sections) && root.sections.length > 0) {
        push("SECTIONS");
        push("=".repeat(8));
        push("");

        root.sections.forEach((section: ExtractedSection, idx: number) => {
            const heading = section.heading || `Section ${idx + 1}`;
            push(`${idx + 1}. ${heading.toUpperCase()}`);
            push("-".repeat(heading.length + 3));

            if (Array.isArray(section.content)) {
                section.content.forEach(field => {
                    const label = field.label || "Field";
                    const value = field.value !== null && field.value !== undefined ? String(field.value) : "N/A";
                    push(`   • ${label}: ${value}`);
                });
            }
            push(""); // Spacer
        });
    }

    // 3. Tables
    if (Array.isArray(root.tables) && root.tables.length > 0) {
        push("DATA TABLES");
        push("=".repeat(11));
        push("");

        root.tables.forEach((table: ExtractedTable, tIdx: number) => {
            const tableName = table.tableName || `Table ${tIdx + 1}`;
            push(`Table ${tIdx + 1}: ${tableName}`);
            push("-".repeat(tableName.length + 9));

            if (table.rows && table.rows.length > 0) {
                // Determine headers
                const headers = table.headers && table.headers.length > 0 
                    ? table.headers 
                    : Object.keys(table.rows[0]);

                if (headers.length > 0) {
                    // List format is safer for text reports than trying to align ASCII columns which break easily
                    table.rows.forEach((row, rIdx) => {
                        push(`   [Row ${rIdx + 1}]`);
                        headers.forEach(header => {
                            let cellVal: any = row[header];
                            // Unpack object if needed (handle ExtractedField structure)
                            if (cellVal && typeof cellVal === 'object' && 'value' in cellVal) {
                                cellVal = cellVal.value;
                            }
                            const displayVal = cellVal !== null && cellVal !== undefined ? String(cellVal) : "";
                            push(`      - ${header}: ${displayVal}`);
                        });
                        push("");
                    });
                } else {
                    push("   (No columns detected)");
                }
            } else {
                push("   (Empty table)");
            }
            push("");
        });
    }

    // 4. Generic Fallback (if no sections/tables found but data exists)
    // This handles legacy data or unstructured flat data scenarios
    const hasStructure = (root.sections?.length || 0) > 0 || (root.tables?.length || 0) > 0;
    if (!hasStructure && typeof root === 'object') {
        push("EXTRACTED FIELDS");
        push("=".repeat(16));
        
        // Recursive printer for arbitrary objects
        const printGeneric = (obj: any, indent: string = "") => {
            Object.entries(obj).forEach(([k, v]) => {
                if (k === 'sections' || k === 'tables' || k === 'title') return; // Skip keys handled above
                
                const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                
                if (v === null || v === undefined) {
                    push(`${indent}${label}: N/A`);
                } else if (typeof v === 'object' && v !== null && !Array.isArray(v) && 'value' in v) {
                    // It's a field object
                    push(`${indent}${label}: ${v.value}`);
                } else if (typeof v === 'object' && v !== null) {
                    push(`${indent}${label}:`);
                    printGeneric(v, indent + "   ");
                } else {
                    push(`${indent}${label}: ${String(v)}`);
                }
            });
        };
        printGeneric(root);
    }

    // --- Footer & Watermark ---
    push("");
    push("=".repeat(40));
    push("END OF REPORT");
    
    if (showWatermark) {
        push("");
        push("Generated by DataExtract AI");
    }

    return lines.join("\n");
};
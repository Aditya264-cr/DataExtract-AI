
/**
 * Helper to unwrap value if it's inside a structured object (e.g. { value: 100, confidence: 90 })
 */
const unwrapValue = (val: any): any => {
    if (val && typeof val === 'object' && 'value' in val) {
        return val.value;
    }
    return val;
};

/**
 * Clean a string to a float number, removing currency symbols and commas.
 */
export const cleanNumber = (val: any): number => {
    const raw = unwrapValue(val);
    if (typeof raw === 'number') return raw;
    if (!raw) return 0;
    // Remove all non-numeric chars except period and minus
    const cleaned = String(raw).replace(/[^0-9.-]+/g, '');
    return parseFloat(cleaned) || 0;
};

/**
 * Logic Issue definition for client-side validation.
 */
export interface LogicIssue {
    type: 'math' | 'logic' | 'date' | 'format' | 'confidence';
    message: string;
    severity: 'warning' | 'error';
    involvedKeys: string[];
    rowIndex?: number; // Optional index for array/table rows
}

export interface ValidationResult {
    isValid: boolean;
    issues: LogicIssue[];
}

const validateField = (key: string, value: any, path: string[], issuesList: LogicIssue[]) => {
    const strVal = String(value).trim();
    if (!strVal || strVal === 'null' || strVal === 'undefined') return;
    
    const lowerKey = key.toLowerCase();
    
    // Determine rowIndex if applicable (last numeric part of path)
    const numericPart = [...path].reverse().find(p => !isNaN(parseInt(p)));
    const rowIndex = numericPart ? parseInt(numericPart) : undefined;

    // Email
    if (lowerKey.includes('email')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(strVal)) {
            issuesList.push({
                type: 'format',
                message: `Invalid email format: "${strVal}"`,
                severity: 'warning',
                involvedKeys: [key],
                rowIndex
            });
        }
    }
    
    // Phone - basic check for minimal format
    if ((lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('fax')) && !lowerKey.includes('id')) {
            const allowed = /^[0-9+\-().\s]+$/;
            const digits = strVal.replace(/\D/g, '').length;
            // Must have some digits and mostly allowed chars
            if (!allowed.test(strVal) || digits < 5) {
                // Allow "Ext." but flag other text
                if (/[a-zA-Z]/.test(strVal) && !strVal.toLowerCase().includes('ext')) {
                    issuesList.push({
                    type: 'format',
                    message: `Suspicious phone format: "${strVal}"`,
                    severity: 'warning',
                    involvedKeys: [key],
                    rowIndex
                });
                }
            }
    }

    // Date validation (ISO preferred or parsable)
    if ((lowerKey.includes('date') || lowerKey.includes('dob') || lowerKey.includes('due') || lowerKey.includes('expires')) && 
        !lowerKey.includes('update') && !lowerKey.includes('candidate')) {
        
        const d = new Date(strVal);
        if (isNaN(d.getTime())) {
                issuesList.push({
                type: 'format',
                message: `Invalid date format: "${strVal}"`,
                severity: 'warning',
                involvedKeys: [key],
                rowIndex
            });
        }
    }
    
    // URL
    if (lowerKey.includes('website') || lowerKey.includes('url')) {
        if (!strVal.includes('.') || strVal.includes(' ')) {
                issuesList.push({
                type: 'format',
                message: `Invalid URL format: "${strVal}"`,
                severity: 'warning',
                involvedKeys: [key],
                rowIndex
            });
        }
    }
};

/**
 * Recursively scan for low confidence fields in the structured data.
 */
export const validateConfidence = (data: any): LogicIssue[] => {
    const issues: LogicIssue[] = [];
    
    // Recursive check for objects with 'confidence' property
    const traverse = (obj: any, path: string) => {
        if (!obj) return;
        
        if (typeof obj === 'object') {
            if ('value' in obj && 'confidence' in obj && typeof obj.confidence === 'number') {
                const conf = obj.confidence;
                const label = obj.label || path.split('>').pop()?.trim() || path;
                
                if (conf < 70) {
                    issues.push({
                        type: 'confidence',
                        message: `Very Low Confidence (${conf}%) in '${label}'. Verify before export.`,
                        severity: 'error', // Critical: Blocks export
                        involvedKeys: [path]
                    });
                } else if (conf < 80) {
                    issues.push({
                        type: 'confidence',
                        message: `Low Confidence (${conf}%) in '${label}'. Please review.`,
                        severity: 'warning', // Warning: Needs review
                        involvedKeys: [path]
                    });
                } else if (conf < 90) {
                    issues.push({
                        type: 'confidence',
                        message: `Moderate Confidence (${conf}%) in '${label}'.`,
                        severity: 'warning', // Soft flag
                        involvedKeys: [path]
                    });
                }
            }
            
            // Recurse into children
            Object.keys(obj).forEach(key => {
                // Skip meta fields
                if (key !== 'boundingBox' && key !== 'imageAnalysis' && key !== 'confidence' && key !== 'value') {
                    // Check if array (e.g. sections, content, tables, rows)
                    if (Array.isArray(obj[key])) {
                        obj[key].forEach((item: any, idx: number) => {
                            // Friendly path naming
                            let nextPath = path;
                            if (item.heading) nextPath = item.heading;
                            else if (item.tableName) nextPath = item.tableName;
                            else nextPath = path ? `${path} > [${idx}]` : `${key}[${idx}]`;
                            
                            traverse(item, nextPath);
                        });
                    } else {
                        traverse(obj[key], path ? `${path} > ${key}` : key);
                    }
                }
            });
        }
    };

    const root = data.structuredData || data;
    traverse(root, '');
    
    return issues;
};

/**
 * Validates a specific table (array of objects) for math consistency and field formats.
 */
export const validateTable = (rows: any[]): ValidationResult => {
    const issues: LogicIssue[] = [];
    if (!rows || !Array.isArray(rows) || rows.length === 0) return { isValid: true, issues: [] };

    // Heuristics for columns based on the first row (or structure)
    const firstRow = rows[0];
    const keys = Object.keys(firstRow);
    
    // Identify Math Columns
    const qtyKey = keys.find(k => ['qty', 'quantity', 'count', 'units', 'hours'].some(s => k.toLowerCase() === s || k.toLowerCase().includes(s)));
    const priceKey = keys.find(k => ['price', 'rate', 'unit_cost', 'unit_price'].some(s => k.toLowerCase().includes(s)) && !k.toLowerCase().includes('total'));
    const lineTotalKey = keys.find(k => ['total', 'amount', 'net'].some(s => k.toLowerCase().includes(s)) && !k.toLowerCase().includes('sub'));

    rows.forEach((row, index) => {
        // 1. Math Check (Qty * Price = Total)
        if (qtyKey && priceKey && lineTotalKey) {
            const q = cleanNumber(row[qtyKey]);
            const p = cleanNumber(row[priceKey]);
            const t = cleanNumber(row[lineTotalKey]);
            
            // Check calculation with tolerance for rounding errors
            if (q !== 0 && p !== 0 && Math.abs((q * p) - t) > 0.05) {
                issues.push({
                    type: 'math',
                    message: `Math mismatch in row ${index + 1}: ${q} * ${p} != ${t}`,
                    severity: 'error',
                    involvedKeys: [qtyKey, priceKey, lineTotalKey],
                    rowIndex: index
                });
            }
        }

        // 2. Field Validation
        Object.entries(row).forEach(([key, val]) => {
            const value = unwrapValue(val);
            validateField(key, value, [`row_${index}`, key], issues);
        });
    });

    return {
        isValid: issues.length === 0,
        issues
    };
};

/**
 * Validates the entire document structure including cross-field logic (Dates, Tax vs Total).
 */
export const validateDocumentLogic = (flattenedData: Record<string, any>): ValidationResult => {
    const issues: LogicIssue[] = [];
    
    // 1. Field Level Checks
    Object.entries(flattenedData).forEach(([key, value]) => {
        validateField(key, value, [key], issues);
    });

    // 2. Document Level Date Logic (Invoice vs Due Date)
    const dateKeys = Object.keys(flattenedData).filter(k => k.toLowerCase().includes('date'));
    const invoiceDateKey = dateKeys.find(k => k.toLowerCase().includes('invoice'));
    const dueDateKey = dateKeys.find(k => k.toLowerCase().includes('due'));

    if (invoiceDateKey && dueDateKey) {
        const d1 = new Date(flattenedData[invoiceDateKey]);
        const d2 = new Date(flattenedData[dueDateKey]);
        
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
            if (d2 < d1) {
                issues.push({
                    type: 'logic',
                    message: `Due Date (${d2.toLocaleDateString()}) is before Invoice Date (${d1.toLocaleDateString()})`,
                    severity: 'warning',
                    involvedKeys: [invoiceDateKey, dueDateKey]
                });
            }
        }
    }

    // 3. Document Level Math (Tax vs Total)
    const keys = Object.keys(flattenedData);
    const taxKey = keys.find(k => k.toLowerCase().includes('tax') && k.toLowerCase().includes('amount'));
    const totalKey = keys.find(k => (k.toLowerCase() === 'total' || k.toLowerCase().includes('total amount')) && !k.toLowerCase().includes('sub'));
    const subTotalKey = keys.find(k => k.toLowerCase().includes('subtotal') || k.toLowerCase().includes('sub_total'));

    if (taxKey && totalKey) {
        const tax = cleanNumber(flattenedData[taxKey]);
        const total = cleanNumber(flattenedData[totalKey]);
        
        if (tax > total && total > 0) {
            issues.push({
                type: 'logic',
                message: `Tax (${tax}) is greater than Total Amount (${total})`,
                severity: 'error',
                involvedKeys: [taxKey, totalKey]
            });
        }

        if (subTotalKey) {
            const sub = cleanNumber(flattenedData[subTotalKey]);
            if (sub + tax !== total && total > 0 && Math.abs((sub + tax) - total) > 0.05) {
                 issues.push({
                    type: 'math',
                    message: `Subtotal + Tax (${(sub+tax).toFixed(2)}) does not equal Total (${total})`,
                    severity: 'warning',
                    involvedKeys: [subTotalKey, taxKey, totalKey]
                });
            }
        }
    }

    return {
        isValid: issues.length === 0,
        issues
    };
};

export const autoFormatValue = (key: string, value: string): string => {
    if (!value) return value;
    const lowerKey = key.toLowerCase();

    // Date: Try to standardize to YYYY-MM-DD if likely a date field
    if (lowerKey.includes('date') || lowerKey.includes('dob') || lowerKey.includes('due')) {
        // If it looks like DD/MM/YYYY or MM/DD/YYYY, try to standardise to ISO
        // Simple heuristic: if parsable by Date, return ISO date part
        const d = new Date(value);
        if (!isNaN(d.getTime()) && value.length > 6) { // avoid parsing short numbers as dates
             return d.toISOString().split('T')[0];
        }
    }

    // Phone: (123) 456-7890 style if digits are sufficient
    if ((lowerKey.includes('phone') || lowerKey.includes('mobile')) && !lowerKey.includes('id')) {
        const digits = value.replace(/\D/g, '');
        if (digits.length === 10) {
            return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
        }
    }

    return value;
};


/**
 * Clean a string to a float number, removing currency symbols and commas.
 */
export const cleanNumber = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // Remove all non-numeric chars except period and minus
    // Handle simplified cases (does not fully support EU 1.000,00 swapping without locale context)
    const cleaned = String(val).replace(/[^0-9.-]+/g, '');
    return parseFloat(cleaned) || 0;
};

/**
 * Logic Issue definition for client-side validation.
 */
export interface LogicIssue {
    type: 'math' | 'logic' | 'date' | 'format';
    message: string;
    severity: 'warning' | 'error';
    involvedKeys: string[];
    rowIndex?: number; // Optional index for array/table rows
}

export interface ValidationResult {
    isValid: boolean;
    issues: LogicIssue[];
}

/**
 * Identify document structure and check business logic constraints.
 * 1. Math Check: Line Items (Qty * Price = Total) and Root (Subtotal + Tax = Total)
 * 2. Sanity Check: Tax < Total
 * 3. Date Check: Due Date >= Invoice Date
 * 4. Format Check: Email, Phone, URL, Dates
 */
export const validateDocumentLogic = (data: any): ValidationResult => {
    const issues: LogicIssue[] = [];
    
    // We validate the first object if it's an array (typical extraction output structure)
    // or the object itself.
    const target = Array.isArray(data) ? data[0] : data;
    if (!target || typeof target !== 'object') return { isValid: true, issues: [] };

    const keys = Object.keys(target);

    // Helper to find specific key based on partial matches
    const getKey = (includes: string[], excludes: string[] = []) => {
        return keys.find(k => {
            const lower = k.toLowerCase();
            return includes.some(inc => lower.includes(inc)) && !excludes.some(exc => lower.includes(exc));
        });
    };

    // --- 1. Root Level Math (Subtotal + Tax = Total) ---
    const subtotalKey = getKey(['subtotal', 'sub_total', 'net_amount']);
    const taxKey = getKey(['tax', 'vat', 'gst'], ['total', 'id']);
    const totalKey = getKey(['total', 'grand_total', 'amount_due'], ['sub', 'net', 'tax']);

    if (subtotalKey && taxKey && totalKey) {
        const sub = cleanNumber(target[subtotalKey]);
        const tax = cleanNumber(target[taxKey]);
        const total = cleanNumber(target[totalKey]);
        
        // 5 cents tolerance for rounding
        if (Math.abs((sub + tax) - total) > 0.05) { 
             issues.push({
                type: 'math',
                message: `Sum Mismatch: ${subtotalKey} (${sub}) + ${taxKey} (${tax}) ≠ ${totalKey} (${total})`,
                severity: 'warning',
                involvedKeys: [subtotalKey, taxKey, totalKey]
            });
        }
    }

    // --- 2. Sanity Check: Tax cannot be larger than Total ---
    if (taxKey && totalKey) {
        const tax = cleanNumber(target[taxKey]);
        const total = cleanNumber(target[totalKey]);
        // Only trigger if both are non-zero to avoid false positives on empty fields
        if (tax > total && total > 0) { 
             issues.push({
                type: 'logic',
                message: `Sanity Check: '${taxKey}' (${tax}) is greater than '${totalKey}' (${total})`,
                severity: 'error',
                involvedKeys: [taxKey, totalKey]
            });
        }
    }

    // --- 3. Date Check: Due Date cannot be before Invoice Date ---
    const dateKey = getKey(['invoice_date', 'date_issued', 'issue_date'], ['due']);
    const dueDateKey = getKey(['due_date', 'due']);

    if (dateKey && dueDateKey) {
        const d1 = new Date(target[dateKey]);
        const d2 = new Date(target[dueDateKey]);
        
        // Check valid dates
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
            // Strip time for comparison
            d1.setHours(0,0,0,0);
            d2.setHours(0,0,0,0);

            if (d2 < d1) {
                issues.push({
                    type: 'date',
                    message: `Date Logic: '${dueDateKey}' cannot be before '${dateKey}'`,
                    severity: 'error',
                    involvedKeys: [dateKey, dueDateKey]
                });
            }
        }
    }

    // --- 4. Line Item Math (Quantity * Unit Price = Total) ---
    // Heuristic: Look for arrays that look like line items
    for (const key of keys) {
        if (Array.isArray(target[key])) {
            const list = target[key];
            if (list.length > 0 && typeof list[0] === 'object' && list[0] !== null) {
                // Check first item to determine structure
                const itemKeys = Object.keys(list[0]);
                
                const qtyKey = itemKeys.find(k => ['qty', 'quantity', 'count', 'units'].some(s => k.toLowerCase() === s || k.toLowerCase().includes(s)));
                const priceKey = itemKeys.find(k => ['price', 'rate', 'unit_cost'].some(s => k.toLowerCase().includes(s)) && !k.toLowerCase().includes('total'));
                const lineTotalKey = itemKeys.find(k => ['total', 'amount'].some(s => k.toLowerCase().includes(s)) && !k.toLowerCase().includes('sub'));

                if (qtyKey && priceKey && lineTotalKey) {
                    list.forEach((item: any, index: number) => {
                        const q = cleanNumber(item[qtyKey]);
                        const p = cleanNumber(item[priceKey]);
                        const t = cleanNumber(item[lineTotalKey]);
                        
                        // Check if calculation holds (allow rounding diff)
                        if (q !== 0 && p !== 0 && Math.abs((q * p) - t) > 0.05) {
                            issues.push({
                                type: 'math',
                                message: `Line Item ${index + 1}: ${qtyKey} (${q}) × ${priceKey} (${p}) ≠ ${lineTotalKey} (${t})`,
                                severity: 'warning',
                                involvedKeys: [qtyKey, priceKey, lineTotalKey],
                                rowIndex: index
                            });
                        }
                    });
                }
            }
        }
    }

    // --- 5. Format Validation (Recursive) ---
    const validateRecursively = (obj: any, path: string[] = []) => {
        if (!obj || typeof obj !== 'object') return;

        if (Array.isArray(obj)) {
            obj.forEach((item, i) => validateRecursively(item, [...path, String(i)]));
            return;
        }

        Object.entries(obj).forEach(([key, value]) => {
            const currentPath = [...path, key];
            
            if (typeof value === 'object' && value !== null) {
                validateRecursively(value, currentPath);
                return;
            }

            const strVal = String(value).trim();
            if (!strVal) return;
            
            const lowerKey = key.toLowerCase();
            
            // Determine rowIndex if applicable (last numeric part of path)
            const numericPart = [...path].reverse().find(p => !isNaN(parseInt(p)));
            const rowIndex = numericPart ? parseInt(numericPart) : undefined;

            // Email
            if (lowerKey.includes('email')) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(strVal)) {
                    issues.push({
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
                         issues.push({
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
                     issues.push({
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
                     issues.push({
                        type: 'format',
                        message: `Invalid URL format: "${strVal}"`,
                        severity: 'warning',
                        involvedKeys: [key],
                        rowIndex
                    });
                }
            }
        });
    };

    validateRecursively(data, []);

    return {
        isValid: issues.length === 0,
        issues
    };
};

/**
 * Auto-format values based on field name context and content.
 */
export const autoFormatValue = (key: string, value: string): string => {
    if (!value) return value;
    const lowerKey = key.toLowerCase();

    // 1. Date Formatting (ISO 8601)
    // Matches keys with 'date' but not 'update' or 'consolidate'
    if (lowerKey.includes('date') && !lowerKey.includes('update')) {
        // Try to parse flexible date strings
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            // Check if input looks like a year-first or clearly parsable date to avoid "123" becoming a date
            if (value.length > 5 && /\d/.test(value)) {
                return date.toISOString().split('T')[0]; // YYYY-MM-DD
            }
        }
    }

    // 2. Phone Formatting (US/Intl basic)
    if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('fax')) {
        // Strip non-digits
        const digits = value.replace(/\D/g, '');
        
        // US Standard (10 digits)
        if (digits.length === 10) {
            return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
        }
        // US with Country Code 1 (11 digits)
        if (digits.length === 11 && digits.startsWith('1')) {
            return `+1 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
        }
        // Generic International (add + if missing)
        if (digits.length > 7 && !value.startsWith('+')) {
            return `+${digits}`;
        }
    }

    return value;
};

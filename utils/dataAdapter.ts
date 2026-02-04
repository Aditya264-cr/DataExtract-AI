
/**
 * Data Adapter Utilities
 * Implements specific patterns for transforming raw JSON into UI-ready formats.
 */

export interface DiscoveredTable {
    id: string;   // Unique path identifier
    name: string; // Human-readable title
    data: any[];  // The array of objects
    path: string; // The key path in the original object
}

/**
 * Key-Value Adapter: Flattens nested objects into a single depth dictionary.
 * Arrays are summarized rather than expanded, to keep the KV view clean.
 */
export const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
    return Object.keys(obj).reduce((acc: any, k) => {
        const pre = prefix.length ? prefix + ' > ' : '';
        const value = obj[k];
        
        // Formatted key for display (CamelCase -> Title Case)
        const displayKey = (pre + k).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Recursion for nested objects
            Object.assign(acc, flattenObject(value, displayKey));
        } else if (Array.isArray(value)) {
            // Adapter Pattern: Mark arrays as tables/lists instead of expanding them in KV view
            acc[displayKey] = `[Table/List: ${value.length} items]`; 
        } else {
            // Simple value
            acc[displayKey] = value;
        }
        return acc;
    }, {});
};

/**
 * Table Discovery Adapter: Recursively scans JSON to find arrays of objects.
 * This isolates "Grids" from metadata.
 */
export const extractTables = (data: any): DiscoveredTable[] => {
    const tables: DiscoveredTable[] = [];
    
    const search = (obj: any, path: string, friendlyName: string) => {
        // 1. Check if the current object IS a table (Root level array)
        if (Array.isArray(obj)) {
            if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
                tables.push({ 
                    id: path || 'root', 
                    name: friendlyName || 'Main Data', 
                    data: obj, 
                    path: path 
                });
            }
            return;
        }

        // 2. Traverse Object
        if (typeof obj === 'object' && obj !== null) {
            Object.entries(obj).forEach(([key, value]) => {
                // Build new path
                const newPath = path ? `${path}.${key}` : key;
                // Build readable name
                const newName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                if (Array.isArray(value)) {
                    // Found a candidate array
                    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                        tables.push({ 
                            id: newPath, 
                            name: newName, 
                            data: value, 
                            path: newPath 
                        });
                    }
                } else if (typeof value === 'object' && value !== null) {
                    // Recurse deeper
                    search(value, newPath, newName);
                }
            });
        }
    };

    search(data, '', '');
    return tables;
};

/**
 * Helper to update deep values in the original state based on flattened keys or paths.
 * Note: Logic limits creation of new branches to preserve schema.
 */
export const updateNestedState = (obj: any, pathString: string, value: any, separator = ' > '): any => {
    // We assume the pathString matches the display key structure used in flattening
    // This is a simplified reconstruction. For robust editing, we usually need exact keys.
    // Here we attempt to map Title Case display keys back to object keys via case-insensitive matching.
    
    const parts = pathString.split(separator);
    
    const updateRecursive = (current: any, keys: string[]): any => {
        if (keys.length === 0) return value;
        
        const [head, ...tail] = keys;
        
        // Removing spaces to attempt matching "Total Amount" -> "totalAmount" or "TotalAmount"
        // This is heuristic-based.
        const cleanHead = head.replace(/\s+/g, '').toLowerCase();
        
        // Find actual key in current object
        let realKey = Object.keys(current || {}).find(k => k.toLowerCase() === cleanHead || k.replace(/\s+/g, '').toLowerCase() === cleanHead);
        
        // If not found, check strict match or fallback to head (might create new key)
        if (!realKey) {
             realKey = Object.keys(current || {}).find(k => k.toLowerCase() === head.toLowerCase()) || head;
        }

        if (tail.length === 0) {
            return { ...current, [realKey]: value };
        }
        
        return { 
            ...current, 
            [realKey]: updateRecursive(current && current[realKey] ? current[realKey] : {}, tail) 
        };
    };

    return updateRecursive(obj, parts);
};

/**
 * Update a specific item in a discovered table path
 */
export const updateTableData = (rootData: any, tablePath: string, rowIndex: number, columnKey: string, newValue: any): any => {
    // Clone root
    const newData = Array.isArray(rootData) ? [...rootData] : { ...rootData };
    
    if (tablePath === '' || tablePath === 'root') {
        // Root array
        if (Array.isArray(newData)) {
            newData[rowIndex] = { ...newData[rowIndex], [columnKey]: newValue };
        }
        return newData;
    }

    // Traverse to the array location
    const parts = tablePath.split('.');
    let current = newData;
    
    for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        current[key] = { ...current[key] }; // Shallow copy path
        current = current[key];
    }
    
    const finalKey = parts[parts.length - 1];
    if (current[finalKey] && Array.isArray(current[finalKey])) {
        const newArray = [...current[finalKey]];
        newArray[rowIndex] = { ...newArray[rowIndex], [columnKey]: newValue };
        current[finalKey] = newArray;
    }

    return newData;
};

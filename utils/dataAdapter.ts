
/**
 * Data Adapter Utilities
 * Implements specific patterns for transforming structured JSON into UI-ready formats.
 */

export interface DiscoveredTable {
    id: string;   // Unique path identifier
    name: string; // Human-readable title
    data: any[];  // The array of objects
    path: string; // The key path in the original object
}

/**
 * Key-Value Adapter: Flattens the 'structuredData.sections' into a single depth dictionary.
 */
export const flattenObject = (structuredData: any, prefix = ''): Record<string, any> => {
    // Check if we are dealing with the new schema (has structuredData root) or just the structuredData object itself
    const root = structuredData.structuredData || structuredData;
    const acc: Record<string, any> = {};

    // 1. Title
    if (root.title && root.title.value) {
        acc["Document Title"] = root.title.value;
    }

    // 2. Sections
    if (Array.isArray(root.sections)) {
        root.sections.forEach((section: any) => {
            const sectionName = section.heading || 'General';
            if (Array.isArray(section.content)) {
                section.content.forEach((item: any) => {
                    const key = `${sectionName} > ${item.label}`;
                    acc[key] = item.value;
                });
            }
        });
    }

    // 3. Tables (Summarized for KV view)
    if (Array.isArray(root.tables)) {
        root.tables.forEach((table: any) => {
            const tableName = table.tableName || 'Table';
            const rowCount = Array.isArray(table.rows) ? table.rows.length : 0;
            acc[tableName] = `[Table: ${rowCount} rows]`;
        });
    }

    // Fallback for legacy simple objects if schema doesn't match
    if (Object.keys(acc).length === 0 && typeof structuredData === 'object') {
        return Object.keys(structuredData).reduce((legacyAcc: any, k) => {
             const val = structuredData[k];
             if (typeof val !== 'object') legacyAcc[k] = val;
             return legacyAcc;
        }, {});
    }

    return acc;
};

/**
 * Table Discovery Adapter: Extracts tables from 'structuredData.tables'.
 */
export const extractTables = (structuredData: any): DiscoveredTable[] => {
    const root = structuredData.structuredData || structuredData;
    const tables: DiscoveredTable[] = [];

    if (Array.isArray(root.tables)) {
        root.tables.forEach((table: any, index: number) => {
            // Transform rows from { Col: { value: "x", ... } } to { Col: "x" } for grid display
            const simplifiedRows = (table.rows || []).map((row: any) => {
                const simpleRow: Record<string, any> = {};
                Object.entries(row).forEach(([col, cell]: [string, any]) => {
                    simpleRow[col] = cell?.value ?? cell; // Handle both expanded field object and direct value
                });
                return simpleRow;
            });

            if (simplifiedRows.length > 0) {
                tables.push({
                    id: `table-${index}`,
                    name: table.tableName || `Table ${index + 1}`,
                    data: simplifiedRows,
                    path: `tables.${index}` // Path pointer for updates (requires custom updater)
                });
            }
        });
    }

    return tables;
};

/**
 * Helper to update deep values in the original state.
 * Updated to handle the 'structuredData' schema.
 */
export const updateNestedState = (root: any, pathString: string, newValue: any): any => {
    const newRoot = JSON.parse(JSON.stringify(root)); // Deep clone for safety
    const data = newRoot.structuredData || newRoot;

    // Path format: "Section Name > Label Name"
    const separator = ' > ';
    const parts = pathString.split(separator);
    
    if (parts.length >= 2) {
        const sectionName = parts[0];
        const labelName = parts[1];

        // Find Section
        const section = data.sections?.find((s: any) => s.heading === sectionName);
        if (section && section.content) {
            // Find Item
            const item = section.content.find((i: any) => i.label === labelName);
            if (item) {
                item.value = newValue;
                return newRoot;
            }
        }
        
        // Handle Title special case
        if (pathString === "Document Title" && data.title) {
            data.title.value = newValue;
            return newRoot;
        }
    }

    return newRoot;
};

/**
 * Update a specific item in a discovered table path
 */
export const updateTableData = (rootData: any, tablePath: string, rowIndex: number, columnKey: string, newValue: any): any => {
    const newRoot = JSON.parse(JSON.stringify(rootData));
    const data = newRoot.structuredData || newRoot;

    // tablePath is expected to be "tables.0", "tables.1" etc from extractTables
    const tableIndex = parseInt(tablePath.split('.')[1]);

    if (!isNaN(tableIndex) && data.tables && data.tables[tableIndex]) {
        const table = data.tables[tableIndex];
        if (table.rows && table.rows[rowIndex]) {
            const row = table.rows[rowIndex];
            if (row[columnKey]) {
                row[columnKey].value = newValue;
            } else {
                // If column doesn't exist on this row, create it
                row[columnKey] = { value: newValue, confidence: 100 };
            }
        }
    }

    return newRoot;
};

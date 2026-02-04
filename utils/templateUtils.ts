
/**
 * Recursively creates a schema-like object from a data object by replacing
 * primitive values with their type names.
 * @param data The object or array to convert.
 * @returns A new object representing the schema.
 */
export const createSchemaFromObject = (data: any): any => {
    if (Array.isArray(data)) {
        // If it's an array, process the first element to represent the schema for all elements
        return data.length > 0 ? [createSchemaFromObject(data[0])] : [];
    }

    if (typeof data === 'object' && data !== null) {
        const schema: Record<string, any> = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                schema[key] = createSchemaFromObject(data[key]);
            }
        }
        return schema;
    }

    // For primitive types, return their type name as a string
    const type = typeof data;
    if (type === 'string' || type === 'number' || type === 'boolean') {
        return type;
    }

    // For null or other types, just return null
    return null;
};

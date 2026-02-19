
import { ExtractedData } from '../types';
import { flattenObject } from './dataAdapter';

export type RegressionSeverity = 'none' | 'moderate' | 'major' | 'critical';

export interface RegressionReport {
    severity: RegressionSeverity;
    message: string | null;
    timestamp: number;
}

/**
 * Validates the "Non-Regression Principle" (Segment 5.1)
 * Compares a new state against the previous baseline to ensure no functionality/data is lost.
 */
export const checkRegression = (baseline: ExtractedData, current: ExtractedData): RegressionReport => {
    // 1. Snapshot structure comparison
    const baseFlat = flattenObject(baseline);
    const currFlat = flattenObject(current);
    
    const baseKeys = Object.keys(baseFlat);
    const currKeys = Object.keys(currFlat);
    
    // Check for Silent Removal (Segment 5.4: Critical)
    // If a field existed in baseline but is gone in current, it's a critical regression
    // We ignore internal keys or UI specific keys if any
    const missingKeys = baseKeys.filter(k => 
        !currKeys.includes(k) && 
        baseFlat[k] !== null && 
        baseFlat[k] !== undefined &&
        String(baseFlat[k]).trim() !== ''
    );

    if (missingKeys.length > 0) {
        return {
            severity: 'critical',
            message: `CRITICAL REGRESSION: ${missingKeys.length} fields were removed (e.g., "${missingKeys[0]}"). Data loss detected.`,
            timestamp: Date.now()
        };
    }

    // 2. Confidence Score Degradation (Segment 5.4: Major/Moderate)
    const baseConf = baseline.confidenceScore;
    const currConf = current.confidenceScore;

    if (currConf < baseConf - 15) {
        return {
            severity: 'major',
            message: `PERFORMANCE REGRESSION: Confidence dropped significantly (${baseConf}% -> ${currConf}%).`,
            timestamp: Date.now()
        };
    }

    if (currConf < baseConf) {
        return {
            severity: 'moderate',
            message: `Quality Warning: Confidence slightly reduced (${baseConf}% -> ${currConf}%).`,
            timestamp: Date.now()
        };
    }

    // 3. Validation Rules (Segment 5.2: Validation rules may never be removed)
    // We assume validation runs elsewhere, but we can check if critical metadata flags are missing
    if (baseline.meta?.hasTables && !current.meta?.hasTables) {
        return {
            severity: 'major',
            message: `CAPABILITY REGRESSION: Table detection failed in new version.`,
            timestamp: Date.now()
        };
    }

    return { severity: 'none', message: null, timestamp: Date.now() };
};

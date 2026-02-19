
import { logAuditEvent } from './auditLogger';

export type FailureType = 'TOOL' | 'VALIDATION' | 'CLASSIFICATION' | 'SECURITY' | 'COMPLIANCE' | 'SYSTEM';

export interface RecoveryAction {
    action: 'retry' | 'halt' | 'flag' | 'freeze';
    message: string;
}

export class AppError extends Error {
    public type: FailureType;
    public retryable: boolean;
    public context: string;

    constructor(message: string, type: FailureType, context: string, retryable: boolean = false) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.context = context;
        this.retryable = retryable;
    }
}

/**
 * Segment 7.1: Failure Classification
 */
export const classifyError = (error: any, context: string = 'system'): AppError => {
    if (error instanceof AppError) return error;

    const msg = error?.message || 'Unknown error';
    
    // Security Alerts (Prompt Injection / Safety Filters)
    if (msg.includes('SAFETY') || msg.includes('BLOCKED') || msg.includes('harmful')) {
        return new AppError(msg, 'SECURITY', context, false);
    }

    // Tool Failures (Network, API 500s)
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('503') || msg.includes('500') || msg.includes('timeout')) {
        return new AppError(msg, 'TOOL', context, true);
    }

    // Compliance Risks (PII Detection - simplified check)
    if (msg.includes('PII') || msg.includes('compliance')) {
        return new AppError(msg, 'COMPLIANCE', context, false);
    }

    // Critical System Errors
    if (msg.includes('quota') || msg.includes('API key')) {
        return new AppError(msg, 'SYSTEM', context, false);
    }

    // Default to Tool error for generic processing issues, usually retryable
    return new AppError(msg, 'TOOL', context, true);
};

/**
 * Segment 7.2: Recovery Rules & Response Execution
 */
export const handleFailure = async (error: AppError, attempt: number): Promise<RecoveryAction> => {
    // Log failure immediately (No silent suppression)
    logAuditEvent('REJECT', 'system', {
        failureType: error.type,
        message: error.message,
        context: error.context,
        attempt: attempt + 1
    });

    // 1. Critical Security/System Errors -> Immediate Freeze
    if (error.type === 'SECURITY' || error.type === 'SYSTEM') {
        return { 
            action: 'freeze', 
            message: `CRITICAL ${error.type} EVENT: Session Halted. ${error.message}` 
        };
    }

    // 2. Compliance Errors -> Halt Export/Process
    if (error.type === 'COMPLIANCE') {
        return {
            action: 'halt',
            message: `COMPLIANCE ALERT: Operation stopped. ${error.message}`
        };
    }

    // 3. Retry Logic (Max 2 autonomous retries)
    if (error.retryable && attempt < 2) {
        return {
            action: 'retry',
            message: `Retrying (${attempt + 1}/2)...`
        };
    }

    // 4. Fallback / Halt after retries exhausted
    return {
        action: 'halt',
        message: `Operation failed after ${attempt} attempts. Escalating to human review.`
    };
};

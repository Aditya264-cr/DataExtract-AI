
export type AuditEventType = 'UPLOAD' | 'EXTRACT' | 'VALIDATE' | 'EDIT' | 'APPROVE' | 'REJECT' | 'EXPORT';

export interface AuditEvent {
    eventType: AuditEventType;
    timestamp: string;
    actor: {
        type: 'user' | 'system';
        id: string;
        mode: string;
    };
    details: Record<string, any>;
}

export interface ApprovalStamp {
    approvedBy: string;
    approvedAt: string;
    mode: string;
    validationSummary: {
        errors: number;
        warnings: number;
    };
}

// In-memory log for the current session
let auditLog: AuditEvent[] = [];

export const logAuditEvent = (
    eventType: AuditEventType, 
    mode: string, 
    details: Record<string, any> = {}, 
    actorId: string = 'anonymous'
) => {
    const event: AuditEvent = {
        eventType,
        timestamp: new Date().toISOString(),
        actor: {
            type: actorId === 'system' ? 'system' : 'user',
            id: actorId,
            mode
        },
        details
    };
    auditLog.push(event);
    // console.log('[Audit Log]', event); // debug
    return event;
};

export const getAuditLog = () => [...auditLog];

export const clearAuditLog = () => { auditLog = []; };

export const generateApprovalStamp = (mode: string, errors: number, warnings: number, actorId: string = 'anonymous'): ApprovalStamp => ({
    approvedBy: actorId,
    approvedAt: new Date().toISOString(),
    mode,
    validationSummary: { errors, warnings }
});

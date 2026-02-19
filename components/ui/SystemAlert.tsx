
import React from 'react';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { LockClosedIcon } from '../icons/LockClosedIcon';

interface SystemAlertProps {
    type: 'SECURITY' | 'SYSTEM' | 'COMPLIANCE';
    message: string;
    logId?: string;
}

export const SystemAlert: React.FC<SystemAlertProps> = ({ type, message, logId }) => {
    const isSecurity = type === 'SECURITY';
    
    return (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-2xl bg-[#1C1C1E] border border-red-500/30 rounded-3xl p-10 shadow-2xl relative overflow-hidden text-center">
                {/* Background Pulse */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-red-500/10 blur-[100px] animate-pulse-slow"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        {isSecurity ? <LockClosedIcon className="w-10 h-10 text-red-500" /> : <ShieldCheckIcon className="w-10 h-10 text-red-500" />}
                    </div>
                    
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight font-display uppercase">
                        {isSecurity ? 'Security Lockdown' : 'Critical System Halt'}
                    </h1>
                    
                    <p className="text-gray-400 font-mono text-sm mb-8 uppercase tracking-widest">
                        Session Terminated • Token Revoked
                    </p>
                    
                    <div className="w-full bg-black/40 border border-white/5 rounded-xl p-6 mb-8 text-left">
                        <p className="text-red-400 font-bold text-xs mb-2 uppercase">Alert Details</p>
                        <p className="text-gray-200 text-sm leading-relaxed font-medium">{message}</p>
                        {logId && (
                            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                <span className="text-gray-500 text-xs">Forensic Log ID</span>
                                <span className="text-gray-300 text-xs font-mono bg-white/5 px-2 py-1 rounded">{logId}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="text-xs text-gray-500 max-w-sm leading-relaxed">
                        Please contact the Security Department for clearance. 
                        This event has been logged in the audit trail.
                    </div>
                </div>
            </div>
        </div>
    );
};

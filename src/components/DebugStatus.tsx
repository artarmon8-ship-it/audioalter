'use client';

import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function DebugStatus() {
    const [status, setStatus] = useState<{
        isolated: boolean;
        sab: boolean;
        support: string;
    }>({ isolated: false, sab: false, support: 'Checking...' });

    useEffect(() => {
        const isolated = typeof window !== 'undefined' && (window as any).crossOriginIsolated;
        const sab = typeof SharedArrayBuffer !== 'undefined';
        
        let support = 'Limited';
        if (isolated && sab) support = 'Full (High Performance)';
        else if (sab) support = 'Partial (No isolation)';
        else support = 'None (Audio processing may fail)';

        setStatus({ isolated, sab, support });
    }, []);

    // Only show in development or if a specific query param is present, 
    // but for now we'll show it subtly to help the user verify the fix.
    return (
        <div style={{
            marginTop: '3rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'rgba(26,29,36,0.4)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {status.isolated ? <ShieldCheck size={14} color="#10b981" /> : <ShieldAlert size={14} color="#f59e0b" />}
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Environment Status</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>Cross-Origin Isolated: <span style={{ color: status.isolated ? '#10b981' : '#f59e0b' }}>{status.isolated ? 'Yes' : 'No'}</span></div>
                <div>SharedArrayBuffer: <span style={{ color: status.sab ? '#10b981' : '#f59e0b' }}>{status.sab ? 'Available' : 'Unavailable'}</span></div>
            </div>
            <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                System: {status.support}
            </div>
            {!status.isolated && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#f59e0b' }}>
                    Note: If isolation is 'No', please ensure you are using a Chromium-based browser (Chrome, Edge) or that the site headers are correctly configured.
                </p>
            )}
        </div>
    );
}

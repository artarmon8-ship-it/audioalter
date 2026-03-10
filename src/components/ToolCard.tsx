'use client';

import React, { useState } from 'react';

interface ToolCardProps {
    title: string;
    desc: string;
    icon: string;
}

export default function ToolCard({ title, desc, icon }: ToolCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                border: `1px solid ${isHovered ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                transition: 'all var(--transition-fast)',
                height: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                cursor: 'pointer',
                transform: isHovered ? 'translateY(-2px)' : 'none',
                boxShadow: isHovered ? 'var(--shadow-glow)' : 'none'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={{ fontSize: '2rem', flexShrink: 0 }}>{icon}</div>
            <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {desc}
                </p>
            </div>
        </div>
    );
}

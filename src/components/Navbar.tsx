'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Settings2, Menu, X } from 'lucide-react';

const ALL_TOOLS = [
    { title: '3D Audio', path: '/3d-audio' },
    { title: 'Bass Booster', path: '/bass-booster' },
    { title: 'BPM Detector', path: '/bpm-detector' },
    { title: 'Converter', path: '/converter' },
    { title: 'Equalizer', path: '/equalizer' },
    { title: 'Noise Reducer', path: '/noise-reducer' },
    { title: 'Pitch Shifter', path: '/pitch-shifter' },
    { title: 'Reverb', path: '/reverb' },
    { title: 'Reverse Audio', path: '/reverse' },
    { title: 'Spectrogram', path: '/spectrogram' },
    { title: 'Stereo Panner', path: '/stereo-panner' },
    { title: 'Tempo Changer', path: '/tempo' },
    { title: 'Trimmer', path: '/trimmer' },
    { title: 'Volume Changer', path: '/volume' },
    { title: 'Waveform Image', path: '/waveform' },
];

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            <nav style={{
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'rgba(26,29,36,0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        <Settings2 size={26} color="var(--brand-primary)" />
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
                            AudioToolkit
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <Link href="/" style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem', textDecoration: 'none' }}>
                            All Tools
                        </Link>
                        <a href="https://adsense.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem', textDecoration: 'none' }}>
                            Advertise
                        </a>
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '0.5rem' }}
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Dropdown tool menu */}
            {mobileOpen && (
                <div style={{
                    position: 'fixed', top: '68px', left: 0, right: 0, bottom: 0,
                    backgroundColor: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-color)',
                    zIndex: 99, padding: '1.5rem', overflowY: 'auto'
                }}>
                    <div className="container">
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                            All Tools
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                            {ALL_TOOLS.map(tool => (
                                <Link
                                    key={tool.path}
                                    href={tool.path}
                                    onClick={() => setMobileOpen(false)}
                                    style={{
                                        display: 'block', padding: '0.6rem 0.9rem',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--text-secondary)',
                                        backgroundColor: 'var(--bg-base)',
                                        border: '1px solid var(--border-color)',
                                        fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none',
                                        transition: 'all 150ms ease'
                                    }}
                                >
                                    {tool.title}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

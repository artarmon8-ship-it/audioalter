'use client';

import React, { useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

interface BandConfig {
    label: string;
    freq: number;
    gain: number; // -12 to +12 dB
}

const DEFAULT_BANDS: BandConfig[] = [
    { label: '60Hz', freq: 60, gain: 0 },
    { label: '170Hz', freq: 170, gain: 0 },
    { label: '310Hz', freq: 310, gain: 0 },
    { label: '600Hz', freq: 600, gain: 0 },
    { label: '1kHz', freq: 1000, gain: 0 },
    { label: '3kHz', freq: 3000, gain: 0 },
    { label: '6kHz', freq: 6000, gain: 0 },
    { label: '12kHz', freq: 12000, gain: 0 },
    { label: '14kHz', freq: 14000, gain: 0 },
    { label: '16kHz', freq: 16000, gain: 0 },
];

const PRESETS: { label: string; gains: number[] }[] = [
    { label: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { label: 'Bass Boost', gains: [8, 6, 3, 0, 0, 0, 0, 0, 0, 0] },
    { label: 'Treble Boost', gains: [0, 0, 0, 0, 0, 3, 5, 6, 7, 8] },
    { label: 'Vocal Enhance', gains: [-2, 0, 2, 4, 5, 4, 2, 0, -1, -2] },
    { label: 'Rock', gains: [5, 3, 0, -1, 0, 2, 4, 5, 5, 4] },
    { label: 'Classical', gains: [4, 3, 2, 0, -1, 0, 2, 3, 4, 4] },
];

export default function EqualizerPage() {
    const [bands, setBands] = useState<BandConfig[]>(DEFAULT_BANDS);

    const applyPreset = (gains: number[]) => {
        setBands(prev => prev.map((band, i) => ({ ...band, gain: gains[i] })));
    };

    const updateBand = (index: number, gain: number) => {
        setBands(prev => prev.map((band, i) => i === index ? { ...band, gain } : band));
    };

    const processAudio = async (
        file: File,
        setIsProcessing: (b: boolean) => void,
        setResult: (url: string, name: string) => void
    ) => {
        setIsProcessing(true);
        try {
            // Use Web Audio API for real-time multi-band EQ rendering
            const arrayBuffer = await file.arrayBuffer();
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

            const offlineCtx = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );

            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;

            // Chain EQ filters
            let lastNode: AudioNode = source;
            bands.forEach(band => {
                const filter = offlineCtx.createBiquadFilter();
                filter.type = 'peaking';
                filter.frequency.value = band.freq;
                filter.gain.value = band.gain;
                filter.Q.value = 1.4;
                lastNode.connect(filter);
                lastNode = filter;
            });
            lastNode.connect(offlineCtx.destination);

            source.start();
            const rendered = await offlineCtx.startRendering();
            const blob = audioBufferToWav(rendered);
            const url = URL.createObjectURL(blob);
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            setResult(url, `eq_${baseName}.wav`);
        } catch (err) {
            console.error(err);
            alert('Equalizer processing failed. See console.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout title="Equalizer" description="Adjust up to 10 frequency bands to shape the sound of your audio file.">
            {({ file, isProcessing, setIsProcessing, setProcessedResult }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Presets */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem' }}>Presets</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {PRESETS.map(p => (
                                <button
                                    key={p.label}
                                    onClick={() => applyPreset(p.gains)}
                                    style={{
                                        padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-surface-hover)',
                                        color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600,
                                        cursor: 'pointer', transition: 'all 150ms ease',
                                    }}
                                    onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--brand-primary)'; (e.target as HTMLElement).style.color = 'var(--text-primary)'; }}
                                    onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border-color)'; (e.target as HTMLElement).style.color = 'var(--text-secondary)'; }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Graphical EQ */}
                    <div style={{
                        display: 'flex', alignItems: 'flex-end', gap: '0.5rem',
                        backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-md)',
                        padding: '1.5rem 1rem', borderBottom: '1px solid var(--border-color)',
                        height: '220px'
                    }}>
                        {bands.map((band, i) => (
                            <div key={band.freq} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                                    {band.gain > 0 ? `+${band.gain}` : band.gain}dB
                                </span>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                    <input
                                        type="range"
                                        min="-12" max="12" step="1"
                                        value={band.gain}
                                        onChange={e => updateBand(i, parseInt(e.target.value))}
                                        disabled={isProcessing}
                                        style={{
                                            writingMode: 'vertical-lr' as any,
                                            direction: 'rtl',
                                            height: '120px',
                                            accentColor: 'var(--brand-primary)',
                                            cursor: isProcessing ? 'not-allowed' : 'pointer'
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>{band.label}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => file && processAudio(file, setIsProcessing, setProcessedResult)}
                        disabled={isProcessing || !file}
                        style={{
                            backgroundColor: isProcessing ? 'var(--bg-surface-hover)' : 'var(--brand-primary)',
                            color: isProcessing ? 'var(--text-muted)' : 'white',
                            padding: '1rem', borderRadius: 'var(--radius-md)',
                            fontWeight: 600, fontSize: '1rem', border: 'none',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            transition: 'background-color var(--transition-fast)'
                        }}
                    >
                        {isProcessing ? 'Applying EQ...' : 'Apply Equalizer'}
                    </button>
                </div>
            )}
        </ToolLayout>
    );
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [];
    let i, sample, offset = 0, pos = 0;
    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
    setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(buffer.sampleRate); setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(length - pos - 4);
    for (i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));
    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true); pos += 2;
        }
        offset++;
    }
    return new Blob([bufferArray], { type: 'audio/wav' });
    function setUint16(data: number) { view.setUint16(pos, data, true); pos += 2; }
    function setUint32(data: number) { view.setUint32(pos, data, true); pos += 4; }
}

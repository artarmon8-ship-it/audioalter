'use client';

import React, { useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

export default function BassBoosterPage() {
    const [bassGain, setBassGain] = useState(6); // dB
    const [midGain, setMidGain] = useState(0);

    const processAudio = async (
        file: File,
        setIsProcessing: (b: boolean) => void,
        setResult: (url: string, name: string) => void
    ) => {
        setIsProcessing(true);
        try {
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

            // Bass boost: low shelf filter at 200Hz
            const bassFilter = offlineCtx.createBiquadFilter();
            bassFilter.type = 'lowshelf';
            bassFilter.frequency.value = 200;
            bassFilter.gain.value = bassGain;

            // Mid presence (peaking filter at 2kHz)
            const midFilter = offlineCtx.createBiquadFilter();
            midFilter.type = 'peaking';
            midFilter.frequency.value = 2000;
            midFilter.gain.value = midGain;
            midFilter.Q.value = 1.5;

            source.connect(bassFilter);
            bassFilter.connect(midFilter);
            midFilter.connect(offlineCtx.destination);
            source.start();

            const rendered = await offlineCtx.startRendering();
            const blob = audioBufferToWav(rendered);
            const url = URL.createObjectURL(blob);
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            setResult(url, `bass_boosted_${baseName}.wav`);
        } catch (err) {
            console.error(err);
            alert('Bass boost failed. See console.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout title="Bass Booster" description="Boost the low-end and bass frequencies of your audio file.">
            {({ file, isProcessing, setIsProcessing, setProcessedResult }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <label style={{ fontWeight: 600 }}>Bass Boost (Low Shelf)</label>
                            <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>+{bassGain}dB</span>
                        </div>
                        <input type="range" min="0" max="20" step="1" value={bassGain}
                            onChange={e => setBassGain(parseInt(e.target.value))}
                            disabled={isProcessing}
                            style={{ width: '100%', accentColor: 'var(--brand-primary)', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            <span>0dB (Off)</span><span>+20dB (Max)</span>
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <label style={{ fontWeight: 600 }}>Mid Presence (2kHz)</label>
                            <span style={{ color: 'var(--brand-secondary)', fontWeight: 700 }}>{midGain > 0 ? `+${midGain}` : midGain}dB</span>
                        </div>
                        <input type="range" min="-6" max="6" step="1" value={midGain}
                            onChange={e => setMidGain(parseInt(e.target.value))}
                            disabled={isProcessing}
                            style={{ width: '100%', accentColor: 'var(--brand-secondary)', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            <span>-6dB</span><span>0dB</span><span>+6dB</span>
                        </div>
                    </div>

                    {/* Preset cards */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Quick Presets
                        </label>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {[{ l: 'Light', b: 3, m: 0 }, { l: 'Normal', b: 6, m: 0 }, { l: 'Heavy', b: 12, m: -2 }, { l: 'Club', b: 10, m: 2 }].map(p => (
                                <button key={p.l}
                                    onClick={() => { setBassGain(p.b); setMidGain(p.m); }}
                                    style={{
                                        padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-hover)',
                                        color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                                    }}
                                >
                                    {p.l}
                                </button>
                            ))}
                        </div>
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
                        {isProcessing ? 'Boosting Bass...' : 'Apply Bass Boost'}
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
    const channels: Float32Array[] = [];
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

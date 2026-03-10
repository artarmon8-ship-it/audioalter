'use client';

import React, { useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

export default function StereoPannerPage() {
    const [pan, setPan] = useState(0); // -1 = full left, 0 = center, 1 = full right

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

            const offlineCtx = new OfflineAudioContext(2, audioBuffer.length, audioBuffer.sampleRate);
            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;

            const pannerNode = offlineCtx.createStereoPanner();
            pannerNode.pan.value = pan;

            source.connect(pannerNode);
            pannerNode.connect(offlineCtx.destination);
            source.start();

            const rendered = await offlineCtx.startRendering();
            const blob = audioBufferToWav(rendered);
            const url = URL.createObjectURL(blob);
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const panLabel = pan === 0 ? 'center' : pan > 0 ? `R${Math.round(pan * 100)}` : `L${Math.round(Math.abs(pan) * 100)}`;
            setResult(url, `panned_${panLabel}_${baseName}.wav`);
        } catch (err) {
            console.error(err);
            alert('Stereo panning failed. See console.');
        } finally {
            setIsProcessing(false);
        }
    };

    const getPanLabel = () => {
        if (pan === 0) return 'Center';
        if (pan < 0) return `${Math.round(Math.abs(pan) * 100)}% Left`;
        return `${Math.round(pan * 100)}% Right`;
    };

    return (
        <ToolLayout title="L/R Stereo Panner" description="Pan the audio to the left or right stereo channel.">
            {({ file, isProcessing, setIsProcessing, setProcessedResult }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <label style={{ fontWeight: 600 }}>Pan Position</label>
                            <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{getPanLabel()}</span>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="range" min="-1" max="1" step="0.05"
                                value={pan}
                                onChange={e => setPan(parseFloat(e.target.value))}
                                disabled={isProcessing}
                                style={{ width: '100%', accentColor: 'var(--brand-primary)', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            <span>◀ Full Left</span><span>Center</span><span>Full Right ▶</span>
                        </div>
                    </div>

                    {/* Visual pan indicator */}
                    <div style={{
                        display: 'flex', justifyContent: 'center', gap: '4px',
                        padding: '1rem', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-md)'
                    }}>
                        {Array.from({ length: 21 }, (_, i) => {
                            const pos = (i - 10) / 10;
                            const active = Math.abs(pos - pan) < 0.1;
                            const isCenter = i === 10;
                            return (
                                <div key={i} style={{
                                    width: '8px', height: isCenter ? '40px' : '30px',
                                    borderRadius: '4px',
                                    backgroundColor: active
                                        ? 'var(--brand-primary)'
                                        : isCenter ? 'rgba(255,255,255,0.3)' : 'var(--border-color)',
                                    transition: 'background-color 150ms ease'
                                }} />
                            );
                        })}
                    </div>

                    {/* Quick buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {[{ l: '← Full Left', v: -1 }, { l: 'Center', v: 0 }, { l: 'Full Right →', v: 1 }].map(o => (
                            <button key={o.l} onClick={() => setPan(o.v)} style={{
                                flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-hover)',
                                color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer'
                            }}>{o.l}</button>
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
                        }}
                    >
                        {isProcessing ? 'Panning Audio...' : 'Apply Pan'}
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

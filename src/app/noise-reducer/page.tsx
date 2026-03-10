'use client';

import React, { useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

export default function NoisReducerPage() {
    const [noiseFloor, setNoiseFloor] = useState(0.02);

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

            // Simple spectral gate / noise gate:
            // Amplitude below the noise threshold gets zeroed out.
            // A more advanced approach would use spectral subtraction via FFT.
            const offlineCtx = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );

            const cleanBuffer = offlineCtx.createBuffer(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );

            const attackSamples = Math.floor(offlineCtx.sampleRate * 0.005); // 5ms attack
            const releaseSamples = Math.floor(offlineCtx.sampleRate * 0.05); // 50ms release

            for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                const src = audioBuffer.getChannelData(ch);
                const dst = cleanBuffer.getChannelData(ch);
                let gate = 0;
                for (let i = 0; i < src.length; i++) {
                    const level = Math.abs(src[i]);
                    if (level > noiseFloor) {
                        gate = Math.min(1, gate + 1 / attackSamples);
                    } else {
                        gate = Math.max(0, gate - 1 / releaseSamples);
                    }
                    dst[i] = src[i] * gate;
                }
            }

            const source = offlineCtx.createBufferSource();
            source.buffer = cleanBuffer;
            source.connect(offlineCtx.destination);
            source.start();

            const rendered = await offlineCtx.startRendering();
            const blob = audioBufferToWav(rendered);
            const url = URL.createObjectURL(blob);
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            setResult(url, `noise_reduced_${baseName}.wav`);
        } catch (err) {
            console.error(err);
            alert('Noise reduction failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout title="Noise Reducer" description="Reduce background noise and hiss from audio recordings using a noise gate.">
            {({ file, isProcessing, setIsProcessing, setProcessedResult }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(251,191,36,0.2)' }}>
                        <p style={{ color: '#fbbf24', fontSize: '0.85rem', margin: 0 }}>
                            ℹ️ This tool uses a noise gate algorithm. It works best on recordings with consistent background noise (fans, hiss, hum). For music, keep the threshold low to avoid artifacts.
                        </p>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <label style={{ fontWeight: 600 }}>Noise Threshold</label>
                            <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{(noiseFloor * 100).toFixed(0)}%</span>
                        </div>
                        <input type="range" min="0.005" max="0.15" step="0.005" value={noiseFloor}
                            onChange={e => setNoiseFloor(parseFloat(e.target.value))}
                            disabled={isProcessing}
                            style={{ width: '100%', accentColor: 'var(--brand-primary)', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            <span>Subtle (0.5%)</span><span>Aggressive (15%)</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {[{ l: 'Light', v: 0.01 }, { l: 'Medium', v: 0.03 }, { l: 'Strong', v: 0.07 }].map(p => (
                            <button key={p.l} onClick={() => setNoiseFloor(p.v)} style={{
                                flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                                border: Math.abs(noiseFloor - p.v) < 0.005 ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)',
                                backgroundColor: Math.abs(noiseFloor - p.v) < 0.005 ? 'rgba(139,92,246,0.1)' : 'var(--bg-surface-hover)',
                                color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer'
                            }}>{p.l}</button>
                        ))}
                    </div>

                    <button onClick={() => file && processAudio(file, setIsProcessing, setProcessedResult)}
                        disabled={isProcessing || !file}
                        style={{
                            backgroundColor: isProcessing ? 'var(--bg-surface-hover)' : 'var(--brand-primary)',
                            color: isProcessing ? 'var(--text-muted)' : 'white',
                            padding: '1rem', borderRadius: 'var(--radius-md)',
                            fontWeight: 600, fontSize: '1rem', border: 'none',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isProcessing ? 'Reducing Noise...' : 'Reduce Noise'}
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

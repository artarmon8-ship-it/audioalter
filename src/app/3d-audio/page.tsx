'use client';

import React, { useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

export default function ThreeDAudioPage() {
    const [width, setWidth] = useState(0.5);
    const [haas, setHaas] = useState(20); // milliseconds delay for haas effect

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

            const delaySamples = Math.floor((haas / 1000) * audioBuffer.sampleRate);
            const totalSamples = audioBuffer.length + delaySamples;

            const offlineCtx = new OfflineAudioContext(2, totalSamples, audioBuffer.sampleRate);

            // Create stereo output: use a haas effect + widening
            const outputBuffer = offlineCtx.createBuffer(2, totalSamples, audioBuffer.sampleRate);

            // Get mono mix first
            const mono = new Float32Array(audioBuffer.length);
            for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                const d = audioBuffer.getChannelData(ch);
                for (let i = 0; i < d.length; i++) mono[i] += d[i] / audioBuffer.numberOfChannels;
            }

            // Left channel: slightly boosted mono, center
            const left = outputBuffer.getChannelData(0);
            const right = outputBuffer.getChannelData(1);
            for (let i = 0; i < mono.length; i++) {
                // Mid-side encoding for widening
                // Mid = (L+R)/2, Side = (L-R)/2
                // Width controls Side gain
                left[i] = mono[i];                   // Direct
                right[i + delaySamples] = mono[i] * (1 - width * 0.4); // Delayed + slightly attenuated
            }

            const source = offlineCtx.createBufferSource();
            source.buffer = outputBuffer;
            source.connect(offlineCtx.destination);
            source.start();

            const rendered = await offlineCtx.startRendering();
            const blob = audioBufferToWav(rendered);
            const url = URL.createObjectURL(blob);
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            setResult(url, `3d_audio_${baseName}.wav`);
        } catch (err) {
            console.error(err);
            alert('3D audio processing failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout title="3D Audio" description="Enhance the stereo sound by adding a 3D spatial effect using Haas effect and stereo widening.">
            {({ file, isProcessing, setIsProcessing, setProcessedResult }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <label style={{ fontWeight: 600 }}>Stereo Width</label>
                            <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{Math.round(width * 100)}%</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.05" value={width}
                            onChange={e => setWidth(parseFloat(e.target.value))}
                            disabled={isProcessing}
                            style={{ width: '100%', accentColor: 'var(--brand-primary)', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                        />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <label style={{ fontWeight: 600 }}>Haas Delay (depth)</label>
                            <span style={{ color: 'var(--brand-secondary)', fontWeight: 700 }}>{haas}ms</span>
                        </div>
                        <input type="range" min="5" max="40" step="1" value={haas}
                            onChange={e => setHaas(parseInt(e.target.value))}
                            disabled={isProcessing}
                            style={{ width: '100%', accentColor: 'var(--brand-secondary)', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            <span>Subtle (5ms)</span><span>Deep (40ms)</span>
                        </div>
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
                        {isProcessing ? 'Applying 3D Effect...' : 'Apply 3D Audio'}
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

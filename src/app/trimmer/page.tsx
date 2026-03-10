'use client';

import React, { useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

export default function TrimmerPage() {
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [duration, setDuration] = useState<number | null>(null);

    const handleFileUpload = (
        file: File,
        setIsProcessing: (b: boolean) => void,
        setResult: (url: string, name: string) => void
    ) => {
        // Get audio duration to set up the trimmer controls
        const tempUrl = URL.createObjectURL(file);
        const audio = new Audio(tempUrl);
        audio.onloadedmetadata = () => {
            setDuration(Math.floor(audio.duration));
            setEndTime(Math.floor(audio.duration));
            URL.revokeObjectURL(tempUrl);
        };
    };

    const processAudio = async (
        file: File,
        setIsProcessing: (b: boolean) => void,
        setResult: (url: string, name: string) => void
    ) => {
        if (endTime === null) return;
        setIsProcessing(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

            const sampleRate = audioBuffer.sampleRate;
            const startSample = Math.floor(startTime * sampleRate);
            const endSample = Math.floor(endTime * sampleRate);
            const numSamples = endSample - startSample;

            const offlineCtx = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                numSamples,
                sampleRate
            );

            const trimmedBuffer = offlineCtx.createBuffer(audioBuffer.numberOfChannels, numSamples, sampleRate);
            for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                const src = audioBuffer.getChannelData(ch);
                const dst = trimmedBuffer.getChannelData(ch);
                for (let i = 0; i < numSamples; i++) {
                    dst[i] = src[startSample + i];
                }
            }

            const source = offlineCtx.createBufferSource();
            source.buffer = trimmedBuffer;
            source.connect(offlineCtx.destination);
            source.start();

            const rendered = await offlineCtx.startRendering();
            const blob = audioBufferToWav(rendered);
            const url = URL.createObjectURL(blob);
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            setResult(url, `trimmed_${baseName}.wav`);
        } catch (err) {
            console.error(err);
            alert('Trimming failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    return (
        <ToolLayout title="Trimmer / Cutter" description="Trim or cut out a portion of your audio file.">
            {({ file, isProcessing, setIsProcessing, setProcessedResult }) => {
                // On file load, get duration
                if (file && duration === null) {
                    handleFileUpload(file, setIsProcessing, setProcessedResult);
                }
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {duration !== null && (
                            <>
                                <div style={{ display: 'flex', gap: '2rem', backgroundColor: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                                            Start: <span style={{ color: 'var(--brand-primary)' }}>{formatTime(startTime)}</span>
                                        </label>
                                        <input type="range" min="0" max={endTime !== null ? endTime - 1 : duration} step="1"
                                            value={startTime}
                                            onChange={e => setStartTime(parseInt(e.target.value))}
                                            style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                                            End: <span style={{ color: 'var(--brand-secondary)' }}>{formatTime(endTime ?? duration)}</span>
                                        </label>
                                        <input type="range" min={startTime + 1} max={duration} step="1"
                                            value={endTime ?? duration}
                                            onChange={e => setEndTime(parseInt(e.target.value))}
                                            style={{ width: '100%', accentColor: 'var(--brand-secondary)' }}
                                        />
                                    </div>
                                </div>

                                {/* Visual timeline */}
                                <div style={{ position: 'relative', height: '40px', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                    {/* Full bar */}
                                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--border-color)' }} />
                                    {/* Selected region */}
                                    <div style={{
                                        position: 'absolute', top: 0, bottom: 0,
                                        left: `${(startTime / duration) * 100}%`,
                                        width: `${(((endTime ?? duration) - startTime) / duration) * 100}%`,
                                        background: 'linear-gradient(to right, var(--brand-primary), var(--brand-secondary))',
                                        opacity: 0.7
                                    }} />
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                                        {formatTime(startTime)} → {formatTime(endTime ?? duration)} ({formatTime((endTime ?? duration) - startTime)} selected)
                                    </div>
                                </div>
                            </>
                        )}

                        <button onClick={() => file && processAudio(file, setIsProcessing, setProcessedResult)}
                            disabled={isProcessing || !file || duration === null}
                            style={{
                                backgroundColor: isProcessing ? 'var(--bg-surface-hover)' : 'var(--brand-primary)',
                                color: isProcessing ? 'var(--text-muted)' : 'white',
                                padding: '1rem', borderRadius: 'var(--radius-md)',
                                fontWeight: 600, fontSize: '1rem', border: 'none',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {isProcessing ? 'Trimming...' : 'Trim Audio'}
                        </button>
                    </div>
                );
            }}
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

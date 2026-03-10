'use client';

import React, { useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

export default function TempoChangerPage() {
    const [speed, setSpeed] = useState(1); // 1 = 1x (normal speed)

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

            // Calculate the new length based on the playback speed
            const newLength = Math.floor(audioBuffer.length / speed);

            const offlineCtx = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                newLength,
                audioBuffer.sampleRate
            );

            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = speed;

            source.connect(offlineCtx.destination);
            source.start();

            const renderedBuffer = await offlineCtx.startRendering();
            const wavBlob = audioBufferToWav(renderedBuffer);
            const url = URL.createObjectURL(wavBlob);

            setResult(url, `tempo_${speed}x_${file.name.replace(/\.[^/.]+$/, "")}.wav`);
        } catch (err) {
            console.error("Error processing audio:", err);
            alert("Failed to process tempo change. See console for details.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Tempo Changer"
            description="Make an audio file play faster or slower without changing its pitch (using basic Web Audio playback rate). Note: Simple playback rate alters pitch slightly. For high-quality pitch-preserving time stretching, more advanced algorithms are needed."
        >
            {({ file, isProcessing, setIsProcessing, setProcessedResult }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <label style={{ fontWeight: 600 }}>Adjust Playback Speed</label>
                            <span style={{ fontWeight: 'bold', color: 'var(--brand-primary)' }}>{speed.toFixed(2)}x</span>
                        </div>

                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.05"
                            value={speed}
                            onChange={(e) => setSpeed(parseFloat(e.target.value))}
                            disabled={isProcessing}
                            style={{
                                width: '100%',
                                accentColor: 'var(--brand-primary)',
                                cursor: isProcessing ? 'not-allowed' : 'pointer'
                            }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            <span>0.5x (Slower)</span>
                            <span>1.0x (Normal)</span>
                            <span>2.0x (Faster)</span>
                        </div>
                    </div>

                    <button
                        onClick={() => file && processAudio(file, setIsProcessing, setProcessedResult)}
                        disabled={isProcessing || !file}
                        style={{
                            width: '100%',
                            backgroundColor: isProcessing ? 'var(--bg-surface-hover)' : 'var(--brand-primary)',
                            color: isProcessing ? 'var(--text-muted)' : 'white',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '1rem',
                            border: 'none',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            marginTop: '1rem',
                            transition: 'background-color var(--transition-fast)'
                        }}
                    >
                        {isProcessing ? 'Applying Tempo Change...' : 'Apply Tempo Change'}
                    </button>
                </div>
            )}
        </ToolLayout>
    );
}

// Utility function to convert AudioBuffer to WAV Blob
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
    return new Blob([bufferArray], { type: "audio/wav" });

    function setUint16(data: number) { view.setUint16(pos, data, true); pos += 2; }
    function setUint32(data: number) { view.setUint32(pos, data, true); pos += 4; }
}

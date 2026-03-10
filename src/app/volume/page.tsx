'use client';

import React, { useState, useRef } from 'react';
import ToolLayout from '@/components/ToolLayout';

export default function VolumeChangerPage() {
    const [gain, setGain] = useState(1); // 1 = 100%

    const processAudio = async (
        file: File,
        setIsProcessing: (b: boolean) => void,
        setResult: (url: string, name: string) => void
    ) => {
        setIsProcessing(true);

        try {
            // 1. Read file into ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // 2. Decode audio data
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

            // 3. Create OfflineAudioContext to render the effect
            const offlineCtx = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );

            // 4. Set up the audio graph
            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;

            const gainNode = offlineCtx.createGain();
            gainNode.gain.value = gain;

            source.connect(gainNode);
            gainNode.connect(offlineCtx.destination);

            // 5. Start processing
            source.start();
            const renderedBuffer = await offlineCtx.startRendering();

            // 6. Convert rendered buffer to WAV (Utility function needed, let's inline a simple one for now)
            const wavBlob = audioBufferToWav(renderedBuffer);
            const url = URL.createObjectURL(wavBlob);

            setResult(url, `volume_changed_${file.name.replace(/\.[^/.]+$/, "")}.wav`);
        } catch (err) {
            console.error("Error processing audio:", err);
            alert("Failed to process audio. See console for details.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Volume Changer"
            description="Make your audio louder or quieter directly in your browser without uploading to any server."
        >
            {({ file, isProcessing, setIsProcessing, setProcessedResult }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}>
                            Adjust Volume: {Math.round(gain * 100)}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="3"
                            step="0.1"
                            value={gain}
                            onChange={(e) => setGain(parseFloat(e.target.value))}
                            disabled={isProcessing}
                            style={{
                                width: '100%',
                                accentColor: 'var(--brand-primary)',
                                cursor: isProcessing ? 'not-allowed' : 'pointer'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            <span>0% (Mute)</span>
                            <span>100% (Normal)</span>
                            <span>300% (Boost)</span>
                        </div>
                    </div>

                    <button
                        onClick={() => file && processAudio(file, setIsProcessing, setProcessedResult)}
                        disabled={isProcessing || !file}
                        style={{
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
                        {isProcessing ? 'Applying Effect...' : 'Apply Volume Change'}
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
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit (hardcoded in this setup)

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // write interleaved data
    for (i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(pos, sample, true); // write 16-bit sample
            pos += 2;
        }
        offset++; // next source sample
    }

    return new Blob([bufferArray], { type: "audio/wav" });

    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

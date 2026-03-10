'use client';

import React from 'react';
import ToolLayout from '@/components/ToolLayout';

export default function ReverseAudioPage() {

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

            // Create an empty buffer for the reversed audio
            const reversedBuffer = offlineCtx.createBuffer(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );

            // Reverse the data in each channel
            for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
                const channelData = audioBuffer.getChannelData(i);
                const reversedData = reversedBuffer.getChannelData(i);
                for (let j = 0; j < audioBuffer.length; j++) {
                    reversedData[j] = channelData[audioBuffer.length - 1 - j];
                }
            }

            const source = offlineCtx.createBufferSource();
            source.buffer = reversedBuffer;
            source.connect(offlineCtx.destination);
            source.start();

            const renderedBuffer = await offlineCtx.startRendering();
            const wavBlob = audioBufferToWav(renderedBuffer);
            const url = URL.createObjectURL(wavBlob);

            setResult(url, `reversed_${file.name.replace(/\.[^/.]+$/, "")}.wav`);
        } catch (err) {
            console.error("Error processing audio:", err);
            alert("Failed to reverse audio. See console for details.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Reverse Audio"
            description="Reverse an audio file and make it play backwards. Supports MP3, WAV, OGG, and more."
        >
            {({ file, isProcessing, setIsProcessing, setProcessedResult }) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Ready to reverse! Click the button below to process the audio entirely in your browser.
                    </p>
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
                            transition: 'background-color var(--transition-fast)'
                        }}
                    >
                        {isProcessing ? 'Reversing Audio...' : 'Reverse Audio'}
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

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([bufferArray], { type: "audio/wav" });

    function setUint16(data: number) { view.setUint16(pos, data, true); pos += 2; }
    function setUint32(data: number) { view.setUint32(pos, data, true); pos += 4; }
}

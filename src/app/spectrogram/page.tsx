'use client';

import React, { useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

export default function SpectrogramPage() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

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

            const fftSize = 2048;
            const hopSize = 512;
            const data = audioBuffer.getChannelData(0);
            const numFrames = Math.floor((data.length - fftSize) / hopSize);

            const canvas = document.createElement('canvas');
            canvas.width = Math.min(numFrames, 1200);
            canvas.height = fftSize / 2;
            const ctx = canvas.getContext('2d')!;

            // Black background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const imageData = ctx.createImageData(canvas.width, canvas.height);

            // Hann window function
            const window_ = new Float32Array(fftSize);
            for (let i = 0; i < fftSize; i++) {
                window_[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (fftSize - 1));
            }

            const step = Math.max(1, Math.floor(numFrames / canvas.width));

            for (let col = 0; col < canvas.width; col++) {
                const frameIdx = col * step;
                const startSample = frameIdx * hopSize;

                // Extract windowed frame
                const frame = new Float32Array(fftSize);
                for (let i = 0; i < fftSize; i++) {
                    frame[i] = (data[startSample + i] || 0) * window_[i];
                }

                // Simple DFT magnitude (using AnalyserNode workaround via offline context)
                // We'll use a rough approximation
                const magnitudes = computeFFTMagnitude(frame, fftSize);
                const numBins = fftSize / 2;

                for (let row = 0; row < numBins; row++) {
                    const y = numBins - 1 - row; // flip so low freq at bottom
                    const mag = Math.min(1, magnitudes[row] * 4);
                    const pixelOffset = (y * canvas.width + col) * 4;

                    // Heatmap: black -> purple -> blue -> cyan -> green -> yellow -> red
                    const [r, g, b] = spectrogramColor(mag);
                    imageData.data[pixelOffset] = r;
                    imageData.data[pixelOffset + 1] = g;
                    imageData.data[pixelOffset + 2] = b;
                    imageData.data[pixelOffset + 3] = 255;
                }
            }

            ctx.putImageData(imageData, 0, 0);

            canvas.toBlob(blob => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                setImageUrl(url);
                setResult(url, `spectrogram_${file.name.replace(/\.[^/.]+$/, '')}.png`);
            }, 'image/png');
        } catch (err) {
            console.error(err);
            alert('Spectrogram generation failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout title="Spectrogram Image" description="Create a frequency vs time spectrogram visualization of your audio.">
            {({ file, isProcessing, setIsProcessing, setProcessedResult }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                        Generates a color-coded spectrogram image showing frequency content over time. Note: Large files may take a moment.
                    </p>
                    {imageUrl && (
                        <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <img src={imageUrl} alt="spectrogram" style={{ width: '100%', display: 'block' }} />
                        </div>
                    )}
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
                        {isProcessing ? 'Generating Spectrogram...' : 'Generate Spectrogram'}
                    </button>
                </div>
            )}
        </ToolLayout>
    );
}

function computeFFTMagnitude(frame: Float32Array, fftSize: number): Float32Array {
    const magnitudes = new Float32Array(fftSize / 2);
    for (let k = 0; k < fftSize / 2; k++) {
        let real = 0, imag = 0;
        for (let n = 0; n < fftSize; n++) {
            const angle = (2 * Math.PI * k * n) / fftSize;
            real += frame[n] * Math.cos(angle);
            imag -= frame[n] * Math.sin(angle);
        }
        magnitudes[k] = Math.sqrt(real * real + imag * imag) / fftSize;
    }
    return magnitudes;
}

function spectrogramColor(magnitude: number): [number, number, number] {
    // Viridis-inspired colormap: black -> purple -> blue -> green -> yellow -> white
    const m = Math.pow(magnitude, 0.5);
    if (m < 0.25) {
        const t = m / 0.25;
        return [Math.round(68 * t), 0, Math.round(84 + 60 * t)];
    } else if (m < 0.5) {
        const t = (m - 0.25) / 0.25;
        return [Math.round(68 - 20 * t), Math.round(90 * t), Math.round(144 + 20 * t)];
    } else if (m < 0.75) {
        const t = (m - 0.5) / 0.25;
        return [Math.round(48 + 160 * t), Math.round(90 + 130 * t), Math.round(164 - 140 * t)];
    } else {
        const t = (m - 0.75) / 0.25;
        return [Math.round(208 + 47 * t), Math.round(220 + 35 * t), Math.round(24 + 231 * t)];
    }
}

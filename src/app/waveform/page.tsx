'use client';

import React, { useRef, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

export default function WaveformPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
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

            const canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 400;
            const ctx = canvas.getContext('2d')!;

            // Background gradient
            const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGrad.addColorStop(0, '#0f1115');
            bgGrad.addColorStop(1, '#1a1d24');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw waveform for each channel
            const colors = ['#8b5cf6', '#ec4899'];
            const channelCount = Math.min(audioBuffer.numberOfChannels, 2);
            const sectionHeight = canvas.height / channelCount;

            for (let c = 0; c < channelCount; c++) {
                const data = audioBuffer.getChannelData(c);
                const step = Math.ceil(data.length / canvas.width);
                const midY = sectionHeight * c + sectionHeight / 2;

                const waveGrad = ctx.createLinearGradient(0, midY - sectionHeight / 2, 0, midY + sectionHeight / 2);
                waveGrad.addColorStop(0, colors[c] + '55');
                waveGrad.addColorStop(0.5, colors[c]);
                waveGrad.addColorStop(1, colors[c] + '55');

                ctx.beginPath();
                ctx.moveTo(0, midY);
                for (let i = 0; i < canvas.width; i++) {
                    let min = 1, max = -1;
                    for (let j = 0; j < step; j++) {
                        const datum = data[i * step + j] || 0;
                        if (datum < min) min = datum;
                        if (datum > max) max = datum;
                    }
                    ctx.lineTo(i, midY + max * (sectionHeight / 2 - 10));
                }
                for (let i = canvas.width - 1; i >= 0; i--) {
                    let min = 1;
                    for (let j = 0; j < step; j++) {
                        const datum = data[i * step + j] || 0;
                        if (datum < min) min = datum;
                    }
                    ctx.lineTo(i, midY + min * (sectionHeight / 2 - 10));
                }
                ctx.closePath();
                ctx.fillStyle = waveGrad;
                ctx.fill();
                ctx.strokeStyle = colors[c];
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // Time ruler at top
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(0, 0, canvas.width, 24);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px Inter, sans-serif';
            const duration = audioBuffer.duration;
            for (let t = 0; t <= duration; t += Math.max(1, Math.ceil(duration / 10))) {
                const x = (t / duration) * canvas.width;
                ctx.fillText(`${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`, x + 4, 16);
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.beginPath(); ctx.moveTo(x, 24); ctx.lineTo(x, canvas.height); ctx.stroke();
            }

            canvas.toBlob(blob => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                setImageUrl(url);
                setResult(url, `waveform_${file.name.replace(/\.[^/.]+$/, '')}.png`);
            }, 'image/png');
        } catch (err) {
            console.error(err);
            alert('Waveform generation failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout title="Waveform Image" description="Generate a beautiful waveform image from your audio file.">
            {({ file, isProcessing, setIsProcessing, setProcessedResult }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                        Upload an audio file to generate a high-resolution waveform image (1200×400px).
                    </p>
                    {imageUrl && (
                        <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <img src={imageUrl} alt="waveform" style={{ width: '100%', display: 'block' }} />
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
                        {isProcessing ? 'Generating Waveform...' : 'Generate Waveform Image'}
                    </button>
                </div>
            )}
        </ToolLayout>
    );
}

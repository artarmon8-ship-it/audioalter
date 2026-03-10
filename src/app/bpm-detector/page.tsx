'use client';

import React, { useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

export default function BPMDetectorPage() {
    const [bpm, setBpm] = useState<number | null>(null);
    const [confidence, setConfidence] = useState<'low' | 'medium' | 'high' | null>(null);

    const detectBPM = async (
        file: File,
        setIsProcessing: (b: boolean) => void,
        setResult: (url: string, name: string) => void
    ) => {
        setIsProcessing(true);
        setBpm(null);
        setConfidence(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

            // Use offline context to get energy envelope
            const sampleRate = audioBuffer.sampleRate;
            const data = audioBuffer.getChannelData(0);

            // Downsample for efficiency
            const windowSize = Math.floor(sampleRate / 100); // 10ms windows
            const energyArray: number[] = [];
            for (let i = 0; i < data.length - windowSize; i += windowSize) {
                let energy = 0;
                for (let j = 0; j < windowSize; j++) {
                    energy += Math.abs(data[i + j]);
                }
                energyArray.push(energy / windowSize);
            }

            // Find peaks in energy
            const threshold = energyArray.reduce((a, b) => a + b, 0) / energyArray.length * 1.5;
            const peaks: number[] = [];
            for (let i = 1; i < energyArray.length - 1; i++) {
                if (energyArray[i] > threshold && energyArray[i] > energyArray[i - 1] && energyArray[i] > energyArray[i + 1]) {
                    // Ensure minimum distance between peaks (60 BPM minimum = 1 sec)
                    if (peaks.length === 0 || (i - peaks[peaks.length - 1]) > 100) {
                        peaks.push(i);
                    }
                }
            }

            if (peaks.length < 4) {
                setBpm(null);
                alert('Could not detect a clear BPM. Try a more rhythmically consistent piece of audio.');
                return;
            }

            // Compute inter-onset intervals
            const intervals: number[] = [];
            for (let i = 1; i < peaks.length; i++) {
                intervals.push((peaks[i] - peaks[i - 1]) * (windowSize / sampleRate));
            }

            // Median interval -> BPM
            intervals.sort((a, b) => a - b);
            const medianInterval = intervals[Math.floor(intervals.length / 2)];
            let detectedBPM = 60 / medianInterval;

            // Normalize to common BPM range (60-200)
            while (detectedBPM < 60) detectedBPM *= 2;
            while (detectedBPM > 200) detectedBPM /= 2;

            // Confidence: how many intervals are close to the median
            const closeCount = intervals.filter(v => Math.abs(v - medianInterval) < medianInterval * 0.1).length;
            const conf = closeCount / intervals.length;
            setConfidence(conf > 0.6 ? 'high' : conf > 0.35 ? 'medium' : 'low');
            setBpm(Math.round(detectedBPM));
        } catch (err) {
            console.error(err);
            alert('BPM detection failed. See console.');
        } finally {
            setIsProcessing(false);
        }
    };

    const confColor = { low: '#f59e0b', medium: '#3b82f6', high: '#10b981' };

    return (
        <ToolLayout title="BPM Detector" description="Detect the tempo in beats per minute (BPM) of any song or audio file.">
            {({ file, isProcessing, setIsProcessing, setProcessedResult }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {bpm !== null && (
                        <div style={{
                            textAlign: 'center', padding: '2rem',
                            background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.1))',
                            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ fontSize: '5rem', fontWeight: 800, fontFamily: 'Outfit', lineHeight: 1, background: 'linear-gradient(to right, var(--brand-primary), var(--brand-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {bpm}
                            </div>
                            <div style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>BPM</div>
                            {confidence && (
                                <div style={{ marginTop: '1rem' }}>
                                    <span style={{
                                        backgroundColor: (confColor as any)[confidence] + '20',
                                        color: (confColor as any)[confidence],
                                        padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)',
                                        fontSize: '0.85rem', fontWeight: 600,
                                        border: `1px solid ${(confColor as any)[confidence]}40`
                                    }}>
                                        {confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {!bpm && (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>
                            Upload an audio file and click detect. Works best with rhythmic music.
                        </div>
                    )}

                    <button
                        onClick={() => file && detectBPM(file, setIsProcessing, setProcessedResult)}
                        disabled={isProcessing || !file}
                        style={{
                            backgroundColor: isProcessing ? 'var(--bg-surface-hover)' : 'var(--brand-primary)',
                            color: isProcessing ? 'var(--text-muted)' : 'white',
                            padding: '1rem', borderRadius: 'var(--radius-md)',
                            fontWeight: 600, fontSize: '1rem', border: 'none',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isProcessing ? 'Analysing...' : 'Detect BPM'}
                    </button>
                </div>
            )}
        </ToolLayout>
    );
}

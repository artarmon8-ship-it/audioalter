'use client';

import React, { useState, useRef } from 'react';
import ToolLayout from '@/components/ToolLayout';

export default function PitchShifterPage() {
    const [semitones, setSemitones] = useState(0);
    const [loadingMsg, setLoadingMsg] = useState('');
    const ffmpegRef = useRef<any>(null);

    const processAudio = async (
        file: File,
        setIsProcessing: (b: boolean) => void,
        setResult: (url: string, name: string) => void
    ) => {
        setIsProcessing(true);
        try {
            setLoadingMsg('Loading FFmpeg engine...');
            const { FFmpeg } = await import('@ffmpeg/ffmpeg');
            const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

            if (!ffmpegRef.current) {
                ffmpegRef.current = new FFmpeg();
                const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
                await ffmpegRef.current.load({
                    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                });
            }

            const ffmpeg = ffmpegRef.current;
            setLoadingMsg('Shifting pitch...');

            const inputExt = file.name.split('.').pop() || 'mp3';
            const inputName = `input.${inputExt}`;
            const outputName = `output.wav`;

            await ffmpeg.writeFile(inputName, await fetchFile(file));

            // asetrate changes sample rate (pitch) without changing playback rate
            // then atempo corrects the speed back to 1x
            const rateMultiplier = Math.pow(2, semitones / 12);
            const audioFilter = `asetrate=44100*${rateMultiplier},aresample=44100,atempo=${1 / rateMultiplier}`;

            await ffmpeg.exec(['-i', inputName, '-af', audioFilter, outputName]);

            const data = await ffmpeg.readFile(outputName);
            const blob = new Blob([data], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            setResult(url, `pitch_${semitones > 0 ? '+' : ''}${semitones}_${baseName}.wav`);
            setLoadingMsg('');
        } catch (err) {
            console.error(err);
            setLoadingMsg('');
            alert('Pitch shift failed. Check console for details.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout title="Pitch Shifter" description="Change the pitch of your audio in semitones without altering the playback speed.">
            {({ file, isProcessing, setIsProcessing, setProcessedResult }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <label style={{ fontWeight: 600 }}>Pitch Adjustment</label>
                            <span style={{ fontWeight: 'bold', color: 'var(--brand-primary)', fontSize: '1.2rem' }}>
                                {semitones > 0 ? '+' : ''}{semitones} semitones
                            </span>
                        </div>
                        <input
                            type="range"
                            min="-12" max="12" step="1"
                            value={semitones}
                            onChange={(e) => setSemitones(parseInt(e.target.value))}
                            disabled={isProcessing}
                            style={{ width: '100%', accentColor: 'var(--brand-primary)', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            <span>-12 (Octave Down)</span>
                            <span>0 (Original)</span>
                            <span>+12 (Octave Up)</span>
                        </div>
                    </div>

                    {/* Semitone quick-select buttons */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Quick Select
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {[-12, -7, -5, -3, -2, -1, 0, 1, 2, 3, 5, 7, 12].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setSemitones(v)}
                                    style={{
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        border: `1px solid ${semitones === v ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                                        backgroundColor: semitones === v ? 'rgba(139,92,246,0.15)' : 'transparent',
                                        color: semitones === v ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        fontSize: '0.8rem', fontWeight: 600,
                                        cursor: 'pointer', transition: 'all 150ms ease'
                                    }}
                                >
                                    {v > 0 ? `+${v}` : v}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loadingMsg && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139,92,246,0.3)' }}>
                            <div style={{ width: 16, height: 16, border: '2px solid var(--brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{loadingMsg}</span>
                        </div>
                    )}
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

                    <button
                        onClick={() => file && processAudio(file, setIsProcessing, setProcessedResult)}
                        disabled={isProcessing || !file}
                        style={{
                            backgroundColor: isProcessing ? 'var(--bg-surface-hover)' : 'var(--brand-primary)',
                            color: isProcessing ? 'var(--text-muted)' : 'white',
                            padding: '1rem', borderRadius: 'var(--radius-md)',
                            fontWeight: 600, fontSize: '1rem', border: 'none',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            transition: 'background-color var(--transition-fast)'
                        }}
                    >
                        {isProcessing ? 'Shifting Pitch...' : 'Apply Pitch Shift'}
                    </button>
                </div>
            )}
        </ToolLayout>
    );
}

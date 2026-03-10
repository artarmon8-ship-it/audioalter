'use client';

import React, { useState, useRef } from 'react';
import ToolLayout from '@/components/ToolLayout';

const FORMAT_OPTIONS = [
    { label: 'MP3', value: 'mp3', mime: 'audio/mpeg' },
    { label: 'WAV', value: 'wav', mime: 'audio/wav' },
    { label: 'OGG', value: 'ogg', mime: 'audio/ogg' },
    { label: 'FLAC', value: 'flac', mime: 'audio/flac' },
    { label: 'AAC', value: 'aac', mime: 'audio/aac' },
    { label: 'M4A', value: 'm4a', mime: 'audio/mp4' },
];

const BITRATE_OPTIONS = ['64k', '128k', '192k', '256k', '320k'];

export default function ConverterPage() {
    const [targetFormat, setTargetFormat] = useState('mp3');
    const [bitrate, setBitrate] = useState('192k');
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
            setLoadingMsg('Converting audio...');

            const inputName = `input.${file.name.split('.').pop()}`;
            const outputName = `output.${targetFormat}`;

            await ffmpeg.writeFile(inputName, await fetchFile(file));

            const args = ['-i', inputName];
            if (['mp3', 'aac', 'ogg', 'm4a'].includes(targetFormat)) {
                args.push('-b:a', bitrate);
            }
            args.push(outputName);

            await ffmpeg.exec(args);

            const data = await ffmpeg.readFile(outputName);
            const formatInfo = FORMAT_OPTIONS.find(f => f.value === targetFormat);
            const blob = new Blob([data], { type: formatInfo?.mime || 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            setResult(url, `${baseName}.${targetFormat}`);
            setLoadingMsg('');
        } catch (err) {
            console.error(err);
            setLoadingMsg('');
            alert('Conversion failed. Check console for details.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout title="Audio Converter" description="Convert any audio file to MP3, WAV, OGG, FLAC, AAC, or M4A directly in your browser.">
            {({ file, isProcessing, setIsProcessing, setProcessedResult }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem' }}>
                            Target Format
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {FORMAT_OPTIONS.map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => setTargetFormat(f.value)}
                                    style={{
                                        padding: '0.5rem 1.25rem',
                                        borderRadius: 'var(--radius-sm)',
                                        border: `2px solid ${targetFormat === f.value ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                                        backgroundColor: targetFormat === f.value ? 'rgba(139,92,246,0.15)' : 'var(--bg-surface-hover)',
                                        color: targetFormat === f.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 150ms ease'
                                    }}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {['mp3', 'aac', 'ogg', 'm4a'].includes(targetFormat) && (
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem' }}>
                                Bitrate (Quality)
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                {BITRATE_OPTIONS.map(b => (
                                    <button
                                        key={b}
                                        onClick={() => setBitrate(b)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: 'var(--radius-sm)',
                                            border: `2px solid ${bitrate === b ? 'var(--brand-secondary)' : 'var(--border-color)'}`,
                                            backgroundColor: bitrate === b ? 'rgba(236,72,153,0.12)' : 'var(--bg-surface-hover)',
                                            color: bitrate === b ? 'var(--text-primary)' : 'var(--text-secondary)',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 150ms ease'
                                        }}
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {loadingMsg && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.75rem 1rem', backgroundColor: 'rgba(139,92,246,0.1)',
                            borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139,92,246,0.3)'
                        }}>
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
                        {isProcessing ? 'Converting...' : `Convert to ${targetFormat.toUpperCase()}`}
                    </button>
                </div>
            )}
        </ToolLayout>
    );
}

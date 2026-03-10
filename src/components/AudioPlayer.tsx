'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, RotateCcw } from 'lucide-react';

interface AudioPlayerProps {
    audioUrl: string | null;
    fileName: string;
    onDownload?: () => void;
    isProcessing?: boolean;
}

export default function AudioPlayer({ audioUrl, fileName, onDownload, isProcessing = false }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (audioUrl && audioRef.current) {
            audioRef.current.load();
            setIsPlaying(false);
            setProgress(0);
        }
    }, [audioUrl]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!audioUrl) return null;

    return (
        <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            marginTop: '2rem',
            width: '100%'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{fileName}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                        Ready to play
                    </p>
                </div>

                {onDownload && (
                    <button
                        onClick={onDownload}
                        disabled={isProcessing}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: isProcessing ? 'var(--bg-surface-hover)' : 'var(--brand-primary)',
                            color: isProcessing ? 'var(--text-muted)' : 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            opacity: isProcessing ? 0.7 : 1
                        }}
                    >
                        {isProcessing ? 'Processing...' : <><Download size={18} /> Download</>}
                    </button>
                )}
            </div>

            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={togglePlay}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--brand-primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}
                >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
                </button>

                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', width: '40px', textAlign: 'right' }}>
                    {formatTime((progress / 100) * duration)}
                </span>

                <div style={{
                    flex: 1,
                    height: '6px',
                    backgroundColor: 'var(--bg-base)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer'
                }}
                    onClick={(e) => {
                        if (audioRef.current) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const newProgress = clickX / rect.width;
                            audioRef.current.currentTime = newProgress * duration;
                            setProgress(newProgress * 100);
                        }
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: `${progress}%`,
                        backgroundColor: 'var(--brand-primary)',
                        borderRadius: 'var(--radius-full)'
                    }} />
                </div>

                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', width: '40px' }}>
                    {formatTime(duration)}
                </span>
            </div>
        </div>
    );
}

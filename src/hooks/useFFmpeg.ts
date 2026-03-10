'use client';

import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegSingleton: FFmpeg | null = null;

export function useFFmpeg() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const ffmpegRef = useRef<FFmpeg | null>(null);

    const load = useCallback(async () => {
        if (isLoaded || isLoading) return;
        setIsLoading(true);

        try {
            if (!ffmpegSingleton) {
                ffmpegSingleton = new FFmpeg();
            }
            const ffmpeg = ffmpegSingleton;
            ffmpegRef.current = ffmpeg;

            if (!ffmpeg.loaded) {
                const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
                ffmpeg.on('progress', ({ progress: p }) => {
                    setProgress(Math.round(p * 100));
                });
                await ffmpeg.load({
                    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                });
            } else {
                ffmpegRef.current = ffmpegSingleton;
            }

            setIsLoaded(true);
        } catch (error) {
            console.error('Failed to load FFmpeg:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoaded, isLoading]);

    return { ffmpeg: ffmpegRef, load, isLoaded, isLoading, progress, fetchFile };
}

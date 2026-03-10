'use client';

import React, { useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

export default function ReverbPage() {
    const [roomSize, setRoomSize] = useState(0.5);
    const [wetDry, setWetDry] = useState(0.4);

    const createImpulseResponse = (audioCtx: OfflineAudioContext, duration: number, decay: number) => {
        const sampleRate = audioCtx.sampleRate;
        const length = sampleRate * duration;
        const impulse = audioCtx.createBuffer(2, length, sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const d = impulse.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        return impulse;
    };

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

            const reverbDuration = roomSize * 4 + 0.5; // 0.5s to 4.5s
            const totalLength = audioBuffer.length + Math.floor(audioCtx.sampleRate * reverbDuration);

            const offlineCtx = new OfflineAudioContext(2, totalLength, audioBuffer.sampleRate);

            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;

            const convolver = offlineCtx.createConvolver();
            convolver.buffer = createImpulseResponse(offlineCtx, reverbDuration, 3);

            const dryGain = offlineCtx.createGain();
            dryGain.gain.value = 1 - wetDry;

            const wetGain = offlineCtx.createGain();
            wetGain.gain.value = wetDry;

            // Dry path
            source.connect(dryGain);
            dryGain.connect(offlineCtx.destination);

            // Wet (reverb) path
            source.connect(convolver);
            convolver.connect(wetGain);
            wetGain.connect(offlineCtx.destination);

            source.start();
            const rendered = await offlineCtx.startRendering();
            const blob = audioBufferToWav(rendered);
            const url = URL.createObjectURL(blob);
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            setResult(url, `reverb_${baseName}.wav`);
        } catch (err) {
            console.error(err);
            alert('Reverb processing failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout title="Reverb" description="Add a room reverb effect to your audio to make it sound like it was recorded in a large space.">
            {({ file, isProcessing, setIsProcessing, setProcessedResult }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <label style={{ fontWeight: 600 }}>Room Size</label>
                            <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>
                                {roomSize < 0.3 ? 'Small Room' : roomSize < 0.6 ? 'Medium Hall' : roomSize < 0.85 ? 'Large Hall' : 'Cathedral'}
                            </span>
                        </div>
                        <input type="range" min="0" max="1" step="0.05" value={roomSize}
                            onChange={e => setRoomSize(parseFloat(e.target.value))}
                            disabled={isProcessing}
                            style={{ width: '100%', accentColor: 'var(--brand-primary)', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            <span>Small Room</span><span>Cathedral</span>
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <label style={{ fontWeight: 600 }}>Wet/Dry Mix</label>
                            <span style={{ color: 'var(--brand-secondary)', fontWeight: 700 }}>{Math.round(wetDry * 100)}% Wet</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.05" value={wetDry}
                            onChange={e => setWetDry(parseFloat(e.target.value))}
                            disabled={isProcessing}
                            style={{ width: '100%', accentColor: 'var(--brand-secondary)', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            <span>Dry</span><span>Full Wet</span>
                        </div>
                    </div>

                    <button onClick={() => file && processAudio(file, setIsProcessing, setProcessedResult)}
                        disabled={isProcessing || !file}
                        style={{
                            backgroundColor: isProcessing ? 'var(--bg-surface-hover)' : 'var(--brand-primary)',
                            color: isProcessing ? 'var(--text-muted)' : 'white',
                            padding: '1rem', borderRadius: 'var(--radius-md)',
                            fontWeight: 600, fontSize: '1rem', border: 'none',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isProcessing ? 'Adding Reverb...' : 'Apply Reverb'}
                    </button>
                </div>
            )}
        </ToolLayout>
    );
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels: Float32Array[] = [];
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
    return new Blob([bufferArray], { type: 'audio/wav' });
    function setUint16(data: number) { view.setUint16(pos, data, true); pos += 2; }
    function setUint32(data: number) { view.setUint32(pos, data, true); pos += 4; }
}

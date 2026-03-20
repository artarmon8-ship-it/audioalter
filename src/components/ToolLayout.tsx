'use client';

import React, { useState } from 'react';
import FileUploader from './FileUploader';
import AudioPlayer from './AudioPlayer';
import AdSense from './AdSense';

interface ToolLayoutProps {
    title: string;
    description: string;
    adPlaceholder?: string;
    children: (props: {
        file: File | null;
        isProcessing: boolean;
        setIsProcessing: (loading: boolean) => void;
        setProcessedResult: (url: string, name: string) => void;
    }) => React.ReactNode;
}

export default function ToolLayout({ title, description, adPlaceholder, children }: ToolLayoutProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedUrl, setProcessedUrl] = useState<string | null>(null);
    const [processedName, setProcessedName] = useState<string>('');

    const handleFileUpload = (uploadedFile: File) => {
        setFile(uploadedFile);
        setProcessedUrl(null); // Reset when new file uploaded
        setProcessedName('');
    };

    const handleDownload = () => {
        if (processedUrl && processedName) {
            const a = document.createElement('a');
            a.href = processedUrl;
            a.download = processedName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '800px', padding: '2rem 1.5rem' }}>
            <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 className="title-glow" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{title}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{description}</p>
            </header>

            {/* Top Ad */}
            <AdSense adSlot="8815993397" />

            <div style={{ backgroundColor: 'var(--bg-base)', padding: '0', borderRadius: 'var(--radius-lg)' }}>
                {!file ? (
                    <FileUploader onFileUpload={handleFileUpload} />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{
                            backgroundColor: 'var(--bg-surface)',
                            padding: '1.5rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>Input Audio</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{file.name}</p>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    style={{ color: 'var(--brand-secondary)', fontSize: '0.9rem' }}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>

                        {/* Tool Specific Controls */}
                        <div style={{
                            backgroundColor: 'var(--bg-surface)',
                            padding: '2rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            {children({
                                file,
                                isProcessing,
                                setIsProcessing,
                                setProcessedResult: (url, name) => {
                                    setProcessedUrl(url);
                                    setProcessedName(name);
                                }
                            })}
                        </div>

                        {/* Result Player */}
                        {processedUrl && (
                            <div style={{ marginTop: '1rem' }}>
                                <h3 style={{ marginBottom: '1rem' }}>Result</h3>
                                <AudioPlayer
                                    audioUrl={processedUrl}
                                    fileName={processedName}
                                    onDownload={handleDownload}
                                    isProcessing={isProcessing}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Ad */}
            <div style={{ marginTop: '2rem' }}>
                <AdSense adSlot="8815993397" />
            </div>
        </div>
    );
}

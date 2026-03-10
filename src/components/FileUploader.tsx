'use client';

import React, { useCallback, useState } from 'react';
import { UploadCloud, FileAudio } from 'lucide-react';

interface FileUploaderProps {
    onFileUpload: (file: File) => void;
    accept?: string;
    maxSizeMB?: number;
}

export default function FileUploader({
    onFileUpload,
    accept = 'audio/*',
    maxSizeMB = 50
}: FileUploaderProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    }, []);

    const validateAndProcessFile = (file: File) => {
        setError(null);
        if (!file.type.startsWith('audio/')) {
            setError('Please upload a valid audio file.');
            return;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
            return;
        }
        onFileUpload(file);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndProcessFile(e.dataTransfer.files[0]);
        }
    }, [maxSizeMB, onFileUpload]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndProcessFile(e.target.files[0]);
        }
    };

    return (
        <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${isDragActive ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    backgroundColor: isDragActive ? 'rgba(139, 92, 246, 0.05)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                }}
                onClick={() => document.getElementById('file-upload')?.click()}
            >
                <UploadCloud size={48} color={isDragActive ? 'var(--brand-primary)' : 'var(--text-muted)'} style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    Drag & Drop your audio file here
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    or click to browse from your computer
                </p>

                <input
                    id="file-upload"
                    type="file"
                    accept={accept}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                />

                <button style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.95rem'
                }}>
                    Browse Files
                </button>
            </div>

            {error && (
                <p style={{ color: 'var(--brand-secondary)', marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    {error}
                </p>
            )}

            <p style={{ color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem' }}>
                Max file size: {maxSizeMB}MB. Supported formats: MP3, WAV, OGG, FLAC.
            </p>
        </div>
    );
}

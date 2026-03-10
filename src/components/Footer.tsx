import React from 'react';

export default function Footer() {
    return (
        <footer style={{
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-base)',
            padding: '3rem 0',
            marginTop: 'auto'
        }}>
            <div className="container" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                color: 'var(--text-muted)',
                textAlign: 'center'
            }}>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                    <a href="#">Terms of Service</a>
                    <a href="#">Privacy Policy</a>
                    <a href="#">Contact Us</a>
                </div>
                <p>© {new Date().getFullYear()} AudioToolkit. All rights reserved.</p>
                <p style={{ fontSize: '0.85rem' }}>For informational and tooling purposes. Not affiliated with Audioalter.</p>
            </div>
        </footer>
    );
}

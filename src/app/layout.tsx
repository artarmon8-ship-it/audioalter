import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'AudioToolkit | Easy-to-use online audio tools',
  description: 'A collection of easy-to-use web tools for all your audio files. Free online audio effects and converters.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-6488746175488314" />
      </head>
      <body>
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6488746175488314"
          crossOrigin="anonymous"
        />
        <Navbar />
        <main style={{ flex: 1, padding: '2rem 0' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

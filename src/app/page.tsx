import Link from 'next/link';
import ToolCard from '@/components/ToolCard';
import AdSense from '@/components/AdSense';

const EFFECTS_TOOLS = [
  { title: '3D Audio', desc: 'Enhance stereo sound with a 3D spatial effect', path: '/3d-audio', icon: '🎧' },
  { title: 'Bass Booster', desc: 'Boost the bass of a song making it more bass heavy', path: '/bass-booster', icon: '🔉' },
  { title: 'Equalizer', desc: 'Adjust the frequencies of your audio with 10 bands', path: '/equalizer', icon: '🎚️' },
  { title: 'Noise Reducer', desc: 'Reduce background noise from recordings', path: '/noise-reducer', icon: '🔇' },
  { title: 'Pitch Shifter', desc: 'Change the pitch of your audio in semitones', path: '/pitch-shifter', icon: '🎵' },
  { title: 'Reverb', desc: 'Add a room or hall reverb effect to your audio', path: '/reverb', icon: '🏛️' },
  { title: 'Reverse Audio', desc: 'Reverse an audio file and make it play backwards', path: '/reverse', icon: '🔄' },
  { title: 'Stereo Panner', desc: 'Pan the audio to the left or right channel', path: '/stereo-panner', icon: '↔️' },
  { title: 'Tempo Changer', desc: 'Make an audio file play faster or slower', path: '/tempo', icon: '⏱️' },
  { title: 'Trimmer / Cutter', desc: 'Cut out a specific portion of your audio file', path: '/trimmer', icon: '✂️' },
  { title: 'Volume Changer', desc: 'Make your audio louder or quieter', path: '/volume', icon: '🔊' },
];

const OTHER_TOOLS = [
  { title: 'BPM Detector', desc: 'Detect the tempo in beats per minute of any song', path: '/bpm-detector', icon: '🥁' },
  { title: 'Converter', desc: 'Convert any audio file to MP3, WAV, OGG, FLAC and more', path: '/converter', icon: '🔀' },
  { title: 'Spectrogram', desc: 'Create a spectrogram frequency visualization image', path: '/spectrogram', icon: '📊' },
  { title: 'Waveform Image', desc: 'Create a beautiful waveform image from an audio file', path: '/waveform', icon: '〰️' },
];

export default function Home() {
  return (
    <div className="container">
      {/* Hero Section */}
      <header style={{ textAlign: 'center', marginBottom: '4rem', paddingTop: '2rem' }}>
        <div style={{ display: 'inline-block', padding: '0.35rem 1rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: 'var(--brand-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem' }}>
          Free • In-Browser Processing • No Upload Required
        </div>
        <h1 className="title-glow" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '1rem' }}>
          Your Online Audio Toolkit
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '650px', margin: '0 auto', lineHeight: 1.7 }}>
          A collection of {EFFECTS_TOOLS.length + OTHER_TOOLS.length} easy-to-use web tools for all your audio files.
          Edit, convert, and enhance audio directly in your browser — no installation, no uploads.
        </p>
      </header>

      {/* Top Ad */}
      <AdSense adSlot="8815993397" />

      {/* Audio Effects Grid */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          🎛️ <span>Effects</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Apply real-time audio effects to your files, all processed locally in your browser.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {EFFECTS_TOOLS.map(tool => (
            <Link href={tool.path} key={tool.path} style={{ display: 'block', textDecoration: 'none' }}>
              <ToolCard title={tool.title} desc={tool.desc} icon={tool.icon} />
            </Link>
          ))}
        </div>
      </section>

      {/* Mid Ad */}
      <AdSense adSlot="8815993397" adFormat="rectangle" />

      {/* Other Tools Grid */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          🛠️ <span>Other Tools</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Analysis, conversion, and visualization tools for your audio files.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {OTHER_TOOLS.map(tool => (
            <Link href={tool.path} key={tool.path} style={{ display: 'block', textDecoration: 'none' }}>
              <ToolCard title={tool.title} desc={tool.desc} icon={tool.icon} />
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ marginBottom: '4rem', padding: '2.5rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '2rem' }}>Why use AudioToolkit?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {[
            { icon: '🔒', title: 'Private & Secure', desc: 'Your audio files never leave your device. Processing is 100% in your browser.' },
            { icon: '⚡', title: 'Instant Results', desc: 'No uploading or waiting for server response — get results in seconds.' },
            { icon: '🆓', title: 'Completely Free', desc: 'All tools are free to use with no account required.' },
            { icon: '🌐', title: 'Works Everywhere', desc: 'Compatible with all modern browsers on desktop and mobile.' },
          ].map(f => (
            <div key={f.title} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Ad */}
      <AdSense adSlot="8815993397" />
    </div>
  );
}

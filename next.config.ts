import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Required for FFmpeg.wasm which relies on SharedArrayBuffer
  async headers() {
    return [
      {
        // Apply isolation headers only to tool pages that need FFmpeg/SharedArrayBuffer
        source: '/:path(3d-audio|bass-booster|equalizer|noise-reducer|pitch-shifter|reverb|reverse|stereo-panner|tempo|trimmer|volume|bpm-detector|converter|spectrogram|waveform)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        ],
      },
    ];
  },
};

export default nextConfig;

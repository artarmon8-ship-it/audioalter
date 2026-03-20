'use client';

import React, { useEffect } from 'react';

interface AdSenseProps {
  adSlot?: string;
  adClient?: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
}

const AdSense: React.FC<AdSenseProps> = ({
  adSlot,
  adClient = 'ca-pub-9427573385256168',
  adFormat = 'auto',
  fullWidthResponsive = true,
  style = { display: 'block' },
}) => {
  useEffect(() => {
    if (!adSlot) return;
    
    // Check if the script is loaded and pushed already for this element
    const pushAd = () => {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense initialization error:', e);
      }
    };

    // Delay slightly to ensure script is ready if loaded afterInteractive
    const timeout = setTimeout(pushAd, 100);
    return () => clearTimeout(timeout);
  }, [adSlot]);

  // Don't render anything if no ad slot is configured
  if (!adSlot) return null;

  return (
    <div className="adsense-container" style={{ overflow: 'hidden', margin: '1rem 0' }}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </div>
  );
};

export default AdSense;

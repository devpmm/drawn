'use client';

import { useState, useEffect } from 'react';
import { BRAND_COLOR, BORDER_COLOR, PAGE_BG, SURFACE_BG, TEXT_SECONDARY, TEXT_MUTED, FONT_STACK } from '@/lib/constants';

const STORAGE_KEY = 'drawn_cookie_consent';

export default function CookieBanner({ onAccept, onDecline }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener('showCookieBanner', handler);
    return () => window.removeEventListener('showCookieBanner', handler);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
    onAccept?.();
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setVisible(false);
    onDecline?.();
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .cookie-banner { flex-direction: column !important; white-space: normal !important; padding: 12px 16px !important; }
          .cookie-banner-buttons { width: 100%; }
          .cookie-banner-buttons button { flex: 1; }
        }
      `}</style>
      <div
        className="cookie-banner"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: PAGE_BG,
          borderRadius: '10px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
          border: `0.5px solid ${BORDER_COLOR}`,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          whiteSpace: 'nowrap',
          maxWidth: '90vw',
          fontFamily: FONT_STACK,
        }}
      >
        <span style={{ fontSize: '13px', color: TEXT_SECONDARY }}>
          {'Drawn uses cookies to help me understand how you use it. '}
          <a href="/privacy" style={{ color: TEXT_MUTED, textDecoration: 'underline' }}>Privacy Policy</a>
        </span>
        <div
          className="cookie-banner-buttons"
          style={{ display: 'flex', gap: '8px', flexShrink: 0 }}
        >
          <button
            onClick={decline}
            style={{ background: SURFACE_BG, border: `0.5px solid ${BORDER_COLOR}`, borderRadius: '6px', padding: '5px 12px', fontSize: '12px', color: TEXT_SECONDARY, cursor: 'pointer' }}
          >
            Decline
          </button>
          <button
            onClick={accept}
            style={{ background: BRAND_COLOR, border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', color: '#fff', fontWeight: 500, cursor: 'pointer' }}
          >
            Accept
          </button>
        </div>
      </div>
    </>
  );
}

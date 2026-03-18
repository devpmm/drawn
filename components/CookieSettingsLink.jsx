'use client';

export default function CookieSettingsLink() {
  return (
    <button
      onClick={() => {
        localStorage.removeItem('drawn_cookie_consent');
        window.dispatchEvent(new Event('showCookieBanner'));
      }}
      style={{ fontSize: '11px', color: '#aaa', cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit' }}
    >
      Cookie Settings
    </button>
  );
}

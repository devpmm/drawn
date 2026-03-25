import { readFile } from 'fs/promises';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BORDER_COLOR, PAGE_BG, SURFACE_BG, NAV_BG, FONT_STACK } from '@/lib/constants';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy — Drawn',
};

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'docs', 'privacy-policy.md');
  const content = await readFile(filePath, 'utf8');

  return (
    <div style={{ background: PAGE_BG, minHeight: '100vh', fontFamily: FONT_STACK, color: '#1a1a1a' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', background: NAV_BG, borderBottom: `0.5px solid ${BORDER_COLOR}` }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <img src="/drawn-logo.svg" width="28" height="28" alt="" />
          <span style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.5px', color: '#1a1a1a' }}>Drawn</span>
        </a>
        <a
          href="https://bunny.net/?ref=drawn"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
        >
          <span style={{ fontSize: '14px', color: '#888' }}>Deployed on</span>
          <img
            src="https://bunny.net/static/bunnynet-dark-d6a41260b1e4b665cb2dc413e3eb84ca.svg"
            alt="Bunny.net"
            style={{ height: '28px', display: 'block' }}
          />
        </a>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: '680px', margin: '32px auto', padding: '0 24px 48px' }}>
        <div style={{ background: SURFACE_BG, border: `0.5px solid ${BORDER_COLOR}`, borderRadius: '10px', padding: '40px 48px' }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 style={{ fontSize: '26px', fontWeight: 500, letterSpacing: '-0.5px', marginBottom: '4px', marginTop: 0 }}>{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 style={{ fontSize: '14px', fontWeight: 600, marginTop: '28px', marginBottom: '6px', paddingBottom: '6px', borderBottom: `0.5px solid ${BORDER_COLOR}`, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888' }}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 style={{ fontSize: '13px', fontWeight: 600, marginTop: '16px', marginBottom: '4px', color: '#1a1a1a' }}>{children}</h3>
              ),
              p: ({ children }) => (
                <p style={{ fontSize: '13px', lineHeight: 1.7, color: '#444', margin: '0 0 10px' }}>{children}</p>
              ),
              ul: ({ children }) => (
                <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: '0 0 10px' }}>{children}</ul>
              ),
              ol: ({ children }) => (
                <ol style={{ listStyle: 'decimal', paddingLeft: '20px', margin: '0 0 10px' }}>{children}</ol>
              ),
              li: ({ children }) => (
                <li style={{ fontSize: '13px', lineHeight: 1.7, color: '#444' }}>{children}</li>
              ),
              a: ({ href, children }) => (
                <a href={href} style={{ color: '#888' }}>{children}</a>
              ),
              hr: () => (
                <hr style={{ border: 'none', borderTop: `0.5px solid ${BORDER_COLOR}`, margin: '24px 0' }} />
              ),
              table: ({ children }) => (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '8px' }}>{children}</table>
              ),
              th: ({ children }) => (
                <th style={{ background: PAGE_BG, padding: '8px 12px', border: `0.5px solid ${BORDER_COLOR}`, textAlign: 'left', fontWeight: 500 }}>{children}</th>
              ),
              td: ({ children }) => (
                <td style={{ padding: '8px 12px', border: `0.5px solid ${BORDER_COLOR}`, color: '#444' }}>{children}</td>
              ),
              strong: ({ children }) => (
                <strong style={{ fontWeight: 600, color: '#1a1a1a' }}>{children}</strong>
              ),
              em: ({ children }) => (
                <em style={{ fontStyle: 'italic', color: '#666' }}>{children}</em>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </main>

      <Footer />

    </div>
  );
}

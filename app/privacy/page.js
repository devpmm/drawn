import { readFile } from 'fs/promises';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BORDER_COLOR, PAGE_BG, SURFACE_BG, FONT_STACK } from '@/lib/constants';

export const metadata = {
  title: 'Privacy Policy — Drawn',
};

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'docs', 'privacy-policy.md');
  const content = await readFile(filePath, 'utf8');

  return (
    <div style={{ background: PAGE_BG, minHeight: '100vh', fontFamily: FONT_STACK, color: '#1a1a1a' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', background: '#fff', borderBottom: `0.5px solid ${BORDER_COLOR}` }}>
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
        <div style={{ background: '#fff', border: `0.5px solid ${BORDER_COLOR}`, borderRadius: '10px', padding: '40px 48px' }}>
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

      {/* Footer */}
      <footer style={{ padding: '12px 32px', borderTop: `0.5px solid ${BORDER_COLOR}`, background: '#fff', textAlign: 'center', fontSize: '11px', color: '#aaa', marginTop: '16px' }}>
        {'Made with 🧡 by '}
        <a href="https://www.linkedin.com/in/marek-nalikowski/" target="_blank" rel="noopener noreferrer" style={{ color: '#aaa' }}>
          Marek Nalikowski
        </a>
        {' · Based on '}
        <a
          href="https://github.com/liujuntao123/smart-excalidraw-next"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#aaa', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'middle' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block', flexShrink: 0 }}>
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          smart-excalidraw-next
        </a>
        {' by liujuntao123'}
        {' · '}
        <a href="/privacy" style={{ color: '#aaa', textDecoration: 'none' }}>Privacy Policy</a>
      </footer>

    </div>
  );
}

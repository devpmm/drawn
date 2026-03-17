'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CHART_TYPES } from '@/lib/constants';
import { optimizeExcalidrawCode } from '@/lib/optimizeArrows';
import { repairJsonClosure } from '@/lib/json-repair';

const ExcalidrawCanvas = dynamic(() => import('@/components/ExcalidrawCanvas'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#fafafa',
      backgroundImage: 'radial-gradient(circle, #d0cdc8 1px, transparent 1px)',
      backgroundSize: '24px 24px',
    }} />
  ),
});

const BRAND_COLOR = '#FFA033';
const BORDER_COLOR = '#e0ddd8';
const ACCESS_PASSWORD = process.env.NEXT_PUBLIC_ACCESS_PASSWORD;

export default function Home() {
  const [activeTab, setActiveTab] = useState('text');
  const [chartType, setChartType] = useState('auto');
  const [textInput, setTextInput] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [filePrompt, setFilePrompt] = useState('');
  const [imageData, setImageData] = useState(null);
  const [imageName, setImageName] = useState('');
  const [imageCaption, setImageCaption] = useState('');

  const [panelWidth, setPanelWidth] = useState(550);

  const [elements, setElements] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const panelRef = useRef(null);

  // Scroll to top when any Excalidraw modal opens
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        }
      }
    });

    const watch = () => {
      const container = document.querySelector('.excalidraw-modal-container');
      if (container) {
        observer.observe(container, { childList: true });
        return true;
      }
      return false;
    };

    if (!watch()) {
      const domObserver = new MutationObserver(() => {
        if (watch()) domObserver.disconnect();
      });
      domObserver.observe(document.body, { childList: true, subtree: true });
      return () => { observer.disconnect(); domObserver.disconnect(); };
    }

    return () => observer.disconnect();
  }, []);

  // Sync inputs panel width to Excalidraw toolbar width once it renders
  useEffect(() => {
    const measure = () => {
      // NOTE: '.App-toolbar' is an undocumented Excalidraw internal class — may change in future Excalidraw versions
      const toolbar = document.querySelector('.App-toolbar');
      if (toolbar) {
        const w = toolbar.getBoundingClientRect().width;
        if (w > 0) {
          setPanelWidth(Math.round(w));
          return true;
        }
      }
      return false;
    };

    if (measure()) return;

    const observer = new MutationObserver(() => {
      if (measure()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const fixUnescapedQuotes = (jsonString) => {
    let result = '';
    let inString = false;
    let escapeNext = false;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];
      if (escapeNext) { result += char; escapeNext = false; continue; }
      if (char === '\\') { result += char; escapeNext = true; continue; }
      if (char === '"') {
        if (!inString) {
          inString = true;
          result += char;
        } else {
          const nextNonWS = jsonString.slice(i + 1).match(/^\s*(.)/);
          const next = nextNonWS ? nextNonWS[1] : '';
          if (next === ':' || next === ',' || next === '}' || next === ']' || next === '') {
            inString = false;
            result += char;
          } else {
            result += '\\"';
          }
        }
      } else {
        result += char;
      }
    }
    return result;
  };

  const postProcessCode = (code) => {
    if (!code || typeof code !== 'string') return code;
    let processed = code.trim();
    processed = processed.replace(/^```(?:json|javascript|js)?\s*\n?/i, '');
    processed = processed.replace(/\n?```\s*$/, '');
    processed = processed.trim();
    processed = repairJsonClosure(processed);
    try {
      JSON.parse(processed);
      return processed;
    } catch {
      processed = fixUnescapedQuotes(processed);
      processed = repairJsonClosure(processed);
      return processed;
    }
  };

  const tryParseAndApply = (code) => {
    try {
      const arrayMatch = code.trim().match(/\[[\s\S]*\]/);
      if (!arrayMatch) return;
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) setElements(parsed);
    } catch (e) {
      console.error('Parse failed:', e);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setFileContent(ev.target.result);
    reader.readAsText(file);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1];
      setImageData({ data: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const canGenerate = !isGenerating && (
    (activeTab === 'text' && textInput.trim().length > 0) ||
    (activeTab === 'file' && fileContent.length > 0) ||
    (activeTab === 'image' && imageData !== null)
  );

  const handleGenerate = async () => {
    let userInput;
    if (activeTab === 'text') userInput = textInput.trim();
    else if (activeTab === 'file') userInput = filePrompt.trim()
      ? `${fileContent}\n\nInstruction: ${filePrompt.trim()}`
      : fileContent;
    else if (activeTab === 'image') userInput = { text: imageCaption || 'Generate a diagram from this image', image: imageData };

    if (!userInput) return;

    setIsGenerating(true);
    setError(null);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (ACCESS_PASSWORD) headers['x-access-password'] = ACCESS_PASSWORD;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userInput, chartType }),
      });

      if (!response.ok) {
        let message = 'Failed to generate diagram';
        try {
          const data = await response.json();
          if (data.error) message = data.error;
        } catch {}
        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedCode = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim() || line.trim() === 'data: [DONE]') continue;
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) accumulatedCode += data.content;
              else if (data.error) throw new Error(data.error);
            } catch (e) {
              if (e.message && !e.message.includes('Unexpected')) console.error('SSE parse error:', e);
            }
          }
        }
      }

      const processed = postProcessCode(accumulatedCode);
      const optimized = optimizeExcalidrawCode(processed);
      tryParseAndApply(optimized);
    } catch (e) {
      setError(e.message === 'Failed to fetch' ? 'Network error — check your connection' : e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const textareaStyle = {
    width: '100%',
    height: '72px',
    fontSize: '12px',
    padding: '8px 10px',
    border: `0.5px solid ${BORDER_COLOR}`,
    borderRadius: '6px',
    resize: 'none',
    background: '#fafafa',
    color: '#1a1a1a',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    outline: 'none',
  };

  const dropZoneStyle = {
    width: '100%',
    height: '72px',
    border: `0.5px dashed ${BORDER_COLOR}`,
    borderRadius: '6px',
    background: '#fafafa',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: '#888',
  };

  const inputWidth = `${panelWidth}px`;

  return (
    <div style={{ background: '#f9f7f4', minHeight: '100vh', fontFamily: "var(--font-rubik), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: '#1a1a1a', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', background: '#fff', borderBottom: `0.5px solid ${BORDER_COLOR}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/drawn-logo.svg" width="28" height="28" alt="" />
          <span style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.5px', color: '#1a1a1a' }}>Drawn</span>
        </div>
        <a
          href="https://bunny.net/?ref=drawn"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-bunny-badge"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
        >
          <span className="nav-bunny-text" style={{ fontSize: '14px', color: '#888' }}>Deployed on</span>
          <img
            src="https://bunny.net/static/bunnynet-dark-d6a41260b1e4b665cb2dc413e3eb84ca.svg"
            alt="Bunny.net"
            className="nav-bunny-logo"
            style={{ height: '28px', display: 'block' }}
          />
        </a>
      </nav>

      {/* Hero */}
      <div className="hero-section" style={{ padding: '72px 32px 28px', textAlign: 'center' }}>
        <h1 className="hero-headline" style={{ fontSize: '54px', fontWeight: 500, lineHeight: 1.1, letterSpacing: '-2px', margin: '0 auto 14px', maxWidth: '700px', fontFamily: "var(--font-rubik), sans-serif" }}>
          Turn <span style={{ color: BRAND_COLOR }}>anything</span> into editable Excalidraw diagrams
        </h1>
        <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
          Drop in writing, code, or images — get a diagram you can edit.
        </p>
      </div>

      {/* App section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '0 24px', flex: 1 }}>

        {/* Inputs panel */}
        <div
          ref={panelRef}
          onFocusCapture={() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          style={{ width: inputWidth, maxWidth: '100%', background: '#fff', border: `0.5px solid ${BORDER_COLOR}`, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >

          {/* Tabs */}
          <div style={{ display: 'flex', padding: '0 10px', borderBottom: `0.5px solid ${BORDER_COLOR}` }}>
            {['text', 'file', 'image'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '9px 12px',
                  fontSize: '13px',
                  color: activeTab === tab ? '#1a1a1a' : '#888',
                  fontWeight: activeTab === tab ? 500 : 400,
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab ? `2px solid ${BRAND_COLOR}` : '2px solid transparent',
                  marginBottom: '-0.5px',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Panel body */}
          <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {activeTab === 'text' && (
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                placeholder="e.g. A flowchart showing how a user signs up, verifies their email, and completes onboarding..."
                style={textareaStyle}
              />
            )}

            {activeTab === 'file' && (
              <>
                <div onClick={() => fileInputRef.current?.click()} style={dropZoneStyle}>
                  {fileName ? `📄 ${fileName}` : 'Click to upload a file (.txt, .md, .csv, .json, .py...)'}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.csv,.json,.xml,.html,.js,.ts,.jsx,.tsx,.py,.java,.go,.rb,.php,.sql,.yaml,.yml"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <textarea
                  value={filePrompt}
                  onChange={e => setFilePrompt(e.target.value)}
                  placeholder="Optional: describe what diagram to generate from this file..."
                  style={textareaStyle}
                />
              </>
            )}

            {activeTab === 'image' && (
              <>
                {!imageData ? (
                  <div onClick={() => imageInputRef.current?.click()} style={dropZoneStyle}>
                    Click to upload an image (.png, .jpg, .gif, .webp...)
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', border: `0.5px solid ${BORDER_COLOR}`, borderRadius: '6px', background: '#fafafa', fontSize: '12px', color: '#1a1a1a' }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🖼 {imageName}</span>
                    <button onClick={() => { setImageData(null); setImageName(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '15px', lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
                  </div>
                )}
                <textarea
                  value={imageCaption}
                  onChange={e => setImageCaption(e.target.value)}
                  placeholder="Optional: describe what diagram to generate from this image..."
                  style={textareaStyle}
                />
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              </>
            )}

            {/* Bottom row: chart type left, draw button right */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>Chart type:</span>
                <select
                  value={chartType}
                  onChange={e => setChartType(e.target.value)}
                  style={{ fontSize: '12px', padding: '4px 6px', border: `0.5px solid ${BORDER_COLOR}`, borderRadius: '5px', background: '#f9f7f4', color: '#1a1a1a', width: '110px' }}
                >
                  {Object.entries(CHART_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                style={{
                  padding: '7px 14px',
                  background: canGenerate ? BRAND_COLOR : BORDER_COLOR,
                  color: canGenerate ? '#fff' : '#aaa',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: canGenerate ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                }}
              >
                {isGenerating ? 'Drawing...' : 'Draw it →'}
              </button>
            </div>

          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ width: inputWidth, maxWidth: '100%', padding: '10px 14px', background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#dc2626' }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '18px', lineHeight: 1, padding: '0 0 0 12px' }}>×</button>
          </div>
        )}

        {/* Excalidraw canvas */}
        <div style={{ width: '100%', height: 'calc(100vh - 160px)', minHeight: '320px', border: `0.5px solid ${BORDER_COLOR}`, borderRadius: '10px', overflow: 'visible', position: 'relative' }}>
          <ExcalidrawCanvas elements={elements} />
        </div>

      </div>

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
      </footer>

    </div>
  );
}

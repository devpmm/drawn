'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CHART_TYPES, BRAND_COLOR, BORDER_COLOR, TEXT_MUTED, NAV_BG, PAGE_BG, SURFACE_BG } from '@/lib/constants';
import { optimizeExcalidrawCode } from '@/lib/optimizeArrows';
import { repairJsonClosure } from '@/lib/json-repair';
import CookieBanner from '@/components/CookieBanner';
import CookieSettingsLink from '@/components/CookieSettingsLink';
import Footer from '@/components/Footer';
import posthog from 'posthog-js';

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

const ACCESS_PASSWORD = process.env.NEXT_PUBLIC_ACCESS_PASSWORD;

function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (key && !posthog.__loaded) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'identified_only',
      session_recording: { maskAllInputs: false },
    });
  }
}

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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const panelRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem('drawn_cookie_consent') === 'accepted') {
      initPostHog();
    }
  }, []);

  // Scroll to top whenever any Excalidraw modal opens (container is inserted fresh each time)
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 && node.classList?.contains('excalidraw-modal-container')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isGenerating) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isGenerating]);

  // Sync inputs panel width to Excalidraw toolbar width once it renders,
  // and attach a click listener to the hamburger menu trigger to scroll to canvas
  useEffect(() => {
    let menuTriggerListener = null;

    const measure = () => {
      // NOTE: '.App-toolbar' is an undocumented Excalidraw internal class — may change in future Excalidraw versions
      const toolbar = document.querySelector('.App-toolbar');
      if (toolbar) {
        const w = toolbar.getBoundingClientRect().width;
        if (w > 0) {
          setPanelWidth(Math.round(w));

          // Attach hamburger click listener — scroll to canvas only if at top of page
          const trigger = document.querySelector('.main-menu-trigger');
          if (trigger && !trigger._scrollListenerAttached) {
            menuTriggerListener = () => {
              if (window.scrollY === 0) {
                canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            };
            trigger.addEventListener('click', menuTriggerListener);
            trigger._scrollListenerAttached = true;
          }

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
        if (response.status === 429) {
          setError(<>You've reached the hourly generation limit. Want unlimited diagrams? <a href="https://github.com/devpmm/drawn" target="_blank" rel="noopener noreferrer" style={{ color: '#dc2626', textDecoration: 'underline' }}>Clone the repo on GitHub</a> and run Drawn locally with your own OpenAI key.</>);
          return;
        }
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
    <div style={{ background: PAGE_BG, minHeight: '100vh', fontFamily: "var(--font-rubik), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: '#1a1a1a', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', background: NAV_BG, borderBottom: `0.5px solid ${BORDER_COLOR}` }}>
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
          onFocusCapture={(e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT') {
              panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
          style={{ width: inputWidth, maxWidth: '100%', background: SURFACE_BG, border: `0.5px solid ${BORDER_COLOR}`, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
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
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { handleGenerate(); return; }
                  if (e.key === 'Enter' && !e.shiftKey && canGenerate) { e.preventDefault(); handleGenerate(); }
                }}
                placeholder="e.g. A flowchart showing how a user signs up, verifies their email, and completes onboarding..."
                style={textareaStyle}
              />
            )}

            {activeTab === 'file' && (
              <>
                <div onClick={() => fileInputRef.current?.click()} style={dropZoneStyle}>
                  {fileName ? `📄 ${fileName}` : 'Click to upload a file (.txt, .md, .json, .py, .js, .ts, .rs, .css, .sh...)'}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.csv,.json,.xml,.html,.js,.ts,.jsx,.tsx,.py,.java,.go,.rb,.php,.sql,.yaml,.yml,.css,.scss,.sass,.less,.rs,.c,.cpp,.h,.swift,.kt,.sh,.bash,.zsh,.toml,.ini,.env,.vue,.svelte,.graphql,.gql,.tsv,.jsonl"
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
                {isGenerating
                  ? `Drawing... ${elapsedSeconds < 60 ? `${elapsedSeconds}s` : `${Math.floor(elapsedSeconds / 60)}m ${String(elapsedSeconds % 60).padStart(2, '0')}s`}`
                  : 'Draw it'}
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

        {/* Free tier info */}
        <div style={{ fontSize: '12px', color: TEXT_MUTED, textAlign: 'center', padding: '6px 0' }}>
          {'Free tier: 10 generations/hour · Want unlimited? '}
          <a href="https://github.com/devpmm/drawn" target="_blank" rel="noopener noreferrer" style={{ color: TEXT_MUTED, textDecoration: 'underline' }}>Clone and self-host →</a>
        </div>

        {/* Excalidraw canvas */}
        <div ref={canvasRef} style={{ width: '100%', height: 'calc(100vh - 160px)', minHeight: '320px', overflow: 'visible', position: 'relative' }}>
          <ExcalidrawCanvas elements={elements} />
        </div>

      </div>

      <Footer />

      <CookieBanner
        onAccept={initPostHog}
        onDecline={() => {}}
      />
    </div>
  );
}

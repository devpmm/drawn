# Drawn

**Turn anything into editable Excalidraw diagrams.**

Drop in text, code, or images — get a diagram you can edit. Powered by GPT-5.4 and deployed on [bunny.net](https://bunny.net).

👉 **[Try it at drawn.dev](https://drawn.dev)**

---

## What it does

Drawn converts natural language descriptions, code files, and images into fully editable [Excalidraw](https://excalidraw.com) diagrams. Supports flowcharts, architecture diagrams, mind maps, sequence diagrams, ER diagrams, and 20+ other diagram types.

---

## Changes from the fork

This project is a fork of [smart-excalidraw-next](https://github.com/liujuntao123/smart-excalidraw-next) by liujuntao123. Key changes:

**UI/UX:**
- Complete redesign — centered hero layout replacing the original sidebar
- Removed generated code panel and management UI

**Backend:**
- Full codebase rewrite from Chinese to English
- Simplified access control to server-side env var
- Extended file format support (`.css`, `.scss`, `.rs`, `.c`, `.cpp`, `.swift`, `.kt`, `.sh`, `.bash`, `.toml`, `.vue`, `.svelte`, `.graphql`, `.jsonl` and more)
- Upgraded Next.js to 16.0.11 (fixes critical RCE and DoS vulnerabilities present in the original repo)

**Prompt engineering** (methodology informed by [excalidraw-diagram-skill](https://github.com/coleam00/excalidraw-diagram-skill) by coleam00):
- Semantic color system — color encodes role (start, process, decision, end)
- Descriptive element IDs for reliable arrow binding
- Frame usage for grouping related elements
- Visual hierarchy — node size reflects semantic importance
- Concrete spacing rules anchored at x:100, y:100
- Bidirectional arrow offset to prevent co-linear arrows
- Arrow label font size constraints
- Diamond sizing proportionality
- Minimum element width rule to prevent label clipping

---

## Demo infrastructure

The live demo at [drawn.dev](https://drawn.dev) runs entirely on [bunny.net](https://bunny.net):

- **Compute** — [Magic Containers](https://bunny.net/magic-containers) runs the Next.js app as a Docker container
- **CDN & routing** — Pull Zone handles global traffic distribution and custom domain
- **Security & rate limiting** — [Bunny Shield](https://bunny.net/shield) enforces the free tier limit on `/api/generate`

---

## Self-hosting
```bash
git clone https://github.com/devpmm/drawn
cd drawn
cp .env.example .env.local
```

Edit `.env.local`:
```
SERVER_LLM_API_KEY=your_openai_key
SERVER_LLM_BASE_URL=https://api.openai.com/v1
SERVER_LLM_TYPE=openai
SERVER_LLM_MODEL=gpt-5.4
ACCESS_PASSWORD=your_password
NEXT_PUBLIC_ACCESS_PASSWORD=your_password
```

Then:
```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## License

MIT

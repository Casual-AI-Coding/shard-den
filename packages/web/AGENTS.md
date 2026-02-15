# ShardDen Web - AGENTS.md

**Scope:** Web frontend (Next.js + WASM)  
**Purpose:** Stateless web interface for all tools

---

## STRUCTURE

```
packages/web/
├── package.json
├── next.config.js
├── tailwind.config.js
├── vitest.config.ts
├── tsconfig.json
└── src/
    ├── app/
    │   ├── layout.tsx           # Root layout
    │   ├── page.tsx             # Home page
    │   └── tools/
    │       └── json-extractor/
    │           └── page.tsx     # Tool page
    ├── components/
    │   ├── ui/                  # Shared UI components
    │   └── tools/               # Tool-specific components
    ├── lib/
    │   └── core.ts              # WASM bindings
    ├── styles/
    │   └── globals.css          # Tailwind imports
    └── test/
        └── setup.ts             # Test setup
```

---

## CONVENTIONS

### Routing
- One page per tool: `/tools/{tool-name}/page.tsx`
- Home page lists all tools

### WASM Integration
```typescript
import { initWasm, JsonExtractor } from '@/lib/core';
await initWasm();
const extractor = await JsonExtractor.create();
```

### Components
- Server components by default
- `'use client'` only when needed (hooks, browser APIs)
- Place tool-specific components in `components/tools/{tool}/`

### Styling
- Tailwind CSS only
- No CSS modules
- Use `cn()` utility for conditional classes

---

## STATELESS DESIGN

**Web = No Storage**
- No localStorage
- No history persistence
- No user preferences
- Pure input → process → output

---

## TESTING

```bash
cd packages/web
npm install
npm run test              # Unit tests
npm run test:coverage     # Coverage (≥85%)
```

### Test Types
- Component tests: `*.test.tsx`
- Hook tests: `*.test.ts`
- Page tests: E2E with Playwright (future)

---

## COMMANDS

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript
```

---

## DESIGN DOCS REQUIRED

Before implementing new tool page:
- `docs/designs/ui/{tool}/prototype.md`
- `docs/designs/ui/{tool}/interactions.md`

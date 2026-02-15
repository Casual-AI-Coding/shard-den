# ShardDen (砾穴) - Architecture Design

> Date: 2026-02-15
> Project: ShardDen (砾穴) - Developer Toolkit Platform
> Status: Design Draft

---

## 1. Project Overview

### 1.1 Vision

ShardDen (砾穴) is a **modular toolkit platform** for developers, starting with JSON extraction but designed to grow into a comprehensive collection of CLI + GUI tools.

### 1.2 Core Philosophy

- **Tool as Plugin**: Each tool is an independent module
- **CLI First**: Every tool starts with CLI, validates core logic
- **Shared Core**: Common capabilities (config, history, theming) unified
- **Progressive Enhancement**: CLI → Web → Desktop → Browser Extension

---

## 2. Architecture

### 2.1 System Architecture

#### 2.1.1 Correct Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            ShardDen Platform                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  LAYER 1: Shared Core (Rust Library)                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         shard-den-core                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │    Config    │  │    Error     │  │   History    │  │   Logger   │  │   │
│  │  │    Types     │  │    Types     │  │    Trait     │  │            │  │   │
│  │  │   (struct)   │  │  (enum+Result)│  │  (trait)     │  │ (fn init)  │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│           ▲                    ▲                    ▲                          │
│           │                    │                    │                          │
│           │ USES               │ USES               │ USES                     │
│           │                    │                    │                          │
├───────────┼────────────────────┼────────────────────┼──────────────────────────┤
│           │                    │                    │                          │
│  LAYER 2: Tools (Rust Libraries)                                                │
│           │                    │                    │                          │
│     ┌─────┴─────┐         ┌────┴─────┐         ┌────┴─────┐                  │
│     │           │         │          │         │          │                  │
│  ┌──┴──┐     ┌──┴──┐   ┌─┴──┐     ┌─┴──┐   ┌─┴──┐     ┌─┴──┐              │
│  │Tool │◄────│ CLI │   │Tool│◄────│ CLI│   │Tool│◄────│ CLI│  [Future]      │
│  │ Lib │     │ Bin │   │ Lib│     │ Bin│   │ Lib│     │ Bin│                │
│  │     │     │     │   │    │     │    │   │    │     │    │                │
│  │ •Lib│     │•main│   │ •Lib│     │•main│   │ •Lib│     │•main│              │
│  │ •WASM│     └─────┘   │ •WASM│     └────┘   │ •WASM│     └────┘              │
│  │ export│              │ export│             │ export│                        │
│  └──┬──┘                └──┬──┘             └──┬──┘                          │
│     │                       │                   │                              │
│     └───────────────────────┼───────────────────┘                              │
│                             │                                                  │
│                             ▼ AGGREGATES ALL TOOLS                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     shard-den-wasm (WASM Bundle)                        │   │
│  │                                                                          │   │
│  │   Compiles all tool libs into single WASM file:                         │   │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │   │  • JsonExtractor::new()    • JsonExtractor::extract()          │   │   │
│  │   │  • FutureToolA::new()      • FutureToolB::new()                │   │   │
│  │   └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  │   Output: shard_den_wasm.wasm + shard_den_wasm.js                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                   │
│                              │ LOADS                                             │
│                              │                                                   │
├──────────────────────────────┼───────────────────────────────────────────────────┤
│                              │                                                   │
│  LAYER 3: Frontend (TypeScript/React)                                           │
│                              │                                                   │
│                              ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Web Frontend                                    │   │
│  │                    packages/web/src/app/                                │   │
│  │                                                                          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │   │
│  │  │   page.tsx      │  │ page.tsx        │  │   components/           │  │   │
│  │  │   (Home)        │  │ (JSON Extractor)│  │   • shared UI           │  │   │
│  │  └─────────────────┘  └─────────────────┘  │   • tool-specific       │  │   │
│  │                                            └─────────────────────────┘  │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  lib/core.ts - WASM Integration                                 │   │   │
│  │  │  • initWasm(): Promise<void>                                    │   │   │
│  │  │  • JsonExtractor: Tool class wrapper                            │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  wasm-loader.ts - Loads: shard_den_wasm.wasm                    │   │   │
│  │  │  import * as wasm from '../../../wasm/pkg'                     │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                   │
│                              │ npm run build                                     │
│                              ▼                                                   │
│                    ┌──────────────────┐                                         │
│                    │ packages/web/dist│  (Static files: HTML/CSS/JS/WASM)       │
│                    └────────┬─────────┘                                         │
│                             │                                                    │
├─────────────────────────────┼────────────────────────────────────────────────────┤
│                             │                                                    │
│  LAYER 4: Desktop Shell (Tauri)                                                 │
│                             │                                                    │
│                             │ EMBEDS                                             │
│                             ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     Desktop App (Tauri)                                 │   │
│  │                    packages/desktop/                                    │   │
│  │                                                                          │   │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │   │  UI Layer: EMBEDDED WEB FRONTEND                                │   │   │
│  │   │  ─────────────────────────────────                               │   │   │
│  │   │  Same as Web: Next.js pages + WASM                              │   │   │
│  │   │  Loaded from: packages/web/dist/                                │   │   │
│  │   │                                                                   │   │   │
│  │   │  ⚠️  NO separate Desktop frontend!                              │   │   │
│  │   │  Desktop = Web UI + Native capabilities                         │   │   │
│  │   └─────────────────────────────────────────────────────────────────┘   │   │
│  │                              │                                          │   │
│  │                              │ invoke()                                 │   │
│  │                              ▼                                          │   │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │   │  Tauri Commands (Rust)                                          │   │   │
│  │   │  • commands.rs - IPC handlers                                   │   │   │
│  │   │  • storage.rs - File storage impl                               │   │   │
│  │   │  • Implements HistoryStore trait from Core                      │   │   │
│  │   └─────────────────────────────────────────────────────────────────┘   │   │
│  │                              │                                          │   │
│  │                              ▼                                          │   │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │   │  Local Storage (JSON Files)                                     │   │   │
│  │   │  • ~/.shard-den/config.json                                     │   │   │
│  │   │  • ~/.shard-den/history.json                                    │   │   │
│  │   └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 2.1.2 Critical Clarifications

**❌ WRONG Understanding:**
```
Desktop has its own frontend code
Web ───────► Web Frontend
                ↑
Desktop ─────► Desktop Frontend (different)
                ↑
               WASM
```

**✅ CORRECT Understanding:**
```
Desktop EMBEDS the Web frontend

Web ────────────────────► Web Frontend
                              │
                              │ (npm run build)
                              ▼
Desktop ──► [EMBED: web/dist] + Tauri Commands + Storage
                              │
                              │ (Same WASM!)
                              ▼
                            WASM Tools
```

**Key Points:**
1. **Single Frontend**: `packages/web/` is the ONLY frontend codebase
2. **Desktop is a Shell**: Tauri embeds `packages/web/dist/` as the UI
3. **Same WASM**: Both Web and Desktop load the exact same `shard_den_wasm.wasm`
4. **Desktop adds**: Storage (via Tauri Commands) + System integration (tray, shortcuts)
5. **Web limitation**: Cannot access filesystem, cannot persist data (by design)

### 2.2 Dependency Matrix

| Form | = Core | + CLI Interface | + WASM | + GUI | + Storage | + System |
|------|--------|-----------------|-------|-------|----------|----------|
| CLI | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Web | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Desktop | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ (shortcuts, tray) |
| Extension | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ (browser API) |

### 2.3 Package Dependency Graph

```
                              Workspace: shard-den
                                       │
    ┌──────────────────────────────────┼──────────────────────────────────┐
    │                                  │                                  │
    ▼                                  ▼                                  ▼
┌─────────────────┐          ┌─────────────────────────┐          ┌─────────────────────────┐
│  shard-den-core │          │   shard-den-wasm        │          │  shard-den-desktop      │
│  (Rust Lib)     │          │   (WASM Bundle)         │          │  (Tauri App)            │
│                 │          │                         │          │                         │
│ • config        │◄─────────┤ • Aggregates all tools  │          │ • EMBEDS web/dist       │
│ • error         │   USES   │ • Re-exports to JS      │          │ • Tauri commands        │
│ • history       │ (in WASM)│ • wasm-bindgen wrappers │          │ • storage.rs            │
│ • logger        │          │                         │          │                         │
└────────┬────────┘          └───────────┬─────────────┘          └────────────┬────────────┘
         │                               │                                      │
         │ USES                          │ LOADS (in browser)                   │ USES
         │ (Error types)                 │                                      │ (Config, History)
         ▼                               ▼                                      ▼
┌─────────────────┐          ┌─────────────────────────┐          ┌─────────────────────────┐
│ shard-den-json  │          │      packages/web       │          │    (No new frontend     │
│ (Tool: JSON     │          │     (Next.js App)       │          │        code!)           │
│  Extractor)     │          │                         │          │                         │
│                 │          │  ┌─────────────────┐    │          │  Embeds the same        │
│ ┌─────────────┐ │          │  │  pages/         │    │          │  web/dist as Web        │
│ │ Library     │ │          │  │  components/    │    │          │                         │
│ │ • lib.rs    │─┼──────────┼──┤  lib/core.ts    │    │          └─────────────────────────┘
│ │ • extract.rs│ │ COMPILES │  │  (WASM loader)  │    │
│ │ • path.rs   │ │   INTO   │  └─────────────────┘    │
│ │ • format.rs │─┘          │                         │
│ └──────┬──────┘            │  npm run build ────────►│
│        │                   │          │              │
│        │                   │          ▼              │
│ ┌──────┴──────┐           │  ┌─────────────────┐    │
│ │ CLI Binary  │           │  │  web/dist/      │    │
│ │ • main.rs   │           │  │  (static files) │    │
│ │             │           │  └─────────────────┘    │
│ │ USES: Core  │           │                         │
│ │ + Tool Lib  │           └─────────────────────────┘
│ └─────────────┘
└─────────────────┘
│  • Future tools...      │
│                         │
│  USED BY:               │
│  • Web (direct)         │
│  • Desktop (embedded)   │
└─────────────────────────┘
```

#### Dependency Rules

**Rust Dependencies (Cargo.toml):**

1. **Core** (`shard-den-core`)
   - 👆 Used by: Tool Libs, Tool CLIs, Desktop, WASM (indirectly via Tool Libs)
   - 👇 Uses: Nothing (base layer)

2. **Tool Lib** (`shard-den-json` library)
   - 👆 Used by: Tool CLI, WASM Package
   - 👇 Uses: Core (for error types)

3. **Tool CLI** (`shard-den-json-cli` binary)
   - 👆 Used by: Nobody (end product)
   - 👇 Uses: Tool Lib + Core

4. **WASM Package** (`shard-den-wasm` library)
   - 👆 Used by: Web (loaded in browser), Desktop (loaded in WebView)
   - 👇 Uses: All Tool Libs (aggregates them)

5. **Desktop** (`shard-den-desktop` binary)
   - 👆 Used by: Nobody (end product)
   - 👇 Uses: Core (storage) + Embeds Web (no direct code dependency)

**JavaScript/TypeScript:**

6. **Web** (`packages/web`)
   - 👆 Used by: Desktop (embedded)
   - 👇 Uses: WASM Package (loaded at runtime)

**NO CIRCULAR DEPENDENCIES!**
```
Core ◄── Tool Lib ◄── Tool CLI
  │         │
  │         └── WASM Package ◄── Web
  │                              │
  └──────────────────────────────┘ (Desktop embeds Web + uses Core for storage)
```

**Key insight about WASM:**
- WASM Package is a **Rust crate** that depends on Tool Libs
- When compiled, it produces a `.wasm` file + JS bindings
- Web **does not** have a Cargo dependency on WASM Package
- Web **loads** the WASM file at runtime via `import()`

#### Core Module Usage

| Module | Used By | Purpose | Notes |
|--------|---------|---------|-------|
| **Config** | Desktop | Load/save user settings | Config types from Core |
| **Error/Result** | Tool Libs + CLI + Desktop | Unified error handling | `ShardDenError`, `Result<T>` |
| **History** | Desktop | History storage trait | Desktop implements `HistoryStore` |
| **Logger** | CLI + Desktop | Initialize tracing | `init_logger()` function |
| **Core Types** | Web (indirect) | Via WASM | Web loads WASM which contains Core types |

**Important:** Web doesn't have a `shard-den-core` dependency in package.json. Web loads `shard-den-wasm`, which was compiled from Rust code that used Core types.

### 2.4 Architecture Principles

- **Web = Stateless**: Pure WASM, no backend, no storage
- **Desktop = Full**: WASM + Storage + System integration (reuses Web frontend)
- **CLI = Core**: Pure Rust Core for scripting/automation
- **Shared Core**: Same Rust code compiled for all targets
- **WASM Aggregation**: Single WASM bundle contains all tools

---

## 3. Directory Structure

```
shard-den/
├── Cargo.lock
├── package.json              # Workspace root (for web dependencies)
├── rust-toolchain.toml
│
├── packages/
│   ├── core/                  # Shared Core (Rust) - Pure logic
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs        # Core exports
│   │   │   ├── config.rs     # Configuration management
│   │   │   ├── history.rs    # History storage (Desktop only)
│   │   │   ├── logger.rs     # Logging
│   │   │   └── error.rs      # Error types
│   │   └── tests/
│   │
│   ├── wasm/                  # WASM package (bundles ALL tools)
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs        # Re-exports all tools → single WASM
│   │   │   └── lib.d.ts      # TypeScript types
│   │   └── tests/
│   │
│   ├── tools/
│   │   ├── json-extractor/   # Tool 1: JSON Extractor
│   │   │   ├── Cargo.toml
│   │   │   ├── src/
│   │   │   │   ├── lib.rs    # Tool core (wasm-bindgen exports)
│   │   │   │   ├── extract.rs   # Extraction logic
│   │   │   │   ├── path.rs       # JSONPath logic
│   │   │   │   └── format.rs     # Output formatting
│   │   │   ├── cli/
│   │   │   │   ├── Cargo.toml
│   │   │   │   └── main.rs        # CLI entry point
│   │   │   └── tests/
│   │   │
│   │   └── [future-tool]/    # Tool 2 (future)
│   │       ├── src/
│   │       ├── cli/
│   │       └── tests/
│   │
│   ├── web/                   # Web Frontend (Next.js + WASM)
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx       # Home / Tool launcher
│   │   │   │   └── tools/
│   │   │   │       └── json-extractor/
│   │   │   │           └── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/           # Shared UI components
│   │   │   │   └── tools/        # Tool-specific components
│   │   │   ├── lib/
│   │   │   │   └── core.ts       # WASM bindings (import * as ShardDen from 'shard-den-wasm')
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   └── public/
│   │
│   └── desktop/               # Tauri Desktop App (Rust + WASM + Storage)
│       ├── Cargo.toml
│       ├── tauri.conf.json
│       ├── src/
│       │   ├── main.rs
│       │   ├── lib.rs
│       │   └── commands.rs     # Storage commands (Desktop only)
│       ├── src-tauri/
│       │   ├── Cargo.toml
│       │   ├── tauri.conf.json
│       │   ├── build.rs
│       │   └── src/
│       │       └── main.rs
│       └── icons/
│
├── docs/
│   └── plans/
│       └── 2026-02-15-shard-den-architecture-design.md
│
└── README.md
```

---

## 4. Core Module Usage

### 4.1 Core Consumers

The `shard-den-core` crate provides shared types and is used by:

| Consumer | Uses | Purpose |
|----------|------|---------|
| **Tools** (e.g., `json-extractor`) | `Result`, `ShardDenError` | Unified error handling across all tools |
| **Tool CLI** | `Result`, `ShardDenError`, `Config` (future) | CLI error handling and config access |
| **WASM** | Should use `Result`, `ShardDenError` | Error types for WASM exports (TODO: add dependency) |
| **Desktop** | `Config`, `HistoryEntry`, `HistoryStore`, `Result`, `ShardDenError` | Config persistence, history storage, error handling |

### 4.2 Core Module Diagram

```
shard-den-core/
├── config.rs      ──────┐
│   • Config             │── Used by Desktop (storage.rs)
│   • ToolConfig         │   for persistence
│   • OutputFormat       │
├── error.rs       ──────┤
│   • ShardDenError      │── Used by ALL packages
│   • Result<T>          │   (Tools, CLI, WASM, Desktop)
├── history.rs     ──────┤
│   • HistoryEntry       │── Used by Desktop only
│   • HistoryStore       │   (Web is stateless)
└── logger.rs      ──────┘
    • init_logger()      ─── Should be used by CLI + Desktop
                           (TODO: initialize in main.rs)
```

### 4.3 Why Core Exists

**Without Core (Duplication):**
```
Tool A: struct ErrorA;    Tool B: struct ErrorB;    Desktop: struct ErrorC;
         ResultA                  ResultB                  ResultC
```

**With Core (Unified):**
```
Core:     ShardDenError, Result<T>
         ▲           ▲           ▲
Tool A ──┘           │           └── Desktop
Tool B ──────────────┘
```

Benefits:
- ✅ Single error type across all code
- ✅ Desktop can handle errors from any tool uniformly
- ✅ Config can be shared between CLI and Desktop
- ✅ History trait allows different storage backends (file, DB, etc.)

---

## 5. Core Module Design

### 4.1 Config Manager

```rust
// packages/core/src/config.rs

pub struct Config {
    pub tools: ToolConfig,
    pub ui: UiConfig,
    pub history: HistoryConfig,
}

pub struct ToolConfig {
    pub json_extractor: JsonExtractorConfig,
    // Future tools...
}

pub struct JsonExtractorConfig {
    pub default_output_format: OutputFormat, // json, csv, text
    pub max_history: usize,
    pub favorite_paths: Vec<String>,
}
```

### 4.2 History Storage

```rust
// packages/core/src/history.rs

pub struct HistoryEntry {
    pub id: String,
    pub tool: String,
    pub input: String,
    pub output: String,
    pub timestamp: DateTime<Utc>,
    pub metadata: HashMap<String, String>,
}

pub trait HistoryStore {
    fn add(&mut self, entry: HistoryEntry);
    fn list(&self, tool: Option<&str>, limit: usize) -> Vec<HistoryEntry>;
    fn search(&self, query: &str) -> Vec<HistoryEntry>;
    fn delete(&mut self, id: &str);
    fn clear(&mut self);
}
```

---

## 5. Tool: JSON Extractor

### 5.1 Tool Structure

Each tool has two Cargo packages:

```
packages/tools/json-extractor/
├── src/                    # Core library (for WASM)
│   ├── lib.rs             # wasm_bindgen exports
│   ├── extract.rs         # Extraction logic
│   ├── path.rs            # JSONPath logic
│   └── format.rs          # Output formatting
│
└── cli/                    # CLI binary
    ├── Cargo.toml
    └── main.rs            # Uses core lib
```

> **Why split?** 
> - `src/` → compiled to WASM (for Web/Desktop)
> - `cli/` → compiled to native binary (for CLI)

### 5.2 Core API

```rust
// packages/tools/json-extractor/src/extract.rs

pub struct Extractor {
    config: JsonExtractorConfig,
}

impl Extractor {
    /// Extract fields from JSON using JSONPath-like syntax
    pub fn extract(&self, json: &str, paths: &[String]) -> Result<ExtractResult>;
    
    /// Auto-detect available paths in JSON
    pub fn detect_paths(&self, json: &str) -> Vec<JsonPath>;
    
    /// Format output in various formats
    pub fn format(&self, result: &ExtractResult, format: OutputFormat) -> String;
}
```

### 5.3 Path Syntax

| Syntax | Description | Example |
|--------|-------------|---------|
| `key` | Get key value | `data.items[].id` |
| `*` | Wildcard - all keys | `data.*` |
| `[]` | Array iteration | `data.items[].name` |
| `[0]` | Array index | `data.items[0]` |
| `..` | Recursive descent | `..id` |

### 5.4 CLI Interface

```bash
# Main binary: shard-den (or shard-den.exe on Windows)

# JSON Extractor subcommand
$ shard-den json -p "data.items[].id" < input.json
$ shard-den json -p "id,name,email" -f csv < input.json
$ shard-den json --detect < input.json

# Future tools (same pattern)
$ shard-den csv parse --input data.csv
$ shard-den xml convert --input data.xml
```

**CLI Structure:**
```
shard-den              # Main binary
├── json               # JSON Extractor tool
├── csv                # CSV Parser tool (future)
└── xml                # XML Converter tool (future)
```

---

## 6. Phase Implementation Plan

### 6.1 Phase 1: Core + JSON Extractor CLI + WASM (Week 1)

| Task | Description | Deliverable |
|------|-------------|-------------|
| Setup workspace | Initialize Rust workspace + packages structure | `packages/*` ready |
| Implement Core | Config, Error types | `shard-den-core` crate |
| Build WASM | Configure wasm-bindgen, build pipeline | `shard-den-wasm` crate |
| Implement JSON Extractor lib | Extract, Path, Format logic (wasm-bindgen) | Works in WASM |
| Implement JSON Extractor CLI | CLI interface | Working CLI binary |
| Write tests | Unit tests for extraction logic | 80%+ coverage |

> **Note**: Each tool has two parts:
> - `src/` - Core logic with `#[wasm_bindgen]` exports (for WASM)
> - `cli/` - CLI binary that uses the core logic

### 6.2 Phase 2: Web UI (Week 2)

| Task | Description | Deliverable |
|------|-------------|-------------|
| Setup Next.js | Initialize web package | Next.js app running |
| Integrate WASM | Load `shard-den-wasm` in browser | WASM functions callable |
| JSON Extractor page | UI for extraction | Working web tool |
| Styling | Tailwind + custom theme | Polished UI |
| ⚠️ **Note** | **Web is STATELESS** - no history, no storage | |

### 6.3 Phase 3: Tauri Desktop (Week 3)

| Task | Description | Deliverable |
|------|-------------|-------------|
| Setup Tauri | Initialize desktop package | Tauri app building |
| Integrate Web | Embed web package + WASM | Desktop app works |
| Add Storage | Implement config/history/favorites storage | Data persists |
| System integration | Shortcuts, tray, window management | Native feel |

### 6.4 Phase 4: Extensibility (Week 4+)

| Task | Description | Deliverable |
|------|-------------|-------------|
| Tool plugin system | Register new tools dynamically | Tool registry |
| Second tool demo | Add another tool as proof | Two tools work in all targets |
| Browser extension | (Optional) Chrome extension | Extension |

---

## 7. Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Core Language | Rust | 1.75+ |
| CLI | Clap | 4.x |
| Serialization | Serde | 1.x |
| Web Framework | Next.js | 15.x |
| Web Styling | Tailwind CSS | 3.x |
| Desktop | Tauri | 2.x |
| Storage | JSON Files | - |
| WASM | wasm-bindgen | 0.2.x |

---

## 8. Configuration Files

### 8.1 Cargo.toml (Workspace Root)

```toml
[workspace]
resolver = "2"
members = [
    "packages/core",
    "packages/wasm",
    "packages/tools/json-extractor",
    "packages/tools/json-extractor/cli",
    "packages/desktop",
]

[workspace.package]
version = "0.1.0"
edition = "2021"
authors = ["Your Name"]
license = "MIT"

[workspace.dependencies]
shard-den-core = { path = "packages/core" }
shard-den-wasm = { path = "packages/wasm" }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
wasm-bindgen = "0.2"
clap = { version = "4", features = ["derive"] }
# ...
```

### 8.2 tauri.conf.json

```json
{
  "productName": "ShardDen",
  "identifier": "com.shardden.app",
  "build": {
    "devtools": true
  },
  "app": {
    "windows": [
      {
        "title": "砾穴 ShardDen",
        "width": 900,
        "height": 700,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": null
    }
  }
}
```

---

## 9. Storage Design (Desktop Only)

**Note: Storage is only for Desktop. Web is stateless.**

### 9.1 What to Store

| Data | Description | Example |
|------|-------------|---------|
| **History** |每次提取的输入、输出、时间戳 | `{"input": "...", "output": "...", "time": "..."}` |
| **Favorite Paths** | 常用的 JSONPath | `"data.items[].id"` |
| **User Config** | 主题、默认格式、语言 | `{"theme": "dark", "defaultFormat": "csv"}` |
| **Tool Config** | 每个工具的特定设置 | JSON Extractor 的配置 |

### 9.2 Storage Format

**Format: JSON Files**

```
~/.shard-den/
├── config.json          # 全局配置
├── history.json         # 提取历史
├── favorites.json       # 收藏的路径
└── tools/
    └── json-extractor.json  # 工具特定配置
```

**Why not SQLite?**
- 个人工具，数据量不大
- JSON 文件更易调试、迁移
- 无需额外依赖

---

## 10. WASM + Storage Architecture

### Decision: WASM for Web, Tauri for Desktop

| Target | Approach | Reason |
|--------|----------|--------|
| **CLI** | Native Rust | Fast, scriptable |
| **Web** | WASM | Stateless, no backend, runs in browser |
| **Desktop** | Tauri + Local Storage | Full features + system integration |

### Architecture Comparison

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLI (Native Rust)                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    shard-den-core (Rust Library)                        │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│   │  │    Config    │  │ Error Types  │  │   History    │  │   Logger   │  │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │   │
│   └───────────────────────────────┬─────────────────────────────────────────┘   │
│                                   │ USES (Error types)                           │
│                                   ▼                                              │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │              shard-den-json (Tool Library + CLI Binary)                 │   │
│   │  ┌─────────────────────────────────┐   ┌─────────────────────────────┐  │   │
│   │  │         Library (lib.rs)        │   │     CLI Binary (main.rs)    │  │   │
│   │  │  • extract.rs                   │   │  • Parses CLI args          │  │   │
│   │  │  • path.rs                      │──►│  • Calls Tool methods       │  │   │
│   │  │  • format.rs                    │   │  • Prints to stdout         │  │   │
│   │  │  • lib.rs (wasm-bindgen)        │   │  • Uses Core for errors     │  │   │
│   │  └─────────────────────────────────┘   └─────────────────────────────┘  │   │
│   │                                                                          │   │
│   │  CHARACTERISTICS:                                                        │   │
│   │  • Compiled to native binary (NO WASM)                                   │   │
│   │  • Fastest performance (no WASM overhead)                                │   │
│   │  • No storage (Core has types but no persistence impl)                   │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Web (Browser)                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    Web Frontend (packages/web)                          │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │   │
│   │  │  Next.js     │  │   React      │  │  Tailwind    │                  │   │
│   │  │  pages       │  │   components │  │  CSS         │                  │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘                  │   │
│   │                                                                             │   │
│   │  ┌─────────────────────────────────────────────────────────────────┐     │   │
│   │  │  lib/core.ts - WASM Loader                                       │     │   │
│   │  │  • initWasm(): Loads shard_den_wasm.wasm                        │     │   │
│   │  │  • Provides: JsonExtractor class                                │     │   │
│   │  └─────────────────────────────────────────────────────────────────┘     │   │
│   └───────────────────────────────────┬───────────────────────────────────────┘   │
│                                       │ LOADS                                    │
│                                       ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │              shard-den-wasm (WASM Bundle)                               │   │
│   │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │  │  Compiles: shard-den-json library → WASM                        │   │   │
│   │  │                                                                 │   │   │
│   │  │  Exports (JavaScript-callable):                                 │   │   │
│   │  │  • JsonExtractor.new()                                          │   │   │
│   │  │  • JsonExtractor.extract(json, paths)                          │   │   │
│   │  │  • JsonExtractor.detect_paths(json)                            │   │   │
│   │  └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                          │   │
│   │  CHARACTERISTICS:                                                        │   │
│   │  • Runs in browser sandbox                                               │   │
│   │  • ⚠️ NO filesystem access (by design)                                   │   │
│   │  • ⚠️ NO localStorage/sessionStorage (stateless design)                  │   │
│   │  • All data in memory only                                               │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Desktop (Tauri)                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   LAYER 1: EXACT SAME AS WEB                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │              Web Frontend (packages/web/dist)                           │   │
│   │  ⚠️  THIS IS THE EXACT SAME CODE AS THE WEB VERSION!                    │   │
│   │                                                                         │   │
│   │  Tauri config:                                                          │   │
│   │    build.frontendDist = "../web/dist"                                   │   │
│   │                                                                         │   │
│   │  • Same Next.js pages                                                 │   │
│   │  • Same React components                                              │   │
│   │  • Same WASM loader (lib/core.ts)                                     │   │
│   │  • SAME shard-den-wasm.wasm file!                                     │   │
│   └───────────────────────────────────┬───────────────────────────────────────┘   │
│                                       │                                          │
│   LAYER 2: Desktop Extension (Tauri adds this)                                   │
│                                       │                                          │
│                                       ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │              Tauri Commands (Rust)                                      │   │
│   │                                                                         │   │
│   │  When frontend calls: invoke('save_history', {entry})                  │   │
│   │                    │                                                    │   │
│   │                    ▼                                                    │   │
│   │  Rust receives: commands.rs::save_history(entry)                       │   │
│   │                    │                                                    │   │
│   │                    ▼                                                    │   │
│   │  storage.rs (implements HistoryStore trait from Core)                  │   │
│   │                    │                                                    │   │
│   │                    ▼                                                    │   │
│   │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │  │  Local Storage (JSON Files)                                      │   │   │
│   │  │  • ~/.shard-den/config.json  (Config from Core)                  │   │   │
│   │  │  • ~/.shard-den/history.json (HistoryEntry list)                 │   │   │
│   │  └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                          │   │
│   │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │  │  System Integration                                              │   │   │
│   │  │  • Global shortcuts (e.g., Ctrl+Shift+J open JSON Extractor)    │   │   │
│   │  │  • System tray icon                                              │   │   │
│   │  │  • File associations (.json files → open in app)                │   │   │
│   │  └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                          │   │
│   │  CHARACTERISTICS:                                                        │   │
│   │  • All Web features (same UI, same WASM)                                 │   │
│   │  • PLUS: File storage via Tauri Commands                                 │   │
│   │  • PLUS: System integration (tray, shortcuts)                            │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Insight

```
┌─────────────────────────────────────────────────────────┐
│  Common Misunderstanding:                               │
│                                                         │
│  ❌ "Desktop has its own UI code"                       │
│                                                         │
│      Web ──────► Web UI                                 │
│      Desktop ──► Desktop UI (different?)               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Correct Understanding:                                 │
│                                                         │
│  ✅ "Desktop EMBEDS Web UI"                             │
│                                                         │
│      packages/web/ ◄──── ONLY frontend codebase        │
│           │                                             │
│           ├──► npm run build ──► dist/                  │
│           │                         │                   │
│           │                         ├──► Serve as Web   │
│           │                         │                   │
│           │                         └──► Embed in       │
│           │                               Desktop       │
│           │                                             │
│      Desktop adds: Storage + System features            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Build Pipeline

#### Step-by-Step Build Process

```bash
# 1. Build WASM package (includes ALL tools)
#    This creates the WASM bundle that both Web and Desktop use
cargo build --release -p shard-den-wasm --target wasm32-unknown-unknown
# Output: target/wasm32-unknown-unknown/release/shard_den_wasm.wasm

# 2. Build CLI (native binary, no WASM)
#    Each tool has its own CLI binary
cargo build --release -p shard-den-json-cli
# Output: target/release/shard-den-json.exe

# 3. Build Web (Next.js static site)
#    Creates the frontend that Desktop will embed
cd packages/web
npm install
npm run build
# Output: packages/web/dist/ (static HTML/JS/CSS)

# 4. Build Desktop (Tauri app)
#    IMPORTANT: Desktop doesn't have its own frontend!
#    It embeds packages/web/dist/ from step 3
cd packages/desktop
cargo tauri build
# Output: 
#   - src-tauri/target/release/bundle/msi/*.msi (Windows)
#   - src-tauri/target/release/bundle/dmg/*.dmg (macOS)
#   - src-tauri/target/release/bundle/appimage/*.AppImage (Linux)
```

#### Build Dependencies

```
Web Build:
  ┌─────────────┐     ┌─────────────┐
  │   WASM      │────►│   Web       │
  │  (tools)    │     │   (Next.js) │
  └─────────────┘     └──────┬──────┘
                             │
                             ▼
                       ┌─────────────┐
                       │   dist/     │
                       │   (static)  │
                       └──────┬──────┘
                              │
Desktop Build:                │
  ┌─────────────┐             │
  │   Tauri     │◄────────────┘
  │   Commands  │    (embeds web/dist)
  │   + Storage │
  └──────┬──────┘
         ▼
    ┌─────────────┐
    │   Desktop   │
    │   App       │
    │  (.exe/.app)│
    └─────────────┘
```

### How WASM Bundles All Tools

```
packages/wasm/src/lib.rs
        │
        ├── Re-exports from ALL tools
        │
        ├── json_extractor::extract()
        ├── csv_parser::parse()
        └── xml_converter::convert()
        
        ▼ Compile to WASM ▼
        
shard_den_wasm.wasm (single file with all tools)
```

### Data Flow Comparison

| Capability | CLI | Web | Desktop | Notes |
|------------|-----|-----|---------|-------|
| **Core Tool Functions** | ✅ Native | ✅ WASM | ✅ WASM | Same code, compiled differently |
| **JSON Extraction** | ✅ | ✅ | ✅ | All targets support |
| **CLI Interface** | ✅ stdin/stdout | ❌ | ❌ | CLI only |
| **GUI Interface** | ❌ | ✅ Browser | ✅ Tauri Window | Desktop embeds Web UI |
| **History Persistence** | ❌ | ❌ (by design) | ✅ JSON file | Web is stateless |
| **Config Persistence** | ❌ | ❌ (by design) | ✅ JSON file | Desktop only |
| **Favorites Storage** | ❌ | ❌ | ✅ JSON file | Desktop only |
| **Global Shortcuts** | ❌ | ❌ | ✅ OS-level | Desktop only |
| **System Tray** | ❌ | ❌ | ✅ Native | Desktop only |
| **File Associations** | ❌ | ❌ | ✅ OS-level | Desktop only |
| **Offline Capability** | ✅ | ✅ | ✅ | All work offline |

### Code Reuse Matrix

| Code Component | CLI | Web | Desktop | Reuse Level |
|----------------|-----|-----|---------|-------------|
| **Core Types** (Config, Error) | ✅ | ✅ (via WASM) | ✅ | 100% |
| **Tool Logic** (extract, path, format) | ✅ | ✅ (WASM) | ✅ (WASM) | 100% |
| **Frontend UI** (React components) | ❌ | ✅ | ✅ (embeds Web) | 100% Web↔Desktop |
| **WASM Module** | ❌ | ✅ | ✅ | 100% Web↔Desktop |
| **Storage Implementation** | ❌ | ❌ | ✅ | Desktop only |
| **CLI Binary** | ✅ | ❌ | ❌ | CLI only |

---

## 11. Adding New Tools (Extensibility)

### 11.1 Tool Registration Flow

```
New Tool Request
       │
       ▼
┌──────────────────┐
│ 1. Design        │ ← 参考本文档设计新工具
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. Create Module │ ← 在 tools/ 下创建新目录
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 3. Implement     │ ← Core + CLI + WASM export
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 4. Build WASM   │ ← 编译到 WASM (给 Web/Desktop 用)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 5. Add Web UI    │ ← Next.js 页面
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 6. Build & Test  │ ← 验证 CLI + Web + Desktop
└──────────────────┘
```

### 11.2 Step-by-Step Guide

#### Step 1: Design the Tool

参考本文档第 5 节 JSON Extractor 的设计，回答：
- 工具的核心功能是什么？
- 需要什么配置？
- CLI 接口如何设计？

#### Step 2: Create Module Structure

```bash
# 在 packages/tools/ 下创建新工具
packages/tools/
├── json-extractor/    # 已有的工具
└── new-tool/          # 新工具
    ├── Cargo.toml
    ├── src/
    │   ├── lib.rs     # 核心逻辑导出
    │   └── [tool].rs  # 工具实现
    ├── cli/
    │   └── main.rs    # CLI 入口
    └── tests/
```

#### Step 3: Implement Core Logic

```rust
// packages/tools/new-tool/src/lib.rs
// 必须是 wasm-bindgen 兼容的

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct NewTool {
    // 工具状态
}

#[wasm_bindgen]
impl NewTool {
    pub fn new() -> Self;
    pub fn execute(&self, input: &str) -> Result<String, JsValue>;
}
```

#### Step 4: Build WASM

```bash
# 编译新工具到 WASM
cargo build --release -p new-tool-wasm

# 这会自动包含到 shard-den-wasm 包中
```

> ⚠️ **Important**: 工具必须使用 `#[wasm_bindgen]` 导出，才能在 Web/Desktop 中使用

#### Step 4: Register in Tool Registry

```rust
// packages/core/src/tool.rs

pub enum Tool {
    JsonExtractor(JsonExtractor),
    NewTool(NewTool),
    // 添加新工具...
}

pub struct ToolRegistry;

impl ToolRegistry {
    pub fn register(tool: Tool) {
        // 注册新工具
    }
    
    pub fn get(name: &str) -> Option<Tool>;
    
    pub fn list() -> Vec<ToolInfo>;
}
```

#### Step 5: Add Web UI

```typescript
// packages/web/src/app/tools/new-tool/page.tsx

export default function NewToolPage() {
  // 新工具的页面组件
}
```

#### Step 6: Update Desktop Commands

```rust
// packages/desktop/src/commands.rs

#[tauri::command]
fn run_new_tool(input: String) -> Result<String, String> {
    let tool = NewTool::new();
    tool.execute(&input).map_err(|e| e.to_string())
}
```

### 11.3 Tool Interface Standard

所有工具必须使用 `wasm-bindgen` 导出（以便在 Web/Desktop 中使用）：

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct JsonExtractor {
    // 工具状态
}

#[wasm_bindgen]
impl JsonExtractor {
    /// 工具唯一标识
    pub fn name(&self) -> String;
    
    /// 工具描述
    pub fn description(&self) -> String;
    
    /// 执行工具
    pub fn execute(&self, input: &str) -> Result<String, JsValue>;
    
    /// 获取支持的操作列表
    pub fn operations(&self) -> Vec<Operation>;
}
```

### 11.4 Build Targets

每个工具需要支持以下构建目标：

| Target | Command | Output |
|--------|---------|--------|
| CLI | `cargo build -p tool-cli` | `tool-cli` binary |
| WASM | `cargo build -p tool-wasm` | `tool_wasm.js` + `tool_wasm.wasm` |
| Desktop | Bundled in Tauri | Included in app |

---

## 12. Open Questions

1. ✅ **Storage**: JSON files (Desktop only)
2. ✅ **WASM vs Tauri**: WASM for Web, Tauri for Desktop (user decision)
3. ✅ **Web = Stateless**: Confirmed - no storage in web
4. ✅ **Extension**: Chrome first, later (not in Phase 1-3)
5. ✅ **Naming**: "ShardDen" / "砾穴" confirmed

---

## 13. Known Gaps / TODOs

### 13.1 Missing Dependencies

1. **WASM should use Core**
   - Current: `packages/wasm/Cargo.toml` doesn't include `shard-den-core`
   - Should add: `shard-den-core = { workspace = true }`
   - Use case: Re-export `Result` and `ShardDenError` for consistent error handling

2. **Logger initialization**
   - Current: `logger.rs` exists but isn't called anywhere
   - Should add to:
     - `packages/desktop/src/main.rs`: `shard_den_core::init_logger()`
     - `packages/tools/json-extractor/cli/main.rs`: `shard_den_core::init_logger()`

### 13.2 Design Decisions to Make

1. **Tool Registry**
   - Where should `ToolRegistry` live? Core or separate registry crate?
   - How do tools register themselves at runtime?

2. **Config Persistence for CLI**
   - CLI uses Core's `Config` types but doesn't persist them
   - Should CLI have its own config file? Or is config Desktop-only?

3. **WASM Module Loading**
   - Web: Load WASM via `initWasm()` in `core.ts`
   - Desktop: How does Tauri-embedded Web load WASM? Same mechanism?

### 13.3 Testing Strategy

1. **Coverage requirements**: 85% for all Rust and TypeScript
2. **CI enforcement**: GitHub Actions should block PRs with <85% coverage
3. **WASM tests**: Need `wasm-bindgen-test` setup in CI

---

## 14. Next Steps

1. ✅ Design approved → Commit this doc
2. ✅ Initialize workspace structure
3. ⏳ Fix missing dependencies (WASM → Core)
4. ⏳ Implement Phase 1: Core + CLI
5. ⏳ Build and test WASM in browser
6. ⏳ Integrate Web + WASM
7. ⏳ Add Desktop storage commands

---

*End of Design Document*

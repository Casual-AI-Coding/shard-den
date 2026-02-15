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

### 2.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ShardDen Platform                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Shared Core (Rust)                      │  │
│  │   - Config Manager      - History Storage                  │  │
│  │   - Theme System        - i18n Support                    │  │
│  │   - Logger              - Plugin Registry                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ▲                                   │
│         ┌──────────────────┼──────────────────┐              │
│         │                  │                  │              │
│  ┌──────┴──────┐   ┌──────┴──────┐   ┌──────┴──────┐      │
│  │Tool: JSON   │   │Tool: [?]    │   │Tool: [?]    │      │
│  │Extractor   │   │              │   │              │      │
│  │ ┌────────┐ │   │ ┌────────┐ │   │ ┌────────┐ │      │
│  │ │ Core   │ │   │ │ Core   │ │   │ │ Core   │ │      │
│  │ └────────┘ │   │ └────────┘ │   │ └────────┘ │      │
│  │ ┌────────┐ │   │ ┌────────┐ │   │ ┌────────┐ │      │
│  │ │ CLI    │ │   │ │ CLI    │ │   │ │ CLI    │ │      │
│  │ └────────┘ │   │ └────────┘ │   │ └────────┘ │      │
│  └─────────────┘   └─────────────┘   └─────────────┘      │
│                              │                               │
│         ┌────────────────────┼────────────────────┐        │
│         │                    │                    │        │
│  ┌──────┴──────┐   ┌──────┴──────┐   ┌──────┴──────┐   │
│  │  Web UI     │   │ Tauri App  │   │Browser Ext  │   │
│  │ (All Tools) │   │  (Desktop) │   │             │   │
│  └─────────────┘   └──────────────┘   └─────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Dependency Matrix

| Form | = Core | + CLI Interface | + WASM | + GUI | + Storage | + System |
|------|--------|-----------------|-------|-------|----------|----------|
| CLI | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Web | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Desktop | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ (shortcuts, tray) |
| Extension | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ (browser API) |

### 2.3 Architecture Principles

- **Web = Stateless**: Pure WASM, no backend, no storage
- **Desktop = Full**: WASM + Storage + System integration
- **CLI = Core**: Pure Rust Core for scripting/automation
- **Shared Core**: Same Rust code compiled for all targets

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

## 4. Core Module Design

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

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI (Rust)                           │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                  Core (Rust)                         │  │
│   └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Web (Next.js + WASM)                     │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              Frontend (No Backend)                   │  │
│   │   ┌─────────────────────────────────────────────┐   │  │
│   │   │           Core.wasm (Stateless)              │   │  │
│   │   │  - JSON extraction                          │   │  │
│   │   │  - Path detection                           │   │  │
│   │   │  - Format conversion                        │   │  │
│   │   └─────────────────────────────────────────────┘   │  │
│   └─────────────────────────────────────────────────────┘  │
│   ⚠️ No storage - stateless usage only                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Desktop (Tauri + WASM + Storage)            │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              Frontend (Next.js)                     │  │
│   │   ┌─────────────────────────────────────────────┐   │  │
│   │   │           Core.wasm (Shared)                │   │  │
│   │   └─────────────────────────────────────────────┘   │  │
│   └─────────────────────────────────────────────────────┘  │
│                         │                                   │
│                         ▼                                   │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              Storage (JSON Files)                   │  │
│   │   - ~/.shard-den/config.json                       │  │
│   │   - ~/.shard-den/history.json                      │  │
│   │   - ~/.shard-den/favorites.json                    │  │
│   └─────────────────────────────────────────────────────┘  │
│                         │                                   │
│                         ▼                                   │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              System Integration                     │  │
│   │   - Global shortcuts                               │  │
│   │   - System tray                                    │  │
│   │   - File associations                             │  │
│   └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Build Pipeline

```bash
# 1. Build WASM package (includes ALL tools)
cargo build --release -p shard-den-wasm
# Output: packages/wasm/pkg/
#   ├── shard_den_wasm.js     # JS bindings (ALL tools)
#   ├── shard_den_wasm_bg.wasm # WASM binary (ALL tools)
#   └── shard_den_wasm.d.ts   # TypeScript types

# 2. Build CLI (each tool is a separate binary)
cargo build --release -p shard-den-json  # JSON Extractor CLI

# 3. Build Desktop (bundles WASM + storage commands)
cargo tauri build
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

| Feature | Web | Desktop |
|---------|-----|---------|
| Extract JSON | ✅ WASM | ✅ WASM |
| Save to history | ❌ | ✅ Local file |
| Favorite paths | ❌ | ✅ Local file |
| Theme settings | ❌ (browser only) | ✅ |
| Global shortcuts | ❌ | ✅ |
| System tray | ❌ | ✅ |

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

## 13. Next Steps

1. ✅ Design approved → Commit this doc
2. ⏳ Initialize workspace structure
3. ⏳ Implement Phase 1: Core + CLI

---

*End of Design Document*

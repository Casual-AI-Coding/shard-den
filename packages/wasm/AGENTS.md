# ShardDen WASM - AGENTS.md

**Scope:** WASM bindings  
**Purpose:** Compile all tools to WebAssembly for Web + Desktop

---

## STRUCTURE

```
packages/wasm/
├── Cargo.toml
├── src/
│   ├── lib.rs          # Main exports
│   ├── utils.rs        # WASM utilities
│   └── json_extractor.rs  # Tool re-exports (when implemented)
└── pkg/                # wasm-pack output (generated)
    ├── shard_den_wasm.js
    ├── shard_den_wasm_bg.wasm
    └── shard_den_wasm.d.ts
```

---

## CONVENTIONS

### WASM Exports
- Use `#[wasm_bindgen]` on all public structs/functions
- Constructor must use `#[wasm_bindgen(constructor)]`
- Return `Result<T, JsValue>` for fallible operations

### Tool Re-exports
Each tool exports a module here:
```rust
pub mod json_extractor;
pub mod csv_parser;  // future
```

### TypeScript Types
- wasm-pack generates `.d.ts` automatically
- Import in web: `import * as ShardDen from 'shard-den-wasm'`

---

## BUILD

```bash
# Development
cd packages/wasm
wasm-pack build --target web --dev

# Release
wasm-pack build --target web --release

# All tools included in single WASM file
```

---

## TESTING

```bash
# WASM tests use wasm-bindgen-test
wasm-pack test --headless --firefox
wasm-pack test --headless --chrome
```

---

## NOTES

- Single WASM bundle contains ALL tools
- Target: `web` (not bundler) for Next.js compatibility
- Size matters: use ` wee_alloc` in release if needed

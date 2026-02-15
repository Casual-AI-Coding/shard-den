# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure

## [0.1.1] - 2026-02-15

### Added
- **Core Module** (`shard-den-core`)
  - Configuration management with serde serialization
  - Unified error types with `thiserror`
  - History storage trait for desktop persistence
  - Logger initialization utilities

- **JSON Extractor Tool** (`shard-den-json`)
  - Core library with extraction, path parsing, and formatting
  - WASM-compatible exports using `wasm-bindgen`
  - CLI binary with clap argument parsing
  - Support for JSONPath-like syntax

- **WASM Package** (`shard-den-wasm`)
  - Aggregates all tools into single WASM bundle
  - JavaScript bindings for browser usage
  - TypeScript type definitions

- **Web Frontend** (`packages/web`)
  - Next.js 15 + React + TypeScript setup
  - Tailwind CSS for styling
  - Vitest for testing with 85% coverage requirement
  - WASM integration loader
  - JSON Extractor tool page

- **Desktop App** (`packages/desktop`)
  - Tauri 2.x configuration
  - File-based storage implementation (JSON)
  - IPC commands for frontend communication
  - System integration (shortcuts, tray - planned)

- **Documentation**
  - Comprehensive architecture design document
  - UI prototype specifications (ASCII diagrams)
  - Functional flow diagrams (Mermaid)
  - AGENTS.md for each package
  - Code coverage requirements (≥85%)

- **Development Infrastructure**
  - Rust workspace configuration
  - Node.js workspace setup
  - GitHub Actions CI/CD pipeline
  - EditorConfig and rustfmt configuration
  - Build scripts for all targets

### Technical Details

#### Dependencies
- Rust: 1.75+
- wasm-bindgen: 0.2.x
- Next.js: 15.x
- Tauri: 2.x
- Clap: 4.x
- Serde: 1.x

#### Architecture
- **Web = Stateless**: No storage, pure WASM in browser
- **Desktop = Full**: Embeds Web UI + adds storage via Tauri
- **CLI = Core**: Native Rust, no WASM overhead
- **Shared Core**: Same Rust code compiled for all targets

[Unreleased]: https://github.com/oGsLP/shard-den/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/oGsLP/shard-den/releases/tag/v0.1.1

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.2-1] - 2026-02-23

### Added
- Test coverage improvements (90.53% coverage)
- Additional tests for error handling and edge cases
- Fixed detect_paths test assertions to match actual output format

### Fixed
- Package name references updated: `shard-den-json` → `shard-den-json-extractor`
- Documentation references updated across all files
- Unused import warnings in desktop module

### Documentation
- Updated release flow documentation
- CLI usage examples aligned with actual implementation

## [0.2.1] - 2026-02-22

### Added
- Unified CLI binary (`shard-den`) replacing `shard-den-json`
  - `shard-den extract --paths PATH [--format FORMAT] [input]`
  - `shard-den detect [input]`
  - `shard-den tools`
- crates.io publishing in release workflow
- `CARGO_REGISTRY_TOKEN` support for publishing to crates.io

### Changed
- CLI binary renamed from `shard-den-json` to `shard-den`
- Release artifacts renamed accordingly

## [0.2.0] - 2026-02-22

### Added
- JSON Extractor Web UI with full functionality
  - JSON input with validation (debounced 500ms)
  - JSONPath expression input with syntax help
  - Extract button with WASM backend integration
  - Output display with format selection (JSON/CSV/Text/YAML)
  - Copy and Download buttons
  - File upload support
  - URL import support
  - Clipboard paste support
  - Right-click context menu for copying
  - Detected paths popup for auto-complete
  - Session storage persistence
- WASM panic fix (create fresh instance per operation)
- UUID dependency removed (replaced with simple ID generator)
- Path detection with `$.` prefix and `[*]` wildcard for arrays

### Fixed
- Popup positioning with scroll offset and auto-flip
- getBoundingClientRect null error after async operation

## [0.1.2] - 2026-02-15

### Added
- Desktop app builds for Linux (AppImage), Windows (MSI), macOS (DMG)
- Comprehensive web tests achieving >85% coverage
- GitHub Actions workflow for automated releases

### Fixed
- CI workflow system dependencies for Tauri builds
- TypeScript errors in test files

## [0.1.1] - 2026-02-15

### Added
- Initial project structure

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

[Unreleased]: https://github.com/oGsLP/shard-den/compare/v0.2.2-1...HEAD
[0.2.2-1]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.2-1
[0.2.1]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.1
[0.2.0]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.0
[0.1.2]: https://github.com/oGsLP/shard-den/releases/tag/v0.1.2
[0.1.1]: https://github.com/oGsLP/shard-den/releases/tag/v0.1.1

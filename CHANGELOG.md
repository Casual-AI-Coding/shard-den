# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.4] - 2026-02-24

### Added
- Toast notification component with success/error/warning/info types
- InputPanel, OutputPanel, UrlImportModal components
- Divider between textarea and toolbar in input/output panels
- Smaller extract button
- URL input width increased in modal
- Popup now shows toast instead of covering button when no paths
- Toast positioned at top center with animation

### Fixed
- Popup covering button issue when no paths detected
- Component splitting for better maintainability

## [0.2.3] - 2026-02-23

### Added
- CLI artifact naming with version suffix
- Desktop bundle formats: AppImage, deb, rpm, MSI, NSIS (exe), DMG
- crates.io links in release description
- WASM optimization configuration (bulk-memory, nontrapping-float-to-int, sign-ext)

### Fixed
- Desktop artifact paths in CI workflow
- tauri-cli installation using taiki-e/install-action
- Artifact naming consistency (added `-cli-` suffix)
- Release workflow path configurations

### Performance
- Added Swatinem rust-cache for faster builds
- Web artifact reuse between build-web and build-desktop jobs
- cargo-binstall for fast tauri-cli installation

## [0.2.2] - 2026-02-23

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

## [0.2.2-1] - 2026-02-23

### Fixed
- CI release workflow fix

## [0.2.1] - 2026-02-22

### Added
- Project initialization and basic structure
- Core Rust library with error handling
- JSON Extractor tool implementation
- WASM bindings for web integration
- CLI binary for command-line usage
- Web frontend (Next.js)
- Desktop application (Tauri)
- GitHub Actions CI/CD workflows

[Unreleased]: https://github.com/oGsLP/shard-den/compare/v0.2.4...HEAD
[0.2.4]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.4
[0.2.3]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.3
[0.2.2]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.2
[0.2.2-1]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.2-1
[0.2.1]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.1

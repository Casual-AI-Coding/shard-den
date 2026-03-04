# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.2] - 2026-03-05

### Added
- **PlantUML Engine** - 新增服务器端 PlantUML 渲染引擎
- **PlantUML 语法高亮** - Monaco Editor 支持 PlantUML 语法高亮
- **PlantUML 自动补全** - 代码自动补全支持
- **PlantUML 官方主题** - 支持 Cerulean, Sketchy, Toy, Vibrant 等主题
- **PDF 导出** - UML 图表 PDF 导出功能
- **URL 分享** - 支持主题参数编码的 URL 分享功能
- **全局微调面板** - ThemeTuner 弹出框
- **Playwright E2E 测试** - 添加 Playwright 依赖和配置

### Changed
- **Logo 图标** - 更新为新的 ShardDen Logo
- **测试覆盖率** - 提升至 85.66%

### Fixed
- **Next.js Page 导出** - 修复 `findJsonPath` 导出类型错误
- **TypeScript 类型** - 修复 `Editor.tsx` 隐式 any 类型错误
- **测试模块结构** - 修复 cargo fmt 导致的测试模块问题
- **重复代码** - 删除 `Preview.tsx`, `ExportPanel.tsx` 中的重复代码
- **补全提供者** - 修复 Monaco 补全提供者重复注册问题

---

## [0.3.1] - 2026-03-02

### Security

这是一次大规模安全加固工作，按模块分 5 个 Phase 实施：

#### Core Module
- **C1** - 时间戳 panic 防护 - `map() + unwrap_or(0)` (P3)
- **C3** - 敏感数据保护 - 新增 `is_sensitive` 字段 + Base64 混淆 (P2)
- **C4** - Logger 初始化防护 - 使用 `Once` 防止多次调用 panic (P2)
- **C5** - 语言检测改进 - 从 `LANG` 环境变量读取 (P3)

#### JSON Extractor Module
- **J1** - **DoS 防护 - 文件大小限制 (10MB)** (P0 关键)
- **J2** - JSON 深度限制 (128层) - 防止栈溢出 (P1)
- **J3** - 健壮路径解析 - 支持引号内逗号、转义字符 (P2)
- **J4** - Path 模块标记 deprecated (P2)

#### UML Styler Module
- **U1** - CLI 完整实现 - style/themes/engines 子命令 (P1)
- **U3** - Cargo.toml 依赖路径修复 (P1)
- **U4** - SRP 重构 - 拆分 theme/data.rs 和 theme/transformer.rs (P2)

#### Desktop Module
- **D1** - **CSP 安全策略配置** (P0 关键)
- **D5** - Shell 权限限制 - 移除宽松的 `shell:allow-open` (P2)
- **D6** - 历史文件大小限制 (10MB) + 条目数限制 (1000) (P2)

#### WASM Module
- **W1** - API 一致性 - `version()` 和 `ping()` 返回 `Result` (P3)

### Added
- 新增 `base64` 依赖用于敏感数据混淆
- 新增大量单元测试: Core (+8), JSON Extractor (+52), UML Styler (+13)

### Documentation
- 新增 `docs/plans/iterations/2026-03-01-security-fixes-design.md` - 安全修复设计文档
- 新增 `docs/plans/tasks/security-fixes-progress.md` - 任务进度跟踪


## [0.3.0] - 2026-03-01

### Added
- **UML Styler Tool** - 全新 UML 图表编辑器
  - Monaco Editor 代码编辑器，支持 PlantUML/Mermaid 语法高亮
  - Mermaid.js 本地渲染，实时预览
  - 12+ 内置主题，支持共享/独立主题模式
  - PNG/SVG 导出，支持多分辨率选择
  - 内置模板库（时序图、流程图、类图等）
  - URL 分享功能 (LZ-String 压缩)
- `shard-den-uml-styler` Rust 包 (90.67% 测试覆盖率)
- 新增依赖: mermaid, @monaco-editor/react, lz-string

### Fixed
- UML Styler 组件使用全局主题 CSS 变量替代硬编码颜色

### Performance
- Rust 核心代码: +2,286 行
- Web 前端代码: +1,800 行

---

## [0.2.7] - 2026-02-28

### Added
- Tauri Desktop integration (`@tauri-apps/cli`)
- Tauri API binding in `packages/web/src/lib/tauri.ts`
- Configuration save/load for Desktop mode
- History saving after extraction in Desktop mode
- JSON path detection using `json-cursor-path` library
- Comprehensive test coverage for JSON extractor components
- Test setup file for web tests

### Fixed
- Broken `findJsonPathByPosition` replaced with working implementation
- Sidebar not showing on first load (hydration issue)
- Missing `xl:block` / `xl:hidden` in Tailwind safelist
- Desktop dev workflow (`npm run dev:desktop`)
- Cargo.toml bin name collision (PDB files)
- Various syntax errors introduced during refactoring

### Changed
- Responsive breakpoints: sidebar now shows at `xl` (≥1280px) instead of `lg`
- Narrower sidebar width (`w-52` vs `w-64`)
- Increased font sizes on xl screens
- Adjusted panel gap and min-height for better desktop use

### Performance
- Improved test coverage

---

## [0.2.6] - 2026-02-25

### Added
- Version displayed in page title (via webpack DefinePlugin)

### Fixed
- Version reading from package.json (simplified approach)

---

## [0.2.5] - 2026-02-25

### Added
- Netlify deployment configuration
- Netlify deploy in release workflow
- Netlify badge in README

### Fixed
- Netlify build script (WASM build first)
- Netlify publish directory (.next)
- CHANGELOG format (missing version entries)
- GitHub release notes for v0.2.3 and v0.2.4

---

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

---

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

---

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

---

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

---

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

---

## [0.1.2] - 2026-02-15

### Added
- Desktop app builds for Linux (AppImage), Windows (MSI), macOS (DMG)
- Comprehensive web tests achieving >85% coverage
- GitHub Actions workflow for automated releases

### Fixed
- CI workflow system dependencies for Tauri builds
- TypeScript errors in test files

---

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

## [Unreleased]: https://github.com/oGsLP/shard-den/compare/v0.3.2...HEAD
[0.3.2]: https://github.com/oGsLP/shard-den/releases/tag/v0.3.2
[0.3.1]: https://github.com/oGsLP/shard-den/releases/tag/v0.3.1
[0.3.1]: https://github.com/oGsLP/shard-den/releases/tag/v0.3.1
[0.3.0]: https://github.com/oGsLP/shard-den/releases/tag/v0.3.0
[0.3.0]: https://github.com/oGsLP/shard-den/releases/tag/v0.3.0
[0.2.7]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.7
[0.2.6]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.6
[0.2.5]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.5
[0.2.4]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.4
[0.2.3]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.3
[0.2.2]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.2
[0.2.1]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.1
[0.2.0]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.0
[0.1.2]: https://github.com/oGsLP/shard-den/releases/tag/v0.1.2
[0.1.1]: https://github.com/oGsLP/shard-den/releases/tag/v0.1.1
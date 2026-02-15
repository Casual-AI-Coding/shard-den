# ShardDen (砾穴)

> A modular developer toolkit platform

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![Status](https://img.shields.io/badge/status-planning-yellow)

## Project Name

- **English**: ShardDen
- **中文**: 砾穴 (Lì Xué)

## Vision

A modular toolkit platform for developers, starting with JSON extraction but designed to grow into a comprehensive collection of CLI + GUI tools.

## Architecture

```
CLI (Rust)     → Pure Rust Core
Web (WASM)     → Stateless, runs in browser
Desktop (Tauri)→ Full features + storage + system integration
```

## Getting Started

See [docs/plans/2026-02-15-shard-den-architecture-design.md](./docs/plans/2026-02-15-shard-den-architecture-design.md) for detailed design.

## Tech Stack

- **Core**: Rust
- **Web**: Next.js + WASM
- **Desktop**: Tauri 2.x

## License

MIT

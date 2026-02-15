# ShardDen Desktop - AGENTS.md

**Scope:** Desktop app (Tauri + WASM + Storage)  
**Purpose:** Full-featured desktop application with persistence

---

## STRUCTURE

```
packages/desktop/
├── Cargo.toml
├── src/
│   ├── main.rs          # Entry point
│   ├── lib.rs           # Library exports
│   ├── commands.rs      # Tauri commands
│   └── storage.rs       # File-based storage
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json  # Tauri config
│   ├── build.rs
│   └── src/main.rs
└── icons/               # App icons
```

---

## CONVENTIONS

### Commands
- All commands in `commands.rs`
- Return `Result<T, String>` for frontend compatibility
- Use `State<'_, AppState>` for shared resources

### Storage
- JSON files in app data directory
- Config: `config.json`
- History: `history.json`
- Implements `HistoryStore` trait from core

### Platform Data Directories
- macOS: `~/Library/Application Support/com.shardden.app/`
- Windows: `%APPDATA%/com.shardden.app/`
- Linux: `~/.local/share/com.shardden.app/`

---

## COMMANDS

| Command | Description |
|---------|-------------|
| `get_version` | Get app version |
| `save_config` / `load_config` | Persist settings |
| `save_history` / `load_history` | History management |
| `detect_paths` / `extract_json` | WASM wrappers |

---

## BUILD

```bash
cd packages/desktop

# Development
cargo tauri dev

# Production build
cargo tauri build
```

---

## FULL FEATURES

Unlike Web, Desktop has:
- ✅ Config persistence
- ✅ History storage
- ✅ Favorites
- ✅ System tray
- ✅ Global shortcuts
- ✅ File associations

---

## TESTING

```bash
# Rust tests
cargo test -p shard-den-desktop

# Tauri integration tests
cargo test --features tauri/test
```

---

## NOTES

- Embeds `packages/web` as frontend
- Commands bridge WASM ↔ Storage
- Single executable bundles everything

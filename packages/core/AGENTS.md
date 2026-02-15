# ShardDen Core - AGENTS.md

**Scope:** Shared core library  
**Purpose:** Config, errors, history traits used across all tools

---

## STRUCTURE

```
packages/core/
├── Cargo.toml
└── src/
    ├── lib.rs        # Public exports
    ├── config.rs     # Configuration types
    ├── error.rs      # Error types
    ├── history.rs    # History storage traits
    └── logger.rs     # Logging utilities
```

---

## CONVENTIONS

### Error Handling
- Use `thiserror` for error definitions
- Provide `Result<T>` type alias
- Include context in error messages

### Configuration
- Use `serde` for serialization
- Implement `Default` for all config types
- Support both file and environment-based config

### History
- Desktop-only trait (Web is stateless)
- Use UUID for entry IDs
- Include timestamps in UTC

---

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new config option | `config.rs` | Add to relevant struct |
| Add new error type | `error.rs` | Follow existing pattern |
| History implementation | `history.rs` | Desktop implements trait |

---

## TESTING

- Unit tests in `#[cfg(test)]` modules
- Use `mockall` for mocking
- Use `insta` for snapshot testing

```bash
cd packages/core
cargo test
cargo tarpaulin --fail-under 85
```

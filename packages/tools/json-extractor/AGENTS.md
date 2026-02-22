# JSON Extractor Tool - AGENTS.md

**Scope:** JSON extraction tool  
**Purpose:** Extract fields from JSON using path syntax

---

## STRUCTURE

```
packages/tools/json-extractor/
├── Cargo.toml              # Library crate (WASM)
├── src/
│   ├── lib.rs             # WASM exports
│   ├── extract.rs         # Extraction logic
│   ├── path.rs            # Path parsing
│   └── format.rs          # Output formatting
└── cli/
    ├── Cargo.toml         # CLI binary crate
    └── main.rs            # CLI entry
```

---

## PATH SYNTAX

| Syntax | Description | Example |
|--------|-------------|---------|
| `key` | Get key value | `data.name` |
| `*` | Wildcard - all keys | `data.*` |
| `[]` | Array iteration | `data.items[]` |
| `[0]` | Array index | `data.items[0]` |
| `..` | Recursive descent | `..id` |

---

## WASM API

```rust
let extractor = JsonExtractor::new();
let result = extractor.extract(json, "data.items[].id")?;
let paths = extractor.detect_paths(json)?;
```

---

## CLI USAGE

```bash
# Extract fields
shard-den extract -p "$.items[*].id" -f csv < input.json

# Detect paths
shard-den detect < input.json

# List available tools
shard-den tools
```

---

## CONVENTIONS

- Library uses `Result<T, JsValue>` for WASM compatibility
- CLI uses `anyhow::Result` for error handling
- Tests in each module's `#[cfg(test)]`

---

## TESTING

```bash
# Library tests
cd packages/tools/json-extractor
cargo test

# CLI tests
cargo test -p shard-den

# Coverage
cargo tarpaulin -p shard-den-json-extractor --fail-under 85
```

---

## DESIGN DOCS

Required before implementation:
- `docs/designs/json-extractor/ui/` - UI原型图
- `docs/designs/json-extractor/flows/` - 功能流程图

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
shard-den json -p "data.items[].id" < input.json
shard-den json -p "id,name,email" -f csv < input.json

# Detect paths
shard-den json --detect < input.json
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
cargo test -p shard-den-json-cli

# Coverage
cargo tarpaulin -p shard-den-json --fail-under 85
```

---

## DESIGN DOCS

Required before implementation:
- `docs/designs/ui/json-extractor/` - UI原型图
- `docs/designs/flows/json-extractor/` - 功能流程图

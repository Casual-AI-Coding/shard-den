# JSON Extractor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现一个完整的 JSON 提取器工具，支持 JSONPath 语法提取、格式化输出，涵盖 CLI → WASM → Web UI → Desktop 全链路。

**Architecture:** 
- CLI 阶段：使用 `jsonpath-rust` 库解析 JSONPath 表达式，实现单值/列表/过滤/递归提取
- WASM 阶段：通过 wasm-bindgen 暴露 Rust 核心功能给前端
- Web 阶段：React + Next.js 实现完整 UI
- Desktop 阶段：Tauri 2.x 嵌入 Web UI，添加本地存储

**Tech Stack:** Rust, wasm-bindgen, Next.js, React, Tauri 2.x

---

## 实现顺序

```
CLI (Rust Core) → WASM → Web UI → Desktop → Tests
```

---

## 阶段 1: CLI (Rust Core)

### Task 1.1: 添加 JSONPath 依赖

**Files:**
- Modify: `packages/tools/json-extractor/Cargo.toml`

**Step 1: 添加依赖**

```toml
[dependencies]
jsonpath-rust = "0.7"
```

**Step 2: 运行测试验证**

Run: `cargo check -p shard-den-json`
Expected: SUCCESS

**Step 3: Commit**

```bash
git add packages/tools/json-extractor/Cargo.toml
git commit -m "chore: add jsonpath-rust dependency"
```

---

### Task 1.2: 实现 JSON 解析和基础提取

**Files:**
- Modify: `packages/tools/json-extractor/src/extract.rs`
- Test: `packages/tools/json-extractor/src/extract.rs`

**Step 1: 写失败的测试**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_simple_path() {
        let json = r#"{"name": "test", "value": 123}"#;
        let result = extract(json, "name");
        assert!(result.is_ok());
        let values: serde_json::Value = serde_json::from_str(&result.unwrap()).unwrap();
        assert_eq!(values, "test");
    }
}
```

**Step 2: 运行测试验证失败**

Run: `cargo test -p shard-den-json test_extract_simple_path`
Expected: FAIL - function extract not found

**Step 3: 最小实现**

```rust
pub fn extract(json: &str, path: &str) -> Result<String> {
    let value: serde_json::Value = serde_json::from_str(json)?;
    let result = JsonPath::try_from(path)
        .map_err(|e| ShardDenError::JsonPath(e.to_string()))?
        .query(&value)
        .value;
    serde_json::to_string(&result).map_err(Into::into)
}
```

**Step 4: 运行测试验证通过**

Run: `cargo test -p shard-den-json test_extract_simple_path`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/tools/json-extractor/src/extract.rs
git commit -m "feat: add JSONPath extraction"
```

---

### Task 1.3: 实现列表提取 [*]

**Files:**
- Modify: `packages/tools/json-extractor/src/extract.rs`

**Step 1: 写失败的测试**

```rust
#[test]
fn test_extract_array_wildcard() {
    let json = r#"{"items": [{"id": 1}, {"id": 2}, {"id": 3}]}"#;
    let result = extract(json, "items[*].id");
    assert!(result.is_ok());
}
```

**Step 2: 运行测试验证失败**

Run: `cargo test -p shard-den-json test_extract_array_wildcard`
Expected: FAIL or wrong result

**Step 3: 最小实现 (jsonpath-rust 已支持)**

**Step 4: 运行测试验证通过**

Run: `cargo test -p shard-den-json test_extract_array_wildcard`
Expected: PASS

**Step 5: Commit**

```bash
git commit -m "feat: support array wildcard extraction"
```

---

### Task 1.4: 实现过滤 [?(@.x)]

**Files:**
- Modify: `packages/tools/json-extractor/src/extract.rs`

**Step 1: 写失败的测试**

```rust
#[test]
fn test_extract_filter() {
    let json = r#"{"items": [{"price": 10}, {"price": 20}, {"price": 30}]}"#;
    let result = extract(json, "items[?(@.price > 15)]");
    assert!(result.is_ok());
}
```

**Step 2: 运行测试验证失败**

Run: `cargo test -p shard-den-json test_extract_filter`

**Step 3: 实现 (jsonpath-rust 已支持)**

**Step 4: 运行测试验证通过**

Run: `cargo test -p shard-den-json test_extract_filter`

**Step 5: Commit**

```bash
git commit -m "feat: support filter expressions"
```

---

### Task 1.5: 实现递归查找 ..

**Files:**
- Modify: `packages/tools/json-extractor/src/extract.rs`

**Step 1: 写失败的测试**

```rust
#[test]
fn test_extract_recursive() {
    let json = r#"{"a": {"id": 1}, "b": {"c": {"id": 2}}}"#;
    let result = extract(json, "..id");
    assert!(result.is_ok());
}
```

**Step 2: 运行测试验证**

**Step 3: 实现**

**Step 4: 运行测试验证**

**Step 5: Commit**

---

### Task 1.6: 实现格式转换 (CSV/Text)

**Files:**
- Modify: `packages/tools/json-extractor/src/format.rs`
- Test: `packages/tools/json-extractor/src/format.rs`

**Step 1: 写失败的测试**

```rust
#[test]
fn test_format_to_csv() {
    let json = r#"[{"id": 1, "name": "a"}, {"id": 2, "name": "b"}]"#;
    let value: serde_json::Value = serde_json::from_str(json).unwrap();
    let formatter = Formatter::new();
    let result = formatter.format(&value, OutputFormat::Csv);
    assert!(result.is_ok());
}
```

**Step 2: 运行测试验证失败**

**Step 3: 最小实现**

```rust
pub fn format(&self, value: &Value, format: OutputFormat) -> Result<String> {
    match format {
        OutputFormat::Json => serde_json::to_string_pretty(value).map_err(Into::into),
        OutputFormat::Csv => self.to_csv(value),
        OutputFormat::Text => self.to_text(value),
    }
}

fn to_csv(&self, value: &Value) -> Result<String> {
    // 实现...
}
```

**Step 4: 运行测试验证**

**Step 5: Commit**

---

### Task 1.7: 实现 CLI 参数

**Files:**
- Modify: `packages/tools/json-extractor/cli/main.rs`

**Step 1: 写失败的测试 (可用性检查)**

```bash
cargo run --package shard-den-json-cli -- --help
# 验证输出包含 --input, --path, --format, --output
```

**Step 2: 实现 CLI 参数解析**

**Step 3: 测试验证**

**Step 4: Commit**

---

## 阶段 2: WASM Bindings

### Task 2.1: 配置 WASM 构建

**Files:**
- Modify: `packages/wasm/Cargo.toml`
- Modify: `packages/wasm/src/lib.rs`

**Step 1: 更新依赖**

```toml
[dependencies]
shard-den-json = { path = "../tools/json-extractor", default-features = false, features = ["wasm"] }
wasm-bindgen = "0.2"
serde-wasm-bindgen = "0.6"
```

**Step 2: 实现 WASM 入口**

```rust
#[wasm_bindgen]
pub fn init() {
    // 初始化
}

#[wasm_bindgen]
pub fn extract(json: &str, paths: &str) -> Result<String, JsValue> {
    shard_den_json::extract(json, paths).map_err(|e| JsValue::from_str(&e.to_string()))
}
```

**Step 3: 构建验证**

Run: `wasm-pack build --target web --out-dir pkg`
Expected: SUCCESS

**Step 4: Commit**

---

## 阶段 3: Web UI

### Task 3.1: 实现 Input 组件

**Files:**
- Modify: `packages/web/src/app/tools/json-extractor/page.tsx`

**Step 1: 写失败的测试**

```typescript
test('renders input textarea', () => {
  render(<JsonExtractorPage />);
  expect(screen.getByPlaceholderText('Paste your JSON')).toBeInTheDocument();
});
```

**Step 2: 实现组件**

**Step 3: 测试验证**

**Step 4: Commit**

---

### Task 3.2: 实现文件导入

**Files:**
- Modify: `packages/web/src/app/tools/json-extractor/page.tsx`

**Step 1: 写测试**

```typescript
test('accepts file drop', async () => {
  const file = new File(['{"test": true}'], 'test.json', { type: 'application/json' });
  // test drag and drop
});
```

**Step 2: 实现**

**Step 3: 测试**

**Step 4: Commit**

---

### Task 3.3: 实现 URL 导入

**Files:**
- Modify: `packages/web/src/app/tools/json-extractor/page.tsx`

**Step 1-5: TDD 循环**

---

### Task 3.4: 实现 Extract 和 Output

**Files:**
- Modify: `packages/web/src/app/tools/json-extractor/page.tsx`

**Step 1-5: TDD 循环**

---

### Task 3.5: 实现右键 Copy JSONPath

**Files:**
- Modify: `packages/web/src/app/tools/json-extractor/page.tsx`

**Step 1: 写测试**

```typescript
test('shows context menu on right click', async () => {
  render(<JsonExtractorPage />);
  const input = screen.getByPlaceholderText('Paste your JSON');
  // simulate right click
  expect(screen.getByText('Copy JSONPath')).toBeInTheDocument();
});
```

**Step 2: 实现**

**Step 3: 测试**

**Step 4: Commit**

---

### Task 3.6: 实现悬浮帮助按钮

**Files:**
- Modify: `packages/web/src/app/tools/json-extractor/page.tsx`

**Step 1-5: TDD 循环**

---

## 阶段 4: Desktop

### Task 4.1: 配置 Tauri 存储

**Files:**
- Modify: `packages/desktop/src-tauri/src/main.rs`

**Step 1: 添加 Tauri 命令**

```rust
#[tauri::command]
fn save_history(entry: HistoryEntry) -> Result<(), String> {
    // 保存到本地文件
}

#[tauri::command]
fn load_history() -> Result<Vec<HistoryEntry>, String> {
    // 从本地文件加载
}
```

**Step 2-5: TDD 循环**

---

## 阶段 5: Tests

### Task 5.1: 达到覆盖率 85%

**Files:**
- 现有测试文件

**Step 1: 运行覆盖率**

Run: `cargo tarpaulin --packages shard-den-core --packages shard-den-json --fail-under 85`

**Step 2: 补充缺失测试**

**Step 3: 验证**

**Step 4: Commit**

---

## 执行选项

**Plan complete and saved to `docs/plans/2026-02-15-json-extractor-implementation.md`. Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**

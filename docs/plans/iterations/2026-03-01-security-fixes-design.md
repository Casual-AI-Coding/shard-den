# ShardDen 安全问题修复设计文档

**文档日期**: 2026-03-01  
**设计目标**: 修复代码审查中发现的 23 个问题 (P0: 2, P1: 7, P2: 7, P3: 7)  
**实施策略**: 按模块分批修复

---

## 目录

1. [概述](#1-概述)
2. [模块修复顺序](#2-模块修复顺序)
3. [Core 模块修复](#3-core-模块修复)
4. [JSON Extractor 模块修复](#4-json-extractor-模块修复)
5. [UML Styler 模块修复](#5-uml-styler-模块修复)
6. [Desktop 模块修复](#6-desktop-模块修复)
7. [WASM 模块修复](#7-wasm-模块修复)
8. [测试策略](#8-测试策略)
9. [实施计划](#9-实施计划)

---

## 1. 概述

### 1.1 问题统计

| 严重性 | 数量 | 描述 |
|--------|------|------|
| **P0 (Critical)** | 2 | 安全漏洞、数据丢失风险 |
| **P1 (High)** | 7 | 逻辑错误、panic 风险、安全问题 |
| **P2 (Medium)** | 7 | 代码质量、架构问题 |
| **P3 (Low)** | 7 | 改进建议 |
| **总计** | 23 | |

### 1.2 修复原则

1. **安全优先**: P0 和 P1 问题必须在第一时间修复
2. **最小侵入**: 尽量不改变公共 API，保持向后兼容
3. **渐进式**: 按模块分批修复，每批完成后可独立测试和合并
4. **测试覆盖**: 每个修复需附带测试，确保问题不再复发

---

## 2. 模块修复顺序

```
Phase 1: Core 模块 (基础层)
  └─ history.rs: panic 防护 + 敏感数据处理
  └─ logger.rs: 初始化防护
  └─ config.rs: 语言检测改进

Phase 2: JSON Extractor 模块 (关键工具)
  └─ DoS 漏洞修复 (文件大小限制)
  └─ 栈溢出防护 (JSON 深度限制)
  └─ 健壮路径解析
  └─ 完整 CSV 转义
  └─ Path 模块 TODO 处理

Phase 3: UML Styler 模块 (功能完整性)
  └─ CLI 完整实现
  └─ render() 方法修复
  └─ Cargo.toml 依赖路径修复
  └─ SRP 重构

Phase 4: Desktop 模块 (安全性)
  └─ CSP 配置
  └─ 错误处理改进
  └─ Shell 权限限制
  └─ 历史大小限制

Phase 5: WASM 模块 (API 一致性)
  └─ 统一错误返回类型
```

---

## 3. Core 模块修复

### 3.1 问题清单

| ID | 严重性 | 文件 | 问题描述 |
|----|--------|------|----------|
| C1 | P1 | history.rs:12 | `SystemTime::now().duration_since(UNIX_EPOCH).unwrap()` 可能 panic |
| C2 | P2 | history.rs:23-24 | 历史记录存储明文敏感数据 |
| C3 | P2 | logger.rs:12,17 | `init()` 多次调用会 panic |
| C4 | P3 | config.rs:65 | 硬编码默认语言 "zh-CN" |

### 3.2 修复设计

#### C1: 时间戳 panic 防护

**现状**: `unwrap()` 在系统时间异常时会 panic

**解决方案**:
```rust
// 修改前
let timestamp = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap()
    .as_millis();

// 修改后
let timestamp = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default()
    .as_millis();
```

**理由**: 即使时间计算失败，返回 0 也比 panic 安全

#### C2: 敏感数据保护

**现状**: HistoryEntry 存储明文 input/output，无敏感数据标记

**解决方案**:
```rust
// history.rs
pub struct HistoryEntry {
    pub id: String,
    pub tool_name: String,
    pub input: String,
    pub output: String,
    pub timestamp: u128,
    pub is_sensitive: bool,  // 新增字段
}

impl HistoryEntry {
    pub fn new(tool_name: &str, input: &str, output: &str, is_sensitive: bool) -> Self {
        Self {
            id: generate_id(),
            tool_name: tool_name.to_string(),
            input: if is_sensitive { Self::obfuscate(input) } else { input.to_string() },
            output: if is_sensitive { Self::obfuscate(output) } else { output.to_string() },
            timestamp: current_timestamp(),
            is_sensitive,
        }
    }
    
    fn obfuscate(data: &str) -> String {
        // 简单 base64 编码（非加密，仅基础混淆）
        BASE64_STANDARD.encode(data.as_bytes())
    }
}
```

#### C3: Logger 初始化防护

**现状**: `init()` 多次调用会导致 panic

**解决方案**:
```rust
// logger.rs
use std::sync::Once;

static LOGGER_INIT: Once = Once::new();

pub fn init() {
    LOGGER_INIT.call_once(|| {
        // 实际初始化逻辑
        log::set_logger(&LOGGER).expect("Logger already set");
    });
}
```

#### C4: 语言检测

**现状**: 硬编码默认语言 "zh-CN"

**解决方案**:
```rust
// config.rs
pub fn default_language() -> String {
    std::env::var("LANG")
        .ok()
        .and_then(|l| l.split('.').next().map(|s| s.to_string()))
        .unwrap_or_else(|| "en-US".to_string())
}
```

---

## 4. JSON Extractor 模块修复

### 4.1 问题清单

| ID | 严重性 | 文件 | 问题描述 |
|----|--------|------|----------|
| J1 | **P0** | cli/main.rs:61 | 文件读取无大小限制 - DoS 漏洞 |
| J2 | **P1** | lib.rs:41,62 | JSON 解析无深度限制 - 栈溢出风险 |
| J3 | P2 | lib.rs:39 | 路径解析不健壮，简单逗号分割 |
| J4 | P2 | format.rs:62-71 | CSV 转义不完整 |
| J5 | P2 | path.rs:26-37 | TODO 未实现 |

### 4.2 修复设计

#### J1: 文件大小限制

**现状**: `read_to_string` 读取整个文件到内存，无大小限制

**解决方案**:
```rust
// error.rs
pub enum JsonExtractorError {
    // ...
    FileTooLarge { size: u64, max: u64 },
}

// cli/main.rs
const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024; // 10MB

fn read_file_safe(path: &Path) -> Result<String, JsonExtractorError> {
    let metadata = std::fs::metadata(path)?;
    
    if metadata.len() > MAX_FILE_SIZE {
        return Err(JsonExtractorError::FileTooLarge {
            size: metadata.len(),
            max: MAX_FILE_SIZE,
        });
    }
    
    std::fs::read_to_string(path)
        .map_err(|e| JsonExtractorError::IoError(e))
}
```

#### J2: JSON 深度限制

**现状**: JSON 解析无深度限制，可能导致栈溢出

**解决方案**:
```rust
// serde_json 默认限制递归深度为 128，我们显式验证
use serde::Deserialize;
use serde_json::Value;

const MAX_JSON_DEPTH: usize = 128;

fn check_json_depth(value: &Value, depth: usize) -> Result<(), JsonExtractorError> {
    if depth > MAX_JSON_DEPTH {
        return Err(JsonExtractorError::JsonTooDeep);
    }
    
    match value {
        Value::Array(arr) => {
            for item in arr {
                check_json_depth(item, depth + 1)?;
            }
        }
        Value::Object(obj) => {
            for (_, v) in obj {
                check_json_depth(v, depth + 1)?;
            }
        }
        _ => {}
    }
    Ok(())
}

// 在 parse_json 中调用
pub fn parse_json(input: &str) -> Result<Value, JsonExtractorError> {
    let value: Value = serde_json::from_str(input)
        .map_err(|e| JsonExtractorError::ParseError(e.to_string()))?;
    check_json_depth(&value, 0)?;
    Ok(value)
}
```

#### J3: 健壮路径解析

**现状**: 简单逗号分割，未处理转义或引号内逗号

**解决方案**:
```rust
pub fn parse_paths(input: &str) -> Vec<String> {
    let mut paths = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    let mut escape_next = false;
    
    for ch in input.chars() {
        match (ch, escape_next, in_quotes) {
            ('\\', false, _) => escape_next = true,
            ('"', false, _) => in_quotes = !in_quotes,
            (',', false, false) => {
                if !current.is_empty() {
                    paths.push(current.trim().to_string());
                    current.clear();
                }
            }
            _ => {
                current.push(ch);
                escape_next = false;
            }
        }
    }
    
    if !current.is_empty() {
        paths.push(current.trim().to_string());
    }
    
    paths
}
```

#### J4: 完整 CSV 转义

**现状**: 未处理字段中的逗号、引号、换行符

**解决方案**:
```rust
fn escape_csv_field(field: &str) -> String {
    // RFC 4180 标准转义
    if field.contains(',') || field.contains('"') || field.contains('\n') || field.contains('\r') {
        format!("\"{}\"", field.replace('"', "\"\""))
    } else {
        field.to_string()
    }
}
```

#### J5: Path 模块 TODO

**解决方案**:
```rust
// 标记为不稳定 API
#[doc(hidden)]
#[deprecated(since = "0.1.1", note = "Not yet implemented")]
pub fn parse(_paths: &[String]) -> Vec<JsonPath> {
    Vec::new()
}
```

---

## 5. UML Styler 模块修复

### 5.1 问题清单

| ID | 严重性 | 文件 | 问题描述 |
|----|--------|------|----------|
| U1 | **P1** | cli/main.rs | CLI 完全不可用 |
| U2 | **P1** | engine/mermaid.rs | render() 不工作 |
| U3 | **P1** | cli/Cargo.toml | 依赖路径错误 |
| U4 | P2 | theme/mod.rs | 违反 SRP |
| U5 | P3 | engine/mermaid.rs | 字符串分配效率低 |

### 5.2 修复设计

#### U1+U2: CLI 完整实现

**CLI 设计**:
```rust
use clap::{Parser, Subcommand};
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "uml-styler")]
#[command(about = "Style UML diagrams using various engines")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Style a diagram file
    Style {
        /// Input file path
        #[arg(short, long)]
        input: PathBuf,
        
        /// Output file path (optional)
        #[arg(short, long)]
        output: Option<PathBuf>,
        
        /// Theme name
        #[arg(short, long, default_value = "default")]
        theme: String,
        
        /// Output format
        #[arg(short, long, default_value = "svg")]
        format: String,
        
        /// Engine type (mermaid, plantuml)
        #[arg(short, long, default_value = "mermaid")]
        engine: String,
    },
    
    /// List available themes
    Themes,
    
    /// List available engines
    Engines,
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    
    match cli.command {
        Commands::Style { input, output, theme, format, engine } => {
            let code = std::fs::read_to_string(&input)?;
            let styled = style_diagram(&code, &engine, &theme, &format)?;
            
            match output {
                Some(path) => std::fs::write(path, styled)?,
                None => println!("{}", styled),
            }
        }
        Commands::Themes => list_themes(),
        Commands::Engines => list_engines(),
    }
    
    Ok(())
}
```

**render() 实现**:
```rust
// engine/mermaid.rs
impl MermaidEngine {
    pub fn render(&self, code: &str, theme: &Theme) -> Result<String, UmlStylerError> {
        let diagram_type = self.detect_diagram_type(code)?;
        let styled_code = self.apply_theme(code, theme)?;
        
        // 调用 Mermaid CLI 或使用内置渲染
        let output = if cfg!(feature = "mermaid-cli") {
            self.render_with_cli(&styled_code)?
        } else {
            self.render_with_wasm(&styled_code)?
        };
        
        Ok(output)
    }
}
```

#### U3: Cargo.toml 修复

```toml
# cli/Cargo.toml
[dependencies]
shard-den-core = { path = "../../core" }
shard-den-uml-styler = { path = ".." }
clap = { version = "4.0", features = ["derive"] }
anyhow = "1.0"
```

#### U4: SRP 重构

```rust
// theme/data.rs
pub struct ThemeData {
    pub name: String,
    pub colors: ColorScheme,
    pub fonts: FontScheme,
}

// theme/transformer.rs
pub struct ThemeTransformer {
    theme: ThemeData,
}

impl ThemeTransformer {
    pub fn new(theme: ThemeData) -> Self {
        Self { theme }
    }
    
    pub fn apply_to_css(&self, css: &str) -> String {
        // 实现主题应用到 CSS
    }
    
    pub fn apply_to_svg(&self, svg: &str) -> String {
        // 实现主题应用到 SVG
    }
}

// theme/mod.rs
pub use data::ThemeData;
pub use transformer::ThemeTransformer;
```

---

## 6. Desktop 模块修复

### 6.1 问题清单

| ID | 严重性 | 文件 | 问题描述 |
|----|--------|------|----------|
| D1 | **P0** | tauri.conf.json:24 | CSP 完全禁用 |
| D2 | **P1** | lib.rs:33 | `.expect()` 可导致应用崩溃 |
| D3 | **P1** | storage.rs:115 | Default impl 中 expect() |
| D4 | P2 | commands.rs | 错误信息泄露 |
| D5 | P2 | tauri.conf.json | shell 权限过宽 |
| D6 | P2 | storage.rs | 无历史大小限制 |

### 6.2 修复设计

#### D1: CSP 配置

```json
{
  "security": {
    "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self';"
  }
}
```

#### D2: 错误处理改进

```rust
// lib.rs
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            initialize_app(app)
                .map_err(|e| {
                    eprintln!("Application initialization failed: {}", e);
                    std::process::exit(1);
                })
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn initialize_app(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // 初始化存储
    let storage = storage::HistoryStorage::new(app)?;
    app.manage(storage);
    
    // 其他初始化...
    Ok(())
}
```

#### D3: 存储初始化

```rust
// storage.rs
impl HistoryStorage {
    pub fn new(app: &tauri::AppHandle) -> Result<Self, StorageError> {
        let dir = app.path_resolver()
            .app_data_dir()
            .ok_or(StorageError::DataDirNotFound)?
            .join("history");
            
        std::fs::create_dir_all(&dir)?;
        
        Ok(Self { dir })
    }
    
    /// 提供默认实现，失败时返回内存存储
    pub fn new_or_memory(app: &tauri::AppHandle) -> Box<dyn HistoryStorageTrait> {
        match Self::new(app) {
            Ok(storage) => Box::new(storage),
            Err(_) => Box::new(InMemoryStorage::new()),
        }
    }
}
```

#### D4: 错误消息处理

```rust
// commands.rs
#[tauri::command]
pub fn get_history(
    storage: State<'_, Box<dyn HistoryStorageTrait>>,
) -> Result<Vec<HistoryEntry>, String> {
    storage.get_history()
        .map_err(|_| "无法读取历史记录，请稍后重试".to_string())
}

#[tauri::command]
pub fn add_history(
    storage: State<'_, Box<dyn HistoryStorageTrait>>,
    entry: HistoryEntry,
) -> Result<(), String> {
    storage.add_entry(entry)
        .map_err(|_| "保存历史记录失败".to_string())
}
```

#### D5: Shell 权限限制

```json
{
  "permissions": [
    "core:default",
    {
      "identifier": "shell:allow-open",
      "allow": [
        { "path": "$RESOURCE/**" },
        { "url": "https://shard-den.app/**" },
        { "url": "https://github.com/shard-den/**" }
      ]
    }
  ]
}
```

#### D6: 历史大小限制

```rust
const MAX_HISTORY_ENTRIES: usize = 1000;
const MAX_HISTORY_FILE_SIZE: u64 = 10 * 1024 * 1024; // 10MB

impl HistoryStorage {
    pub fn add_entry(&mut self, entry: HistoryEntry) -> Result<(), StorageError> {
        let mut entries = self.load()?;
        entries.push(entry);
        
        // 限制条目数量
        if entries.len() > MAX_HISTORY_ENTRIES {
            entries = entries.into_iter()
                .rev()
                .take(MAX_HISTORY_ENTRIES)
                .collect::<Vec<_>>()
                .into_iter()
                .rev()
                .collect();
        }
        
        // 限制文件大小
        let json = serde_json::to_string(&entries)?;
        if json.len() as u64 > MAX_HISTORY_FILE_SIZE {
            // 移除最旧的条目直到符合大小限制
            while json.len() as u64 > MAX_HISTORY_FILE_SIZE && !entries.is_empty() {
                entries.remove(0);
            }
        }
        
        self.save(&entries)
    }
}
```

---

## 7. WASM 模块修复

### 7.1 问题清单

| ID | 严重性 | 文件 | 问题描述 |
|----|--------|------|----------|
| W1 | P3 | lib.rs | API 不一致，部分返回 String 而非 Result |

### 7.2 修复设计

```rust
// lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn version() -> Result<String, JsValue> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

#[wasm_bindgen]
pub fn ping() -> Result<String, JsValue> {
    Ok("pong".to_string())
}

// 错误转换统一处理
impl From<JsonExtractorError> for JsValue {
    fn from(err: JsonExtractorError) -> Self {
        JsValue::from_str(&format!("Error: {}", err))
    }
}

impl From<UmlStylerError> for JsValue {
    fn from(err: UmlStylerError) -> Self {
        JsValue::from_str(&format!("Error: {}", err))
    }
}
```

---

## 8. 测试策略

### 8.1 单元测试

每个修复需附带单元测试:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_file_size_limit() {
        // 测试大文件拒绝
        let large_content = "x".repeat(11 * 1024 * 1024);
        let result = read_file_safe(...);
        assert!(matches!(result, Err(JsonExtractorError::FileTooLarge { .. })));
    }
    
    #[test]
    fn test_json_depth_limit() {
        // 测试深层 JSON 拒绝
        let deep_json = "[{".repeat(200) + "]".repeat(200);
        let result = parse_json(&deep_json);
        assert!(matches!(result, Err(JsonExtractorError::JsonTooDeep)));
    }
    
    #[test]
    fn test_csv_escaping() {
        assert_eq!(escape_csv_field("hello"), "hello");
        assert_eq!(escape_csv_field("hello,world"), "\"hello,world\"");
        assert_eq!(escape_csv_field("hello\"world"), "\"hello\"\"world\"");
    }
}
```

### 8.2 集成测试

```rust
#[test]
fn test_cli_file_processing() {
    // 创建临时大文件
    // 运行 CLI
    // 验证返回错误
}
```

### 8.3 安全测试

- **DoS 测试**: 使用超大文件和深层 JSON 测试拒绝行为
- **CSP 测试**: 验证 Tauri 应用 CSP 生效
- **输入验证测试**: 测试各种恶意输入的处理

---

## 9. 实施计划

### Phase 1: Core 模块 (预计 2 小时)

| 任务 | 文件 | 验收标准 |
|------|------|----------|
| 时间戳 panic 防护 | history.rs | `unwrap_or_default()` 使用正确，测试通过 |
| 敏感数据标记 | history.rs | HistoryEntry 新增 is_sensitive 字段，数据编码正确 |
| Logger 初始化防护 | logger.rs | 多次调用 init() 不 panic |
| 语言检测 | config.rs | 从环境变量读取语言 |

### Phase 2: JSON Extractor 模块 (预计 3 小时)

| 任务 | 文件 | 验收标准 |
|------|------|----------|
| 文件大小限制 | cli/main.rs, error.rs | >10MB 文件被拒绝，返回 FileTooLarge 错误 |
| JSON 深度限制 | lib.rs | >128 层嵌套被拒绝 |
| 健壮路径解析 | lib.rs | 支持引号内逗号、转义字符 |
| CSV 转义 | format.rs | RFC 4180 标准转义 |
| Path 模块标记 | path.rs | API 标记为 deprecated 或隐藏 |

### Phase 3: UML Styler 模块 (预计 4 小时)

| 任务 | 文件 | 验收标准 |
|------|------|----------|
| CLI 实现 | cli/main.rs | 完整 CLI 功能，支持 style/themes/engines |
| render() 实现 | engine/mermaid.rs | 实际渲染逻辑 |
| 依赖路径修复 | cli/Cargo.toml | 路径正确，编译通过 |
| SRP 重构 | theme/ | 拆分为 data.rs 和 transformer.rs |

### Phase 4: Desktop 模块 (预计 3 小时)

| 任务 | 文件 | 验收标准 |
|------|------|----------|
| CSP 配置 | tauri.conf.json | 严格 CSP 配置，应用正常启动 |
| 错误处理改进 | lib.rs | WASM 初始化失败时优雅退出 |
| 存储初始化 | storage.rs | 返回 Result，提供内存存储 fallback |
| 错误消息 | commands.rs | 用户友好的错误消息 |
| Shell 权限 | tauri.conf.json | 限制允许的 URL 和路径 |
| 历史限制 | storage.rs | 限制条目数和文件大小 |

### Phase 5: WASM 模块 (预计 1 小时)

| 任务 | 文件 | 验收标准 |
|------|------|----------|
| API 一致性 | lib.rs | 统一返回 Result |
| 错误转换 | lib.rs | From 实现正确 |

---

## 风险与回滚策略

### 风险识别

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| CSP 过严导致功能失效 | 中 | 高 | 逐步收紧，测试所有功能 |
| 文件大小限制影响正常用例 | 低 | 中 | 设置合理的 10MB 限制 |
| API 变更破坏兼容性 | 低 | 高 | 保持公共 API 不变 |

### 回滚策略

1. 每个 PR 独立，可单独回滚
2. 使用 feature flag 控制新行为 (如 CSP 配置)
3. 保留旧版实现作为 fallback

---

**文档版本**: 1.0  
**下次审查**: 实施完成后  
**责任人**: [待指定]

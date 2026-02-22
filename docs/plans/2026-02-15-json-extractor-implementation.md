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

## 阶段 5: UI Redesign (Web + Desktop)

> **参考文档:**
> - 主设计: `docs/plans/2026-02-15-shard-den-architecture-design.md` (Section 11: UI Design)
> - JSON Extractor: `docs/designs/ui/json-extractor/prototype.md`

### Task 5.1: 设置主题系统 (CSS Variables + ThemeProvider)

**Goal:** 实现三主题支持 (Light/Dark/Tech) + 系统跟随 (仅 Desktop)

**Files:**
- Modify: `packages/web/src/styles/globals.css`
- Create: `packages/web/src/components/ThemeProvider.tsx`
- Create: `packages/web/src/hooks/useTheme.ts`
- Create: `packages/web/src/components/ui/ThemeToggle.tsx`

**Step 1: 添加 CSS 变量**

```css
/* globals.css */
@theme {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-text: var(--text);
  --color-text-secondary: var(--text-secondary);
  --color-accent: var(--accent);
}

/* Light Theme */
.theme-light {
  --bg: #FFFFFF;
  --surface: #F8FAFC;
  --text: #0F172A;
  --text-secondary: #475569;
  --accent: #22C55E;
}

/* Dark Theme */
.theme-dark {
  --bg: #0F172A;
  --surface: #1E293B;
  --text: #F8FAFC;
  --text-secondary: #94A3B8;
  --accent: #22C55E;
}

/* Tech Theme */
.theme-tech {
  --bg: #0A0A0A;
  --surface: #141414;
  --text: #00FF00;
  --text-secondary: #00AA00;
  --accent: #00FF00;
}
```

**Step 2: 创建 ThemeProvider**

```typescript
// components/ThemeProvider.tsx
'use client';
import { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'tech';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  
  useEffect(() => {
    document.documentElement.className = `theme-${theme}`;
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

**Step 3: 更新 layout.tsx 包裹 ThemeProvider**

**Step 4: 创建 ThemeToggle 组件**

**Step 5: Commit**

```bash
git add packages/web/src/styles/globals.css packages/web/src/components/ThemeProvider.tsx
git commit -m "feat: add theme system with CSS variables"
```

---

### Task 5.2: 创建布局组件 (Sidebar + Header)

**Goal:** 实现整体布局：侧边栏 + 主内容区，支持 Web/Desktop 差异

**Files:**
- Create: `packages/web/src/components/Sidebar.tsx`
- Create: `packages/web/src/components/Header.tsx`
- Modify: `packages/web/src/app/layout.tsx`

**Step 1: 创建 Sidebar 组件**

```typescript
// components/Sidebar.tsx
'use client';
import Link from 'next/link';

const tools = [
  { name: 'JSON 提取器', path: '/tools/json-extractor', icon: '...' },
  // Future tools...
];

export function Sidebar({ isDesktop = false }: { isDesktop?: boolean }) {
  return (
    <aside className="w-64 bg-[var(--surface)] border-r border-slate-800">
      {/* Tool List */}
      <nav className="p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">工具</h3>
        <ul className="space-y-1">
          {tools.map(tool => (
            <li key={tool.path}>
              <Link href={tool.path} className="...">{tool.name}</Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Desktop Only: Favorites & History */}
      {isDesktop && (
        <>
          <div className="border-t border-slate-800 p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">收藏</h3>
          </div>
          <div className="border-t border-slate-800 p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">历史</h3>
          </div>
        </>
      )}
    </aside>
  );
}
```

**Step 2: 创建 Header 组件**

```typescript
// components/Header.tsx
'use client';
import { ThemeToggle } from './ui/ThemeToggle';

export function Header({ title, showSettings = false }: { title: string; showSettings?: boolean }) {
  return (
    <header className="h-14 bg-[var(--surface)] border-b border-slate-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-[var(--text)]">{title}</h1>
        {/* Help Button - to be added in Task 6.3 */}
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {showSettings && <button>⚙️</button>}
      </div>
    </header>
  );
}
```

**Step 3: 更新 layout.tsx**

**Step 4: Commit**

```bash
git add packages/web/src/components/Sidebar.tsx packages/web/src/components/Header.tsx
git commit -m "feat: add layout components (Sidebar, Header)"
```

---

### Task 5.3: 重构 JSON Extractor 页面

**Goal:** 按照设计文档实现新布局：左右两块 + 帮助按钮

**Files:**
- Modify: `packages/web/src/app/tools/json-extractor/page.tsx`

**Step 1: 更新页面布局**

```typescript
// 新的布局结构
export default function JsonExtractorPage() {
  return (
    <div className="flex h-full">
      <Sidebar /> {/* 工具列表 */}
      <div className="flex-1 flex flex-col">
        <Header title="JSON 提取器" showSettings={isDesktop} />
        <main className="flex-1 p-6">
          {/* 左右两块布局 */}
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* 左侧：输入 */}
            <div className="space-y-4">
              {/* JSON 输入区 */}
              {/* JSONPath 输入框 */}
              {/* 提取/清空按钮 */}
            </div>
            {/* 右侧：输出 */}
            <div className="space-y-4">
              {/* 输出区域 */}
              {/* 格式选择器 */}
              {/* 复制/下载按钮 */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
```

**Step 2: 添加帮助按钮 (Hover Tooltip)**

```typescript
// 在 Header 标题旁边
<Header title="JSON 提取器">
  <HelpButton content={[
    { code: 'key', desc: '获取对象属性' },
    { code: '*', desc: '通配符' },
    { code: '[0]', desc: '数组索引' },
    { code: '..', desc: '递归下降' },
  ]} />
</Header>
```

**Step 3: Commit**

```bash
git commit -m "refactor: redesign JSON extractor page with new layout"
```

---

### Task 5.4: 处理 Web/Desktop 差异

**Goal:** 根据环境显示/隐藏特定功能

**Files:**
- Modify: `packages/web/src/app/layout.tsx`
- Create: `packages/web/src/lib/platform.ts`

**Step 1: 检测平台**

```typescript
// lib/platform.ts
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
```

**Step 2: 条件渲染**

```typescript
// layout.tsx
const isDesktop = typeof window !== 'undefined' && '__TAURI__' in window;

return (
  <div className="flex h-screen">
    <Sidebar isDesktop={isDesktop} />
    {children}
  </div>
);
```

**Step 3: Commit**

```bash
git commit -m "feat: handle Web/Desktop platform differences"
```

---

### Task 5.5: 验证和测试

**Step 1: 运行开发服务器**

```bash
cd packages/web
npm run dev
```

**Step 2: 验证布局**

- [ ] Sidebar 显示工具列表
- [ ] 主题切换正常工作 (Light/Dark/Tech)
- [ ] JSON Extractor 页面左右布局正确
- [ ] 帮助按钮 Hover 显示语法提示
- [ ] Web 端隐藏收藏/历史/设置

**Step 3: 运行测试**

```bash
npm run test
npm run test:coverage
```

**Step 4: Commit**

```bash
git commit -m "test: add UI tests and verify coverage"
```

---

## 实现完成检查清单

- [ ] ThemeProvider + CSS 变量主题系统
- [ ] Sidebar 组件 (工具列表)
- [ ] Header 组件 (标题 + 帮助按钮 + 主题切换)
- [ ] JSON Extractor 页面左右两块布局
- [ ] 帮助按钮 Hover 显示语法提示
- [ ] 平台检测 (Web vs Desktop)
- [ ] Web 端隐藏收藏/历史/设置
- [ ] 测试覆盖率 ≥ 85%

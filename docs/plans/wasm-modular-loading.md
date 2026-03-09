# WASM 模块化加载设计

> 设计版本: v0.3.4  
> 状态: 设计阶段  
> 目标: 将单 WASM 文件拆分为按需加载的模块

---

## 背景

### 当前架构

```
Single WASM (5MB)
├── JsonExtractor
├── UmlStyler (Mermaid, D2, Graphviz, WaveDrom)
└── Utils
```

**问题**: 用户只需要 JSON Extractor 时，仍需下载整个 5MB WASM 文件。

### 目标架构

```
Core WASM (500KB)
├── Utils
├── Version
└── Loader API

Tool Modules (按需加载)
├── json-extractor.wasm (1MB)
├── uml-styler.wasm (3MB)
│   ├── mermaid-engine.wasm (1MB)
│   ├── d2-engine.wasm (500KB)
│   └── ...
└── future-tools.wasm
```

---

## 技术方案

### 方案 1: 多 WASM 文件（推荐）

**实现方式**:
- 每个工具独立编译为 `.wasm` 文件
- 通过动态 `import()` 按需加载
- Core WASM 提供加载管理器

**优点**:
- 完全按需加载
- 各模块可独立更新
- 并行加载支持

**缺点**:
- 实现复杂度高
- 需要重构当前架构
- 模块间通信成本

### 方案 2: WASM 代码分割（实验性）

**实现方式**:
- 使用 `wasm-split` 工具分割单 WASM
- 运行时按需加载分割段

**优点**:
- 无需重构代码结构
- 自动分割

**缺点**:
- 工具链不成熟
- 调试困难

---

## 推荐方案: 多 WASM 文件

### 架构设计

```typescript
// packages/wasm/src/lib.rs
// 改为多 crate workspace

// packages/wasm/core/src/lib.rs
// Core WASM - 必须首先加载
#[wasm_bindgen]
pub struct WasmLoader {
    modules: HashMap<String, Module>,
}

#[wasm_bindgen]
impl WasmLoader {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self { ... }
    
    // 异步加载模块
    pub async fn load_module(&mut self, name: &str, url: &str) -> Result<(), JsValue>;
    
    // 获取模块实例
    pub fn get_module(&self, name: &str) -> Option<&Module>;
}

// packages/wasm/json-extractor/src/lib.rs
// 独立 crate，编译为 json-extractor.wasm
#[wasm_bindgen]
pub struct JsonExtractor { ... }

// packages/wasm/uml-styler/src/lib.rs
// 独立 crate，编译为 uml-styler.wasm
#[wasm_bindgen]
pub struct UmlStyler { ... }
```

### 加载流程

```typescript
// packages/web/src/lib/wasm-loader.ts

interface WasmModule {
  name: string;
  url: string;
  size: number;
  loaded: boolean;
}

class WasmLoader {
  private modules: Map<string, WebAssembly.Module> = new Map();
  private loading: Map<string, Promise<void>> = new Map();

  // 预加载核心模块
  async init(): Promise<void> {
    await this.loadCore();
  }

  // 按需加载工具模块
  async loadTool(name: string): Promise<any> {
    if (this.modules.has(name)) {
      return this.modules.get(name);
    }

    // 检查是否正在加载
    if (this.loading.has(name)) {
      await this.loading.get(name);
      return this.modules.get(name);
    }

    // 开始加载
    const loadPromise = this.doLoad(name);
    this.loading.set(name, loadPromise);
    await loadPromise;
    
    return this.modules.get(name);
  }

  private async doLoad(name: string): Promise<void> {
    const url = `/wasm/${name}.wasm`;
    const response = await fetch(url);
    const bytes = await response.arrayBuffer();
    const module = await WebAssembly.instantiate(bytes);
    this.modules.set(name, module);
  }

  // 预加载特定模块
  async preload(modules: string[]): Promise<void> {
    await Promise.all(modules.map(m => this.loadTool(m)));
  }

  // 获取加载进度
  getProgress(): { loaded: number; total: number } {
    return {
      loaded: this.modules.size,
      total: this.modules.size + this.loading.size,
    };
  }
}

export const wasmLoader = new WasmLoader();
```

### 使用方式

```typescript
// 页面初始化时只加载 Core
await wasmLoader.init();

// 进入工具页面时按需加载
// JSON Extractor 页面
async function useJsonExtractor() {
  const JsonExtractor = await wasmLoader.loadTool('json-extractor');
  const extractor = new JsonExtractor();
  return extractor.extract(json, paths, format);
}

// UML Styler 页面
async function useUmlStyler() {
  const UmlStyler = await wasmLoader.loadTool('uml-styler');
  const styler = new UmlStyler();
  return styler.render(engine, code, theme);
}
```

---

## 实施计划

### Phase 1: 基础设施 (v0.3.4)

- [ ] 创建 `packages/wasm/core` crate
- [ ] 实现 WasmLoader 基础功能
- [ ] 创建加载管理器 TypeScript 代码
- [ ] 更新构建脚本支持多 WASM 输出

### Phase 2: 工具分离 (v0.3.5)

- [ ] 将 `json-extractor` 拆分为独立 WASM
- [ ] 将 `uml-styler` 拆分为独立 WASM
- [ ] 更新前端代码使用新的加载方式
- [ ] 添加加载状态 UI

### Phase 3: 优化 (v0.3.6)

- [ ] 实现预加载策略
- [ ] 添加缓存机制
- [ ] 压缩单个 WASM 文件
- [ ] 性能测试和优化

---

## 预期收益

### 加载优化

| 场景 | 当前 | 优化后 | 收益 |
|------|------|--------|------|
| 首屏加载 | 5MB | 500KB | **-90%** |
| 使用 JSON Extractor | 5MB | 1.5MB | **-70%** |
| 使用 UML Styler | 5MB | 3.5MB | **-30%** |

### 缓存优化

- 各模块独立缓存
- 更新时只需下载变更的模块
- 版本管理更灵活

---

## 风险与缓解

### 风险 1: 实现复杂度高

**缓解**:
- 保持向后兼容（单 WASM 模式）
- 分阶段实施
- 充分测试

### 风险 2: 模块间通信成本

**缓解**:
- Core WASM 提供共享内存
- 使用序列化通信（JSON/MsgPack）
- 避免频繁跨模块调用

### 风险 3: 加载延迟感知

**缓解**:
- 添加加载进度条
- 预加载预测需要的模块
- 骨架屏占位

---

## 参考实现

```bash
# 新的构建流程
./scripts/build-wasm.sh
├── core.wasm (500KB)
├── json-extractor.wasm (1MB)
└── uml-styler.wasm (3MB)

# 前端使用
import { wasmLoader } from '@/lib/wasm-loader';

// 初始化
await wasmLoader.init();

// 按需加载
const tool = await wasmLoader.loadTool('json-extractor');
```

---

## 决策记录

**决策**: 采用多 WASM 文件方案  
**理由**:
1. 最符合按需加载目标
2. 技术成熟度高
3. 长期维护性好
4. 可逐步迁移

**替代方案**:
- ~~单 WASM 代码分割~~ - 工具链不成熟
- ~~WASM 动态链接~~ - 浏览器支持有限

---

**状态**: 设计完成，等待实施  
**负责人**: TBD  
**预计工时**: 3-5 天

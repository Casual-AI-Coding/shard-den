# 安全问题修复任务清单

**计划名称**: 2026-03-01-security-fixes-design  
**创建日期**: 2026-03-01  
**版本**: 1.0  
**状态**: 进行中

---

## 任务总览

| Phase | 模块 | 任务数 | 状态 |
|-------|------|--------|------|
| Phase 1 | Core 模块 | 5 | 🔄 进行中 |
| Phase 2 | JSON Extractor 模块 | 4 | ⏳ 待开始 |
| Phase 3 | UML Styler 模块 | 4 | ⏳ 待开始 |
| Phase 4 | Desktop 模块 | 6 | ⏳ 待开始 |
| Phase 5 | WASM 模块 | 2 | ⏳ 待开始 |
| **总计** | | **21** | |

---

## Phase 1: Core 模块

### 任务列表

| # | ID | 任务名称 | 文件 | 严重性 | 状态 | SubAgent | 提交 |
|---|-----|----------|------|--------|------|----------|------|
| 1 | C1 | 时间戳 panic 防护 | packages/core/src/history.rs | P3 | ✅ 完成 | subagent-1 | 0a9f900 |
| 2 | C2 | Default impl panic 防护 | N/A | P2 | ⏭️ 跳过* | - | - |
| 3 | C3 | 敏感数据保护 | packages/core/src/history.rs | P2 | ✅ 完成 | subagent-3 | fa8fd52 |
| 4 | C4 | Logger 初始化防护 | packages/core/src/logger.rs | P2 | ⏳ | - | - |
| 5 | C5 | 语言检测 | packages/core/src/config.rs | P3 | ⏳ | - | - |

> * C2 跳过 - 设计文档错误，core 模块中不存在 expect() 问题

### 验收标准
- [x] C1: `map()` + `unwrap_or(0)` 使用正确，测试通过
- [x] C3: HistoryEntry 新增 is_sensitive 字段，数据编码正确

---

## Phase 2: JSON Extractor 模块

### 任务列表

| # | ID | 任务名称 | 文件 | 严重性 | 状态 | SubAgent | 提交 |
|---|-----|----------|------|--------|------|----------|------|
| 6 | J1 | 文件大小限制 | packages/tools/json-extractor/src/cli/main.rs, error.rs | P0 | ⏳ | - | - |
| 7 | J2 | JSON 深度限制 | packages/tools/json-extractor/src/lib.rs | P1 | ⏳ | - | - |
| 8 | J3 | 健壮路径解析 | packages/tools/json-extractor/src/lib.rs | P2 | ⏳ | - | - |
| 9 | J4 | Path 模块标记 | packages/tools/json-extractor/src/path.rs | P2 | ⏳ | - | - |

### 验收标准
- [ ] J1: >10MB 文件被拒绝，返回 FileTooLarge 错误
- [ ] J2: >128 层嵌套被拒绝
- [ ] J3: 支持引号内逗号、转义字符
- [ ] J4: API 标记为 deprecated 或隐藏

---

## Phase 3: UML Styler 模块

### 任务列表

| # | ID | 任务名称 | 文件 | 严重性 | 状态 | SubAgent | 提交 |
|---|-----|----------|------|--------|------|----------|------|
| 10 | U1 | CLI 实现 | packages/tools/uml-styler/cli/main.rs | P1 | ⏳ | - | - |
| 11 | U2 | render() 实现 | packages/tools/uml-styler/src/engine/mermaid.rs | P1 | ⏳ | - | - |
| 12 | U3 | 依赖路径修复 | packages/tools/uml-styler/cli/Cargo.toml | P1 | ⏳ | - | - |
| 13 | U4 | SRP 重构 | packages/tools/uml-styler/src/theme/ | P2 | ⏳ | - | - |

### 验收标准
- [ ] U1: 完整 CLI 功能，支持 style/themes/engines
- [ ] U2: 实际渲染逻辑
- [ ] U3: 路径正确，编译通过
- [ ] U4: 拆分为 data.rs 和 transformer.rs

---

## Phase 4: Desktop 模块

### 任务列表

| # | ID | 任务名称 | 文件 | 严重性 | 状态 | SubAgent | 提交 |
|---|-----|----------|------|--------|------|----------|------|
| 14 | D1 | CSP 配置 | packages/desktop/src-tauri/tauri.conf.json | P0 | ⏳ | - | - |
| 15 | D2 | 错误处理改进 | packages/desktop/src/lib.rs | P1 | ⏳ | - | - |
| 16 | D3 | 存储初始化 | packages/desktop/src/storage.rs | P1 | ⏳ | - | - |
| 17 | D4 | 错误消息 | packages/desktop/src/commands.rs | P2 | ⏳ | - | - |
| 18 | D5 | Shell 权限 | packages/desktop/src-tauri/tauri.conf.json | P2 | ⏳ | - | - |
| 19 | D6 | 历史限制 | packages/desktop/src/storage.rs | P2 | ⏳ | - | - |

### 验收标准
- [ ] D1: 严格 CSP 配置，应用正常启动
- [ ] D2: WASM 初始化失败时优雅退出
- [ ] D3: 返回 Result，提供内存存储 fallback
- [ ] D4: 用户友好的错误消息
- [ ] D5: 限制允许的 URL 和路径
- [ ] D6: 限制条目数和文件大小

---

## Phase 5: WASM 模块

### 任务列表

| # | ID | 任务名称 | 文件 | 严重性 | 状态 | SubAgent | 提交 |
|---|-----|----------|------|--------|------|----------|------|
| 20 | W1 | API 一致性 | packages/wasm/src/lib.rs | P3 | ⏳ | - | - |
| 21 | W2 | 错误转换 | packages/wasm/src/lib.rs | P3 | ⏳ | - | - |

### 验收标准
- [ ] W1: 统一返回 Result
- [ ] W2: From 实现正确

---

## 实施规则

1. **SubAgent 管理**: 每个任务由一个 SubAgent 独立完成
2. **提交要求**: 任务完成后必须提交 Git commit
3. **Review 流程**: 
   - SubAgent 完成 → 我进行 Code Review
   - Review 通过 → 任务标记为 ✅ 完成
   - Review 失败 → SubAgent 修复问题 → 再次 Review
4. **优先级**: P0 > P1 > P2 > P3

---

## 进度记录

| 日期 | 完成任务 | SubAgent | 备注 |
|------|----------|----------|------|
| 2026-03-01 | C1, C3 | subagent-1, subagent-3 | Phase 1 完成 2/5 |

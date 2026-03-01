# 版本管理规范

本文档定义 ShardDen 项目的版本管理策略，确保所有版本信息一致同步。

---

## 版本源

**唯一真实源**: `Cargo.toml` (workspace)

```toml
[workspace.package]
version = "0.2.3"
```

所有其他版本的变更都应该从它派生或同步。

---

## 版本引用清单

### 1. Cargo 包 (Rust)

| 文件 | 版本类型 | 同步方式 | 备注 |
|------|---------|---------|------|
| `Cargo.toml` | workspace | **源** | 主版本号定义 |
| `packages/core/Cargo.toml` | workspace=true | 自动 | 使用 workspace 版本 |
| `packages/cli/Cargo.toml` | workspace=true | 自动 | CLI 主包 |
| `packages/wasm/Cargo.toml` | workspace=true | 自动 | WASM 绑定包 |
| `packages/tools/**/Cargo.toml` | workspace=true | 手动 | 发布到 crates.io 时需指定 |
| `packages/desktop/Cargo.toml` | workspace=true | 自动 | Desktop 主包 |
| `packages/desktop/src-tauri/Cargo.toml` | workspace=true | 自动 | Tauri 内部包 |

**发布到 crates.io 时的特殊处理**：

```toml
# 工具主包发布时需要显式版本
shard-den-core = { version = "0.2.3", path = "../../core" }

# CLI 发布时需要显式版本
shard-den-** = { version = "0.2.3", path = "../tools/**", optional = true }

# ⚠️ 重要：每个工具的 CLI 子项目也需要更新！
# 例如：packages/tools/uml-styler/cli/Cargo.toml
shard-den-core = { version = "0.2.3", path = "../../../core" }
```

> **容易遗漏**：工具的 `cli/` 子项目（如 `packages/tools/uml-styler/cli/Cargo.toml`）也需要更新 `shard-den-core` 版本。

---

### 2. npm 包 (JavaScript/TypeScript)

| 文件 | 版本类型 | 同步方式 | 备注 |
|------|---------|---------|------|
| `package.json` (root) | 独立 | 手动 | 根目录，未实际使用 |
| `packages/web/package.json` | 独立 | 手动 | Next.js Web 版本 |
| `packages/wasm/pkg/package.json` | 独立 | 手动 | WASM 包版本 |

---

### 3. 构建产物 (自动生成)

| 文件 | 版本类型 | 同步方式 | 备注 |
|------|---------|---------|------|
| `packages/web/public/wasm/shard_den_wasm.js` | 自动 | wasm-bindgen | 由 WASM 构建生成 |
| `packages/web/public/wasm/shard_den_wasm.d.ts` | 自动 | wasm-bindgen | TypeScript 类型定义 |
| `packages/web/public/wasm/package.json` | 自动 | wasm-pack | WASM 包元信息 |
| `packages/web/wasm/pkg/shard_den_wasm.js` | 自动 | wasm-pack | 开发环境 WASM |

**这些文件由构建工具自动生成，不需要手动管理版本。**

---

### 4. 文档

| 文件 | 版本类型 | 同步方式 | 备注 |
|------|---------|---------|------|
| `README.md` | 手动 | 手动 | 版本徽章 |
| `CHANGELOG.md` | 手动 | 手动 | 发布日志 |

**README.md 版本徽章示例**：
```markdown
![Version](https://img.shields.io/badge/version-0.2.3-blue)
```

---

### 5. CI/CD

| 文件 | 版本类型 | 同步方式 | 备注 |
|------|---------|---------|------|
| `.github/workflows/release.yml` | 自动 | Git tag | `VERSION: ${{ github.ref_name }}` |

CI 从 Git tag (`v*`) 提取版本。

---

### 6. Git Tags

| 格式 | 示例 | 用途 |
|------|------|------|
| `v{major}.{minor}.{patch}` | v0.2.3 | 正式版本 |
| `v{major}.{minor}.{patch}-{prerelease}` | v0.2.2-1 | 预发布版本 |

---

## 发布版本时需要修改的文件

发布新版本时，需要同时修改以下 6 个位置：

### 1. Cargo.toml (workspace)

**文件**: `Cargo.toml`

```toml
[workspace.package]
version = "0.2.3"
```

**说明**: 唯一真实源，必须首先修改。

---

### 2. CHANGELOG.md

**文件**: `CHANGELOG.md`

```markdown
## [Unreleased]

## [0.2.3] - 2026-02-23

### Added
- 新功能描述

### Fixed
- 修复内容

---

[Unreleased]: https://github.com/oGsLP/shard-den/compare/v0.2.3...HEAD
[0.2.3]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.3
[0.2.2]: https://github.com/oGsLP/shard-den/releases/tag/v0.2.2
```

**说明**: 添加新版本章节，更新底部链接。

---

### 3. packages/web/package.json

**文件**: `packages/web/package.json`

```json
{
  "name": "shard-den-web",
  "version": "0.2.3",
  ...
}
```

**说明**: Next.js Web 包的版本。

---

### 4. README.md (可选)

**文件**: `README.md`

```markdown
![Version](https://img.shields.io/badge/version-0.2.3-blue)
```

**说明**: 版本徽章，保持与最新版本一致。

---

### 5. packages/tools/**/Cargo.toml

**文件**: `packages/tools/**/Cargo.toml`

```toml
# 必须使用显式版本（不能使用 workspace = true）
shard-den-core = { version = "0.2.3", path = "../../core" }
```

**说明**: 发布到 crates.io 时，依赖必须显式指定版本（无论版本是否一致）。

---

### 6. packages/cli/Cargo.toml

**文件**: `packages/cli/Cargo.toml`

```toml
# 必须使用显式版本（不能使用 workspace = true）
shard-den-core = { version = "0.2.3", path = "../core" }
shard-den-json-extractor = { version = "0.2.3", path = "../tools/json-extractor", optional = true }
shard-den-uml-styler = { version = "0.2.3", path = "../tools/uml-styler", optional = true }
# ... 其他工具，后续新增都需要补充
```

**说明**: 发布到 crates.io 时，依赖必须显式指定版本（无论版本是否一致）。

---

### 7. packages/tools/*/cli/Cargo.toml (CLI 子项目)

**文件**: `packages/tools/*/cli/Cargo.toml`

```toml
# 必须使用显式版本
shard-den-core = { version = "0.2.3", path = "../../../core" }
```

**说明**: 每个工具的 CLI 子项目也需要更新 `shard-den-core` 版本。

> ⚠️ **重要**: 这是容易遗漏的地方！每次发布时检查所有 `cli/Cargo.toml` 文件。

---

## 修改顺序

建议按以下顺序修改：

1. `Cargo.toml` (workspace) ← 首先修改
2. `CHANGELOG.md`
3. `packages/web/package.json`
4. `README.md`
5. `packages/tools/**/Cargo.toml`
6. `packages/cli/Cargo.toml`
7. `packages/tools/*/cli/Cargo.toml` ← 容易遗漏！

## 快速命令

**以json-extractor为例，所有工具都需要修改**

```bash
# 1. 修改版本号 (Cargo.toml)
sed -i 's/version = ".*"/version = "0.2.3"/' Cargo.toml

# 2. 修改工具依赖版本（所有工具都需要修改）
sed -i 's/shard-den-core = { version = ".*"/shard-den-core = { version = "0.2.3"/' packages/tools/json-extractor/Cargo.toml
sed -i 's/shard-den-core = { version = ".*"/shard-den-core = { version = "0.2.3"/' packages/tools/uml-styler/Cargo.toml

# 3. 修改 CLI 子项目依赖版本（容易遗漏！）
sed -i 's/shard-den-core = { version = ".*"/shard-den-core = { version = "0.2.3"/' packages/tools/uml-styler/cli/Cargo.toml

# 4. 修改主 CLI 依赖版本
sed -i 's/shard-den-json-extractor = { version = ".*"/shard-den-json-extractor = { version = "0.2.3"/' packages/cli/Cargo.toml
sed -i 's/shard-den-uml-styler = { version = ".*"/shard-den-uml-styler = { version = "0.2.3"/' packages/cli/Cargo.toml
```

### 策略 1: 手动同步 (当前方式)

每次发布时手动更新所有文件。

**优点**：简单直接
**缺点**：容易遗漏

### 策略 2: CI 脚本自动同步 (推荐)

在发布 workflow 中添加版本同步步骤：

```yaml
- name: Sync version across files
  run: |
    VERSION="${{ env.VERSION }}"
    
    # 1. 更新 npm 包版本
    cd packages/web
    npm version $VERSION --no-git-tag-version
    cd ../..
    
    # 2. 更新 README.md 版本徽章
    sed -i "s/version-[0-9.]*/version-$VERSION/" README.md
    
    # 3. 为 crates.io 发布准备显式版本
    # (在 publish-crates job 中临时添加)
```

**优点**：减少手动操作，降低遗漏风险
**缺点**：需要维护脚本

### 策略 3: 自动化工具 (长期方案)

使用 release-please 或自定义工具完全自动化。

---

## 发布检查清单

### 发布前检查

#### 1. Cargo.toml (workspace)
- [ ] `Cargo.toml` workspace 版本已更新

#### 2. Cargo 包依赖显式版本 (crates.io 发布需要)
- [ ] `packages/tools/json-extractor/Cargo.toml` - `shard-den-core` 版本
- [ ] `packages/tools/uml-styler/Cargo.toml` - `shard-den-core` 版本
- [ ] `packages/tools/uml-styler/cli/Cargo.toml` - `shard-den-core` 版本 (CLI 子项目，容易遗漏！)
- [ ] `packages/cli/Cargo.toml` - `shard-den-core` 和所有工具包版本

#### 3. npm 包版本
- [ ] `package.json` 版本已同步
- [ ] `packages/web/package.json` 版本已同步
- [ ] `packages/wasm/pkg/package.json` 版本已同步 (如需)

#### 4. 文档
- [ ] `CHANGELOG.md` 已添加新版本条目
- [ ] `README.md` 版本徽章已更新 (如需)

#### 5. Git 操作
- [ ] 所有更改已提交
- [ ] Git tag 已创建并推送

### 发布后检查 (CI 自动处理)

- [ ] crates.io 发布成功
- [ ] GitHub Release 已创建
- [ ] 所有平台产物已上传
- [ ] Vercel 部署已完成
---

## 版本号规范

遵循 [Semantic Versioning](https://semver.org/)：

| 类型 | 格式 | 示例 |
|------|------|------|
| 正式版本 | MAJOR.MINOR.PATCH | 0.2.3 |
| 预发布 | MAJOR.MINOR.PATCH-prerelease | 0.2.3-1 |

---

## 相关文档

- [CHANGELOG.md](../CHANGELOG.md) - 版本变更日志
- [.github/workflows/release.yml](../.github/workflows/release.yml) - 发布工作流

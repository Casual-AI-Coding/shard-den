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
| `packages/tools/json-extractor/Cargo.toml` | workspace=true | 手动 | 发布到 crates.io 时需指定 |
| `packages/desktop/Cargo.toml` | workspace=true | 自动 | Desktop 主包 |
| `packages/desktop/src-tauri/Cargo.toml` | workspace=true | 自动 | Tauri 内部包 |

**发布到 crates.io 时的特殊处理**：

```toml
# json-extractor 发布时需要显式版本
shard-den-core = { version = "0.2.3", path = "../../core" }

# CLI 发布时需要显式版本
shard-den-json-extractor = { version = "0.2.3", path = "../tools/json-extractor", optional = true }
```

---

### 2. npm 包 (JavaScript/TypeScript)

| 文件 | 版本类型 | 同步方式 | 备注 |
|------|---------|---------|------|
| `package.json` (root) | 独立 | 手动 | 根目录，未实际使用 |
| `packages/web/package.json` | 独立 | 手动 | Next.js Web 版本 |

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

## 版本同步策略

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

- [ ] `Cargo.toml` workspace 版本已更新
- [ ] `CHANGELOG.md` 已添加新版本条目
- [ ] `packages/web/package.json` 版本已同步 (如需)
- [ ] `README.md` 版本徽章已更新 (如需)

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

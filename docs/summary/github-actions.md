# GitHub Actions 工作流总结

## 概述

项目配置了两个独立的 GitHub Actions 工作流，分别用于**代码质量检查**和**自动发布**。

---

## 工作流 1: CI (持续集成)

**文件**: `.github/workflows/ci.yml`

### 触发条件
- `push` 到 `main` 或 `develop` 分支
- `pull_request` 到 `main` 分支

### 任务

#### 1. Rust Checks (ubuntu-latest)
- **格式化检查**: `cargo fmt --all -- --check`
- **静态分析**: `cargo clippy --all-targets --all-features -- -D warnings`
- **单元测试**: `cargo test --workspace`
- **覆盖率检查**: `cargo tarpaulin --fail-under 85` (≥85%)

#### 2. Web Checks (ubuntu-latest)
- **依赖安装**: `npm install`
- **类型检查**: `npm run typecheck`
- **代码检查**: `npm run lint`
- **单元测试**: `npm run test`
- **覆盖率检查**: `npm run test:coverage` (≥85%)

#### 3. Build (多平台)
- **平台**: ubuntu-latest, windows-latest, macos-latest
- **构建 CLI**: `cargo build --release -p shard-den-json-cli`
- **构建 WASM**: `cargo build --release -p shard-den-wasm --target wasm32-unknown-unknown`

### 用途
确保代码合并前通过所有质量检查，包括格式化、静态分析、测试和覆盖率。

---

## 工作流 2: Release (自动发布)

**文件**: `.github/workflows/release.yml`

### 触发条件
- `push` 符合 `v*` 模式的标签 (如 `v0.1.0`, `v1.2.3`)

### 任务

#### 1. Build CLI (多平台矩阵)
| 平台 | 目标架构 | 产物 |
|------|---------|------|
| ubuntu-latest | x86_64-unknown-linux-gnu | shard-den-json-linux-x64.tar.gz |
| windows-latest | x86_64-pc-windows-msvc | shard-den-json-windows-x64.zip |
| macos-latest | x86_64-apple-darwin | shard-den-json-macos-x64.tar.gz |
| macos-latest | aarch64-apple-darwin | shard-den-json-macos-arm64.tar.gz |

#### 2. Build WASM (ubuntu-latest)
- 使用 `wasm-pack` 构建
- 产物: `shard-den-wasm.tar.gz`, `shard-den-wasm.zip`

#### 3. Build Web (ubuntu-latest)
- 构建 Next.js 静态站点
- 产物: `shard-den-web.tar.gz`, `shard-den-web.zip`

#### 4. Create Release (ubuntu-latest)
- 下载所有构建产物
- 创建/更新 GitHub Release
- 上传所有产物文件
- 生成安装说明

### 产物清单
发布时会自动生成以下文件：

```
shard-den-json-linux-x64.tar.gz      # Linux CLI
shard-den-json-windows-x64.zip       # Windows CLI
shard-den-json-macos-x64.tar.gz      # macOS Intel CLI
shard-den-json-macos-arm64.tar.gz    # macOS Apple Silicon CLI
shard-den-wasm.tar.gz                # WASM 包 (.tar.gz)
shard-den-wasm.zip                   # WASM 包 (.zip)
shard-den-web.tar.gz                 # Web 前端 (.tar.gz)
shard-den-web.zip                    # Web 前端 (.zip)
```

---

## 使用指南

### 场景 1: 提交代码并检查
```bash
# 开发代码...
git add .
git commit -m "feat: add new feature"
git push origin main

# 自动触发 CI 工作流
# 查看状态: https://github.com/Casual-AI-Coding/shard-den/actions
```

### 场景 2: 发布新版本
```bash
# 1. 更新版本号 (Cargo.toml, package.json, CHANGELOG.md)
# 2. 提交更改
git add .
git commit -m "chore: bump version to 0.1.2"
git push origin main

# 3. 创建标签
git tag -a v0.1.2 -m "Release v0.1.2 - Description"
git push origin v0.1.2

# 自动触发 Release 工作流
# 查看发布: https://github.com/Casual-AI-Coding/shard-den/releases
```

### 场景 3: 查看工作流状态
```bash
# 列出最近运行
gh run list --repo Casual-AI-Coding/shard-den

# 查看特定工作流
gh workflow view CI --repo Casual-AI-Coding/shard-den
gh workflow view Release --repo Casual-AI-Coding/shard-den

# 查看运行日志
gh run view <run-id> --repo Casual-AI-Coding/shard-den --log
```

---

## 故障排查

### CI 失败常见原因

| 检查项 | 失败原因 | 解决方法 |
|--------|---------|----------|
| Format check | 代码未格式化 | 运行 `cargo fmt --all` |
| Clippy | 有警告或错误 | 修复警告或添加 `#[allow(...)]` |
| Test | 测试未通过 | 修复测试代码或测试用例 |
| Coverage | 覆盖率 < 85% | 添加更多测试 |

### Release 失败常见原因

| 阶段 | 失败原因 | 解决方法 |
|------|---------|----------|
| Build CLI | 编译错误 | 确保代码在本地能编译通过 |
| Build WASM | wasm-pack 未安装 | 检查安装脚本 |
| Build Web | npm 依赖问题 | 检查 package.json |
| Upload | 权限不足 | 检查 GITHUB_TOKEN 权限 |

---

## 关键配置

### 权限要求
Release 工作流需要写入权限：
```yaml
permissions:
  contents: write
```

### 依赖的操作
- `actions/checkout@v4` - 检出代码
- `dtolnay/rust-toolchain@stable` - 安装 Rust
- `actions/setup-node@v4` - 安装 Node.js
- `actions/upload-artifact@v4` - 上传构建产物
- `actions/download-artifact@v4` - 下载构建产物
- `softprops/action-gh-release@v1` - 创建 Release

---

## 快速参考

| 命令 | 说明 |
|------|------|
| `git push origin main` | 触发 CI |
| `git push origin v0.1.0` | 触发 Release |
| `gh run list` | 查看运行历史 |
| `gh release list` | 查看发布列表 |
| `gh release view v0.1.0` | 查看特定发布 |

---

## 相关链接

- **Actions 页面**: https://github.com/Casual-AI-Coding/shard-den/actions
- **Releases 页面**: https://github.com/Casual-AI-Coding/shard-den/releases
- **CI 工作流文件**: `.github/workflows/ci.yml`
- **Release 工作流文件**: `.github/workflows/release.yml`

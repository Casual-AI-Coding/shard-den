# GitHub Actions 构建加速方案

本文档详细介绍三种优化 GitHub Actions 构建速度的方案，重点针对 Tauri 桌面应用构建场景。

---

## 问题背景

在当前 Release 工作流中，`cargo install tauri-cli` 是最耗时的步骤之一：

```yaml
- name: Install Tauri CLI
  run: cargo install tauri-cli --version "^2.0"
```

**耗时**: 每次 CI 运行约 **5-15 分钟**（从源码编译）

---

## 方案对比

### 方案 1: GitHub Actions 缓存 (`actions/cache`)

#### 原理

缓存 `target/` 目录和 cargo  registry，减少重复编译。

```yaml
- uses: actions/cache@v3
  with:
    path: |
      ~/.cargo/bin/
      ~/.cargo/registry/index/
      ~/.cargo/registry/cache/
      ~/.cargo/git/db/
      target/
    key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
    restore-keys: |
      ${{ runner.os }}-cargo-
```

#### 效果

| 构建类型 | 原始耗时 | 加速后耗时 |
|---------|---------|-----------|
| 首次构建 | ~15 min | ~15 min |
| 后续构建 | ~15 min | ~5 min |

**提速约 60-70%**

#### 优点

- ✅ 配置简单，只需添加一个 step
- ✅ 通用方案，适用于所有 Rust 项目
- ✅ GitHub 官方维护，稳定可靠

#### 缺点

- ❌ 首次构建无加速效果
- ❌ 缓存有大小限制（默认 2GB）
- ❌ 缓存可能失效或过期
- ❌ 仍需 `cargo build` 从源码编译

#### 适用场景

- 作为其他方案的补充
- 加速一般 Rust 编译（非 Tauri 场景）
- 多 job 共享缓存

---

### 方案 2: tauri-action

#### 原理

使用官方 `tauri-apps/tauri-action` 替代手动 `cargo install tauri-cli` + `cargo tauri build`。

```yaml
- uses: tauri-apps/tauri-action@v0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    tagName: v__VERSION__
    releaseName: 'App Name v__VERSION__'
    releaseDraft: true
    releasePrerelease: false
```

#### 效果

| 构建类型 | 原始耗时 | 加速后耗时 |
|---------|---------|-----------|
| Desktop 构建 | ~20 min | ~8 min |

**提速约 50-60%**（跳过 tauri-cli 安装）

#### 优点

- ✅ 官方维护，与 Tauri 版本同步
- ✅ 一站式解决方案（构建 + Release 上传）
- ✅ 内置前端构建集成
- ✅ 自动处理签名、证书（ macOS/Windows）
- ✅ 支持多平台构建 + 自动上传

#### 缺点

- ❌ 改动成本较高，需重构现有 workflow
- ❌ 功能全但重，学习曲线
- ❌ 需要适应它的构建流程
- ❌ 依赖 Node.js 环境
- ❌ 灵活性受限

#### 适用场景

- 新项目直接采用官方最佳实践
- 想要简化 Release 流程
- 需要 macOS 签名/Windows 证书

---

### 方案 3: cargo-binstall

#### 原理

下载预编译的二进制文件，类似 `npm install` / `pip install`。

```yaml
# 安装 cargo-binstall
- uses: cargo-bins/cargo-binstall@v1

# 使用 binstall 安装工具（秒级完成）
- run: cargo binstall tauri-cli@^2.0 -y
```

#### 效果

| 构建类型 | 原始耗时 | 加速后耗时 |
|---------|---------|-----------|
| tauri-cli 安装 | ~10 min | ~30 sec |
| 完整 Desktop 构建 | ~20 min | ~12 min |

**提速约 70-80%**

#### 优点

- ✅ 安装速度极快（几秒 vs 几分钟）
- ✅ 透明替代 `cargo install`，改动小
- ✅ 支持大部分流行 Rust 工具
- ✅ 找不到二进制时自动回退到编译

#### 缺点

- ❌ 需要先安装 `cargo-binstall` 本身
- ❌ 不是所有 crate 都有预编译二进制
- ❌ Tauri CLI 的支持取决于官方是否提供
- ❌ 额外依赖一个工具

#### 适用场景

- 快速见效，改动最小
- 安装预编译二进制的主流工具

---

## 对比总结

| 特性 | 缓存 (actions/cache) | tauri-action | cargo-binstall |
|------|---------------------|--------------|----------------|
| **首次构建加速** | ❌ | ✅ | ✅ |
| **后续构建加速** | ✅ | ✅ | ✅ |
| **改动成本** | 低 | 高 | 低 |
| **维护者** | GitHub 官方 | Tauri 官方 | 社区 |
| **速度提升** | 中 | 高 | 最高 |
| **灵活性** | 高 | 低 | 高 |
| **依赖要求** | 无 | 适配其流程 | 需要二进制支持 |

---

## 速度量化对比

| 操作 | 原始耗时 | 缓存 | tauri-action | cargo-binstall |
|------|---------|------|--------------|----------------|
| tauri-cli 安装 | 10-15 min | 10-15 min | **跳过** | **10-30 sec** |
| 完整 Desktop 构建 | 20-25 min | 8-12 min | 8-10 min | 10-12 min |
| 完整 Release | 40-50 min | 25-30 min | 20-25 min | 20-25 min |

---

## 推荐方案

### 最佳实践：组合使用

```yaml
# 1. 使用缓存加速 cargo 编译
- uses: actions/cache@v3
  with:
    path: |
      ~/.cargo/registry/
      target/
    key: ${{ runner.os }}-tauri-${{ hashFiles('**/Cargo.lock') }}
    restore-keys: |
      ${{ runner.os }}-tauri-

# 2. 使用 cargo-binstall 安装 tauri-cli
- uses: cargo-bins/cargo-binstall@v1
- run: cargo binstall tauri-cli@^2.0 -y
```

### 推荐优先级

1. **首选 cargo-binstall** - 改动最小，效果最明显
2. **添加缓存** - 作为补充，进一步加速
3. **tauri-action** - 仅当需要完整官方方案时

---

## Build Desktop 额外优化

除了上述三种方案，针对 Build Desktop 步骤还有额外的优化空间。

### 问题分析

当前 Release 工作流的 Build Desktop 存在重复构建问题：

| 步骤 | 耗时 | 问题 |
|-----|------|------|
| Install system deps | ~30s | 无法优化 |
| npm install | ~1-2min | 可缓存 |
| **npm run build** | ~2-3min | **重复！build-web 已构建** |
| cargo install tauri-cli | ~10min | 可用 cargo-binstall |
| cargo tauri build | ~5-10min | 可缓存 Rust 编译 |

**核心问题**: Web 被构建了两次（build-web job + build-desktop job）

### 优化方案

#### 1. 复用 Web 构建产物（最大优化）

```yaml
# build-desktop job: 下载 build-web 的产物，而不是重新构建
- name: Download Web Artifact
  uses: actions/download-artifact@v4
  with:
    name: web
    path: packages/web/.next

# 删除 npm install 和 npm run build 步骤
```

**效果**: 节省 ~3min

#### 2. 使用 swatinem/rust-cache@v2（专为 Rust 设计）

比 `actions/cache` 更智能，只缓存修改过的 crate。

```yaml
- uses: Swatinem/rust-cache@v2
  with:
    workspaces: './packages/desktop -> target'
```

**效果**: 后续构建节省 ~3-5min

#### 3. cargo-binstall 安装 tauri-cli

```yaml
- uses: cargo-bins/cargo-binstall@v1
- run: cargo binstall tauri-cli@^2.0 -y
```

**效果**: 节省 ~10min

### 优化后预期

| 步骤 | 原始 | 优化后 |
|-----|------|-------|
| System deps | 30s | 30s |
| npm install + build | 3-5min | **0** (复用) |
| tauri-cli | 10min | 30s |
| cargo tauri build | 5-10min | 3-5min (缓存) |
| **总计** | **~18min** | **~5min** |

**提升约 70%**

### 完整优化配置示例

```yaml
build-desktop:
  needs: [build-web]  # 添加依赖，确保 web 先完成
  steps:
    - uses: actions/checkout@v4
    
    # 1. 复用 Web 产物（关键优化）
    - name: Download Web Artifact
      uses: actions/download-artifact@v4
      with:
        name: web
        path: packages/web/.next
    
    # 2. 使用 Rust 专用缓存
    - uses: Swatinem/rust-cache@v2
      with:
        workspaces: './packages/desktop -> target'
    
    # 3. 安装 Rust
    - uses: dtolnay/rust-toolchain@stable
      with:
        targets: ${{ matrix.target }}
    
    # 4. 使用 cargo-binstall 安装 tauri-cli
    - uses: cargo-bins/cargo-binstall@v1
    - run: cargo binstall tauri-cli@^2.0 -y
    
    # 5. 构建 Desktop（跳过 npm install/build）
    - name: Build Desktop App
      working-directory: packages/desktop
      run: cargo tauri build --target ${{ matrix.target }}
```

---

## 实施建议

### 短期（快速见效）

1. 添加 `cargo-binstall` 方案
2. 预期效果：Desktop 构建从 ~20min → ~12min

### 中期（持续优化）

1. 添加 `swatinem/rust-cache`
2. 复用 build-web 产物
3. 预期效果：Desktop 构建从 ~12min → ~5min

### 长期（架构升级）

1. 评估是否迁移到 `tauri-action`
2. 需要权衡灵活性 vs 便利性

---

## 相关链接

- [actions/cache 文档](https://github.com/actions/cache)
- [swatinem/rust-cache 文档](https://github.com/swatinem/rust-cache)
- [tauri-action 文档](https://github.com/tauri-apps/tauri-action)
- [cargo-binstall 文档](https://github.com/cargo-bins/cargo-binstall)
- [Tauri CI 官方指南](https://v2.tauri.app/distribute/pipelines/github/)

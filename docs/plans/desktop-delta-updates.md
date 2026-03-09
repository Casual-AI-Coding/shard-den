# Desktop 增量更新设计

> 设计版本: v0.3.4  
> 状态: 设计阶段  
> 目标: 实现差分更新，用户只需下载变更部分

---

## 背景

### 当前问题

每次发布新版本，用户需要下载完整安装包：

| 平台 | 完整包大小 | 平均变更 | 浪费比例 |
|------|-----------|---------|---------|
| Windows | ~10 MB | ~2 MB | **80%** |
| macOS | ~10 MB | ~2 MB | **80%** |
| Linux | ~80 MB | ~5 MB | **94%** |

### 目标

实现差分更新，用户只需下载**实际变更的部分**：

```
v0.3.3 (10MB) ──[diff: 2MB]──> v0.3.4 (10MB)

用户下载: 2MB (而不是 10MB)
节省: 80% 带宽
```

---

## 技术方案

### 方案 1: Tauri 官方 Updater + 自定义差分

**架构**:
```
┌─────────────────────────────────────────┐
│           Tauri Updater                 │
│  ┌─────────────────────────────────┐   │
│  │     Custom Diff Provider        │   │
│  │  ┌─────────┐    ┌──────────┐   │   │
│  │  │  Server │───>│ diff gen │   │   │
│  │  │  (API)  │    │ (binary) │   │   │
│  │  └─────────┘    └──────────┘   │   │
│  └─────────────────────────────────┘   │
│              │                          │
│              ▼                          │
│  ┌─────────────────────────────────┐   │
│  │      Client Patcher             │   │
│  │  ┌────────┐    ┌──────────┐    │   │
│  │  │ Download│───>│ Apply    │    │   │
│  │  │  diff   │    │ patch    │    │   │
│  │  └────────┘    └──────────┘    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**实现方式**:
1. 使用 Tauri 的 `tauri-plugin-updater`
2. 自定义更新服务器提供差分包
3. 客户端应用差分补丁

**优点**:
- 集成度高
- 支持签名验证
- 自动回滚

**缺点**:
- 需要自建更新服务器
- 差分算法需要自行实现

### 方案 2: GitHub Releases + bsdiff

**架构**:
```
GitHub Releases
├── shard-den-v0.3.3.exe (10MB)
├── shard-den-v0.3.4.exe (10MB)
└── shard-den-v0.3.3-to-v0.3.4.patch (2MB)  ← 差分包
```

**实现方式**:
1. CI/CD 生成差分包（使用 bsdiff/hpatchz）
2. 客户端检查新版本时下载差分包
3. 使用 bspatch/hpatchz 应用补丁

**优点**:
- 使用成熟的差分算法
- 不需要额外服务器
- 社区支持好

**缺点**:
- GitHub Releases 需要手动上传差分包
- 客户端需要集成补丁工具

---

## 推荐方案: GitHub + bsdiff

### 原因

1. **成熟稳定**: bsdiff 是 Google Chrome 等软件使用的差分算法
2. **压缩率高**: 二进制差分通常比完整包小 70-90%
3. **无需服务器**: 直接利用 GitHub Releases
4. **易于集成**: Tauri 支持自定义更新端点

### 差分算法对比

| 算法 | 压缩率 | 速度 | 适用场景 |
|------|--------|------|---------|
| **bsdiff** | 高 | 中等 | 二进制文件 |
| **hpatchz** | 很高 | 慢 | 大文件 |
| **zstd** | 中 | 快 | 流式数据 |
| **xdelta3** | 高 | 快 | 游戏更新 |

**选择**: bsdiff（平衡压缩率和速度）

---

## 架构设计

### 服务器端（CI/CD）

```yaml
# .github/workflows/release.yml

generate-diff:
  name: Generate Delta Update
  needs: [release]
  runs-on: ubuntu-latest
  steps:
    - name: Download previous version
      run: |
        gh release download v0.3.3 -p "*.exe" -p "*.dmg" -p "*.AppImage"
    
    - name: Install bsdiff
      run: sudo apt-get install -y bsdiff
    
    - name: Generate diff packages
      run: |
        for old in artifacts/v0.3.3/*; do
          for new in artifacts/v0.3.4/*; do
            bsdiff "$old" "$new" "diff-$(basename $old).patch"
          done
        done
    
    - name: Upload diff to release
      run: |
        gh release upload v0.3.4 *.patch
```

### 客户端（Tauri）

```rust
// packages/desktop/src/updater.rs

use tauri_plugin_updater::UpdaterExt;
use std::process::Command;

pub struct DeltaUpdater;

impl DeltaUpdater {
    /// Check for updates and apply delta patch if available
    pub async fn check_and_update(app: &tauri::AppHandle) -> Result<(), String> {
        let updater = app.updater();
        
        // 1. Check for new version
        if let Some(update) = updater.check().await? {
            let current_version = env!("CARGO_PKG_VERSION");
            let new_version = update.version();
            
            // 2. Try to download delta patch first
            let delta_url = format!(
                "https://github.com/Casual-AI-Coding/shard-den/releases/download/v{}/diff-{}-to-{}.patch",
                new_version, current_version, new_version
            );
            
            if let Ok(patch) = Self::download_delta(&delta_url).await {
                // 3. Apply delta patch
                Self::apply_patch(&patch, &update.download_path()?)?;
                update.install()?;
            } else {
                // 4. Fall back to full download
                update.download_and_install().await?;
            }
        }
        
        Ok(())
    }
    
    async fn download_delta(url: &str) -> Result<Vec<u8>, reqwest::Error> {
        let response = reqwest::get(url).await?;
        if response.status().is_success() {
            Ok(response.bytes().await?.to_vec())
        } else {
            Err(reqwest::Error::from(response.error_for_status().unwrap_err()))
        }
    }
    
    fn apply_patch(patch: &[u8], output: &Path) -> Result<(), String> {
        let current_exe = std::env::current_exe()?;
        
        // Use bspatch to apply delta
        let status = Command::new("bspatch")
            .arg(&current_exe)
            .arg(output)
            .arg("-")  // Read patch from stdin
            .stdin(std::process::Stdio::piped())
            .spawn()?
            .wait()?;
            
        if !status.success() {
            return Err("Patch application failed".to_string());
        }
        
        Ok(())
    }
}
```

### TypeScript 接口

```typescript
// packages/desktop/src/updater.ts

export interface UpdateInfo {
  version: string;
  currentVersion: string;
  hasDelta: boolean;
  deltaSize: number;
  fullSize: number;
  releaseNotes: string;
}

export interface UpdaterProgress {
  stage: 'checking' | 'downloading-delta' | 'downloading-full' | 'applying' | 'installing';
  progress: number;
  bytesDownloaded: number;
  totalBytes: number;
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  return await invoke('check_update');
}

export async function installUpdate(
  onProgress?: (progress: UpdaterProgress) => void
): Promise<void> {
  await invoke('install_update', { onProgress });
}
```

---

## 差分包生成

### bsdiff 算法

```bash
# 生成差分包
bsdiff old.exe new.exe patch.patch

# 应用差分包
bspatch old.exe new.exe patch.patch
```

### 多版本支持

```
releases/
├── v0.3.3/
│   ├── shard-den.exe
│   └── shard-den.dmg
├── v0.3.4/
│   ├── shard-den.exe
│   ├── shard-den.dmg
│   ├── diff-v0.3.3-to-v0.3.4.exe.patch   # 从 v0.3.3 升级
│   └── diff-v0.3.2-to-v0.3.4.exe.patch   # 从 v0.3.2 升级（可选）
└── v0.3.5/
    ├── shard-den.exe
    └── diff-v0.3.4-to-v0.3.5.exe.patch
```

**策略**:
- 仅支持 N-1 → N 的升级（减少存储）
- 跳过版本需下载完整包
- 保留最近 3 个版本的差分包

---

## UI 设计

### 更新检查

```
┌─────────────────────────────┐
│ 🔄 检查更新                  │
│                             │
│ 正在检查新版本...            │
│ [=========>        ] 60%    │
└─────────────────────────────┘
```

### 发现更新（有差分包）

```
┌─────────────────────────────┐
│ 🎉 发现新版本 v0.3.4         │
│                             │
│ 当前版本: v0.3.3             │
│                             │
│ 更新内容:                    │
│ • 新增 WaveDrom 引擎         │
│ • 优化打包体积              │
│ • 修复若干 bug              │
│                             │
│ 下载大小:                   │
│ • 增量更新: 2.1 MB ⭐       │
│ • 完整安装: 9.8 MB          │
│                             │
│ [ 立即更新 (增量) ]          │
└─────────────────────────────┘
```

### 下载进度

```
┌─────────────────────────────┐
│ ⬇️ 正在下载更新              │
│                             │
│ 增量更新包 (2.1 MB)          │
│ [================> ] 85%    │
│                             │
│ 下载速度: 1.2 MB/s          │
│ 剩余时间: 3 秒              │
│                             │
│ [ 取消 ]                    │
└─────────────────────────────┘
```

---

## 实施计划

### Phase 1: 基础架构 (v0.3.4)

- [ ] 集成 Tauri Updater 插件
- [ ] 实现基础更新检查
- [ ] 添加更新 UI 组件
- [ ] 测试完整包下载流程

### Phase 2: 差分包生成 (v0.3.5)

- [ ] CI/CD 添加 bsdiff 步骤
- [ ] 自动生成并上传差分包
- [ ] 版本兼容性检查
- [ ] 测试差分包生成

### Phase 3: 差分更新 (v0.3.6)

- [ ] 实现差分包下载逻辑
- [ ] 集成 bspatch 工具
- [ ] 应用补丁并验证
- [ ] 失败时回退到完整下载

### Phase 4: 优化 (v0.3.7)

- [ ] 多版本差分包链式更新
- [ ] 后台静默更新
- [ ] 更新日志展示
- [ ] 用户更新偏好设置

---

## 预期收益

### 带宽节省

| 版本 | 用户数 | 完整包大小 | 差分包大小 | 总节省 |
|------|--------|-----------|-----------|--------|
| v0.3.4 | 1000 | 10 MB | 2 MB | **8 GB** |
| v0.3.5 | 1000 | 10 MB | 2 MB | **8 GB** |
| v0.3.6 | 1000 | 10 MB | 2 MB | **8 GB** |

### 用户体验

- 更新下载时间减少 **80%**
- 移动网络下更新更可行
- 后台静默更新成为可能

---

## 风险与缓解

### 风险 1: 补丁应用失败

**缓解**:
- 补丁应用前备份当前版本
- 失败时自动回退到完整下载
- 验证补丁后的文件签名

### 风险 2: 版本跨度大

**缓解**:
- 仅支持最近 3 个版本的差分包
- 跨度超过 3 版本需下载完整包
- 提示用户版本太旧

### 风险 3: 存储成本

**缓解**:
- 每个版本只保留 N-1 → N 的差分包
- 定期清理旧版本的差分包
- 使用 GitHub Releases 存储（免费）

---

## 参考实现

### 相关项目

- **Chrome**: 使用 bsdiff / courgette
- **Firefox**: 使用 bsdiff + MAR 格式
- **VS Code**: 使用自定义差分 + electron-updater

### 工具库

```rust
// Rust bsdiff 实现
// https://crates.io/crates/bsdiff
[dependencies]
bsdiff = "0.2"

// 或者使用 hpatchz
// https://github.com/sisong/HDiffPatch
```

---

## 决策记录

**决策**: 采用 GitHub Releases + bsdiff 方案  
**理由**:
1. 成熟稳定的差分算法
2. 无需额外服务器成本
3. 与现有 CI/CD 流程集成简单
4. 社区支持好

**替代方案**:
- ~~Tauri 官方更新器~~ - 不支持差分
- ~~自定义服务器~~ - 运维成本高
- ~~xdelta3~~ - 压缩率不如 bsdiff

---

**状态**: 设计完成，等待实施  
**负责人**: TBD  
**预计工时**: 5-7 天

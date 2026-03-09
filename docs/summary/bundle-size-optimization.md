# 打包体积优化经验总结

> **版本**: v0.3.3 优化实践  
> **适用**: Tauri + Next.js + Rust 桌面应用

---

## 优化背景

### 问题描述

在 v0.3.2 版本中，Tauri Desktop 打包产物体积过大：

| 平台 | 产物 | 原始大小 |
|------|------|----------|
| Windows | .exe | **100+ MB** |
| macOS | .dmg | **100+ MB** |
| Linux | .AppImage | **170+ MB** |

### 问题影响

1. **下载时间长**: 用户下载体验差
2. **分发成本高**: 占用更多带宽和存储
3. **启动速度慢**: 大体积包可能影响启动性能

---

## 根因分析

### 1. Monaco Editor 静态导入

```tsx
// 优化前：静态导入，打包进主 bundle
import Editor from '@monaco-editor/react';
```

**影响**: Monaco Editor 是 VS Code 编辑器内核，体积约 **6-10 MB**，直接打包进主 bundle 导致初始加载巨大。

### 2. WebView2 运行时捆绑

```json
// 优化前：下载安装器
"windows": {
  "webviewInstallMode": {
    "type": "downloadBootstrapper"
  }
}
```

**影响**: Windows 版默认打包 **WebView2 安装器**，增加 **30-50 MB**。

### 3. WASM 文件重复

**问题**: WASM 文件同时存在于：
- `out/wasm/shard_den_wasm_bg.wasm` (5.2 MB)
- `out/_next/static/media/shard_den_wasm_bg.*.wasm` (5.2 MB)

**影响**: 同一 WASM 文件被**重复打包**，浪费 **5 MB**。

### 4. 构建配置未优化

```toml
# 优化前
[profile.release]
opt-level = 3  # 优化速度
```

**影响**: Cargo 默认优化速度而非体积，未启用 LTO、strip 等优化。

---

## 优化措施

### 1. Monaco Editor 动态加载 ⭐⭐⭐

**效果**: 减少 **6-10 MB** 初始包

```tsx
// 优化后：动态导入
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="loading">加载编辑器中...</div>
    ),
  }
);
```

**关键点**:
- 使用 Next.js `dynamic()` 实现代码分割
- 设置 `ssr: false` 避免服务端渲染问题
- 提供 `loading` 占位组件提升体验

### 2. WebView2 安装模式调整 ⭐⭐⭐

**效果**: Windows 包减少 **30-50 MB**

```json
// tauri.conf.json
{
  "bundle": {
    "windows": {
      "webviewInstallMode": {
        "type": "skip"  // 改为 skip
      }
    }
  }
}
```

**注意事项**:
- Windows 11 已预装 WebView2
- Windows 10 1803+ 大多数已有 Edge WebView2
- 如需支持旧系统，改用 `downloadBootstrapper` 并告知用户

### 3. Cargo 编译优化 ⭐⭐

**效果**: 二进制减少 **20-40%**

```toml
# Cargo.toml
[profile.release]
codegen-units = 1      # LLVM 更好优化
lto = true             # 链接时优化
opt-level = "s"        # 优化体积（代替 3）
panic = "abort"        # 禁用堆栈展开
strip = true           # 去除符号表
```

**配置说明**:
| 选项 | 作用 | 权衡 |
|------|------|------|
| `opt-level = "s"` | 体积优化 | 牺牲部分速度 |
| `lto = true` | 链接时内联 | 编译时间增加 |
| `strip = true` | 移除符号 | 无法调试 |
| `panic = "abort"` | 简化异常 | 无堆栈追踪 |

### 4. Next.js 静态导出 ⭐⭐

**效果**: 减少服务端代码，构建产物更精简

```javascript
// next.config.js
const nextConfig = {
  output: 'export',    // 静态导出
  distDir: 'out',      // 输出目录
  // ...
};
```

### 5. WASM 优化 ⭐

**效果**: 避免重复，节省 **5 MB**

```javascript
// next.config.js
webpack: (config, { isServer }) => {
  config.module.rules.push({
    test: /\.wasm$/,
    type: 'asset/resource',
    generator: {
      filename: 'static/wasm/[name][ext]', // 固定名称
    },
  });
  return config;
},
```

### 6. CI/CD 构建流程优化

**关键**: 确保 Web 构建产物路径正确传递给 Desktop

```yaml
# .github/workflows/release.yml
build-web:
  - name: Package Web
    run: |
      cd packages/web/out  # 正确路径
      tar czvf ...

build-desktop:
  - name: Download Web Artifact
    uses: actions/download-artifact@v4
    with:
      name: web
      path: packages/web/out  # 正确路径
```

---

## 优化效果

### v0.3.3 最终产物大小

| 平台 | 产物 | 优化前 | 优化后 | 减少比例 |
|------|------|--------|--------|----------|
| Windows | .msi | 100+ MB | **9.8 MB** | **-90%** |
| Windows | .exe | 100+ MB | **8.7 MB** | **-91%** |
| macOS | .dmg | 100+ MB | **9.4 MB** | **-91%** |
| Linux | .deb | - | **9.5 MB** | - |
| Linux | .rpm | - | **9.5 MB** | - |
| Linux | AppImage | 170+ MB | **82.4 MB** | **-52%** |

### 分析

- **Windows/macOS**: 优化效果显著（减少 90%+），主要来自 WebView2 skip + Monaco 动态加载
- **Linux AppImage**: 优化有限（减少 52%），因为必须包含 WebKit2GTK 运行时（约 50-80 MB）
- **CLI/Web**: 本身就很精简，无需大幅优化

---

## 关键经验

### ✅ 成功经验

1. **Monaco Editor 必须动态加载**
   - 这是最大的优化点（6-10 MB）
   - 对于桌面应用，编辑器使用频率不高，按需加载是最佳实践

2. **WebView2 skip 是 Windows 必选项**
   - 现代 Windows 系统普遍已有 WebView2
   - 跳过捆绑可节省 30-50 MB

3. **Cargo opt-level = "s" 值得使用**
   - 桌面应用对启动速度要求不高
   - 体积减少 20-40% 的收益远大于速度损失

4. **静态导出配合 Tauri**
   - `output: 'export'` 减少服务端代码
   - 确保 `frontendDist` 指向正确（`out` 而非 `.next`）

### ⚠️ 注意事项

1. **Linux AppImage 有硬性限制**
   - WebKit2GTK 必须捆绑（Linux 无系统 WebView）
   - 如需更小体积，提供 `.deb`/`.rpm` 让用户依赖系统库

2. **动态加载的副作用**
   - Monaco Editor 首次加载需等待（~1-2 秒）
   - 提供 loading 占位符缓解体验问题

3. **WebView2 skip 的兼容性**
   - Windows 7/8 可能需要手动安装 WebView2
   - 在文档中说明系统要求

4. **CI/CD 路径同步**
   - Web 构建输出路径必须与 Desktop 输入路径一致
   - 推荐使用 artifact 传递而非重建

---

## 进一步优化方向

### 短期（可行）

1. **UPX 压缩**
   - 使用 UPX 对二进制再压缩 30-50%
   - 已提供 `scripts/compress-with-upx.sh`

2. **Tree Shaking**
   - 检查未使用的依赖
   - `webpack-bundle-analyzer` 分析包大小

3. **图片资源优化**
   - 使用 WebP/AVIF 格式
   - 压缩图标和静态资源

### 长期（探索）

1. **自定义 WebView**
   - 评估 Tauri 2.0 的轻量级 WebView 方案
   - 考虑 Wry/WebView2 替代方案

2. **模块化加载**
   - 将工具拆分为独立 WASM 模块
   - 按需下载加载，减少初始包

3. **增量更新**
   - 实现差分更新机制
   - 用户只需下载变更部分

---

## 参考配置

### 完整优化后的关键配置

```toml
# Cargo.toml
[workspace.package]
version = "0.3.3"

[profile.release]
codegen-units = 1
lto = true
opt-level = "s"
panic = "abort"
strip = true
```

```javascript
// next.config.js
const nextConfig = {
  output: 'export',
  distDir: 'out',
  webpack: (config) => {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
};
```

```json
// tauri.conf.json
{
  "bundle": {
    "windows": {
      "webviewInstallMode": {
        "type": "skip"
      }
    }
  }
}
```

```tsx
// Editor.tsx
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.Editor),
  { ssr: false }
);
```

---

## 总结

通过本次优化，ShardDen 的打包体积从 **100-170 MB** 降至 **8-82 MB**，减少 **50-90%**。主要收益来自：

1. **Monaco Editor 动态加载** (6-10 MB)
2. **WebView2 跳过捆绑** (30-50 MB)
3. **Cargo 编译优化** (20-40%)
4. **CI/CD 流程优化** (避免重复构建)

这些优化措施**无需牺牲功能**，只是改变了资源加载方式和构建配置，是 Tauri + Next.js 项目的最佳实践。

---

**文档维护**: 版本发布时更新优化效果数据  
**最后更新**: 2026-03-09 (v0.3.3)

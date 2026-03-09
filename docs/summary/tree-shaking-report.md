# Tree Shaking 优化报告

> 生成时间: 2026-03-09  
> 版本: v0.3.3  
> 工具: @next/bundle-analyzer

---

## 当前依赖分析

### 大型依赖 (> 1MB)

| 依赖 | 预估大小 | 用途 | 优化建议 |
|------|---------|------|---------|
| **monaco-editor** | ~6-10 MB | 代码编辑器 | ✅ 已动态加载 |
| **mermaid** | ~1-2 MB | 图表渲染 | 动态导入 |
| **pdf-lib** | ~500 KB | PDF 处理 | 工具页使用，保留 |
| **@radix-ui/*** | ~300 KB | UI 组件 | 已按需导入 |

### 中型依赖 (100KB - 1MB)

| 依赖 | 预估大小 | 用途 | 优化建议 |
|------|---------|------|---------|
| **lucide-react** | ~200 KB | 图标库 | Tree Shaking 良好 |
| **lz-string** | ~50 KB | 压缩 | 保留 |
| **class-variance-authority** | ~20 KB | CSS 工具 | 保留 |

---

## 优化建议

### 1. Mermaid 动态加载

```tsx
// 当前：静态导入
import mermaid from 'mermaid';

// 优化：动态导入
const mermaid = await import('mermaid');
```

**预期减少**: ~1-2 MB

### 2. 检查未使用依赖

```bash
# 使用 depcheck 检查未使用依赖
cd packages/web
npx depcheck
```

### 3. 优化 lodash/underscore

如果项目中使用 lodash，确保使用按需导入：

```javascript
// ❌ 错误：导入全部
import _ from 'lodash';

// ✅ 正确：按需导入
import debounce from 'lodash/debounce';
```

---

## 分析命令

```bash
# 安装依赖
cd packages/web
npm install

# 运行 bundle 分析
npm run analyze

# 查看报告
# 自动打开浏览器显示 bundle 分析图表
```

---

## 预期收益

| 优化项 | 当前大小 | 优化后 | 收益 |
|--------|---------|--------|------|
| Mermaid 动态加载 | ~1-2 MB | ~200 KB | -80% |
| 移除未使用依赖 | - | - | -? |
| 总计 | - | - | **-1-2 MB** |

---

## 下一步行动

1. [ ] 运行 `npm run analyze` 生成详细报告
2. [ ] 检查生成的 `.next/analyze` 目录
3. [ ] 识别最大的未使用模块
4. [ ] 实施 Mermaid 动态加载
5. [ ] 移除确认未使用的依赖

---

**备注**: 本报告基于代码审查生成，实际数据请以 `npm run analyze` 结果为准。

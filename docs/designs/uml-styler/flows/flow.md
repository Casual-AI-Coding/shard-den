# UML Styler - 功能流程设计

> **Date:** 2026-02-28
> **Status:** Draft

---

## 1. 核心流程图

### 1.1 编辑-渲染-导出主流程

```mermaid
flowchart TD
    A[用户进入页面] --> B{WASM 初始化}
    B -->|成功| C[显示编辑器]
    B -->|失败| D[显示错误提示<br>引导刷新]
    
    C --> E[用户输入代码]
    E --> F[防抖 300ms]
    F --> G[调用 Engine.validate]
    
    G -->|语法错误| H[显示编辑器错误标记]
    G -->|语法正确| I[调用 Engine.render]
    
    I --> J{返回 RenderHint}
    J -->|FrontendJS| K[调用 mermaid.js 渲染]
    J -->|ServerURL| L[请求 PlantUML 服务器]
    
    K --> M{渲染结果}
    L --> M
    
    M -->|成功| N[显示预览]
    M -->|失败| O[显示错误面板]
    
    N --> P[用户操作]
    P -->|切换主题| Q[应用主题 + 重新渲染]
    P -->|微调参数| R[应用参数 + 重新渲染]
    P -->|导出| S[显示导出面板]
    P -->|分享| T[生成分享链接]
    
    Q --> I
    R --> I
```

### 1.2 URL 分享流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant E as 编辑器
    participant S as ShareService
    participant URL as 浏览器 URL
    
    U->>E: 点击分享按钮
    E->>S: 获取当前状态
    S->>S: 收集 state (code, engine, theme, tuning)
    S->>S: JSON.stringify
    S->>S: LZ-String.compressToEncodedURIComponent
    S->>URL: 更新 hash: #/d/{encoded}
    S-->>E: 返回完整 URL
    E-->>U: 显示分享弹窗
    
    Note over U,URL: 分享链接打开
    
    U->>URL: 打开分享链接
    URL->>E: 读取 hash
    E->>S: 解析 hash
    S->>S: LZ-String.decompressFromEncodedURIComponent
    S->>S: JSON.parse
    S-->>E: 返回 state
    E->>E: 恢复编辑器状态
    E->>E: 触发渲染
```

---

## 2. 状态管理流程

### 2.1 状态结构

```typescript
interface UmlStylerState {
  // === 核心状态 ===
  code: string;                    // 图表代码
  engine: 'mermaid' | 'plantuml';  // 当前引擎
  
  // === 主题状态 ===
  theme: string;                   // 主题 ID
  themeTuning: ThemeTuning;        // 全局微调参数
  
  // === 预览状态 ===
  previewSvg: string | null;       // 渲染结果 SVG
  previewError: Diagnostic | null; // 渲染错误
  isRendering: boolean;            // 渲染中标记
  viewport: Viewport;              // 视口位置
  
  // === 导出状态 ===
  exportFormat: ExportFormat;      // 导出格式
  resolution: Resolution;          // 分辨率设置
  
  // === UI 状态 ===
  isWasmReady: boolean;            // WASM 就绪标记
  wasmError: string | null;        // WASM 错误
  showThemePanel: boolean;         // 主题面板展开
  showExportPanel: boolean;        // 导出面板展开
  showTemplatePanel: boolean;      // 模板面板展开
}

interface ThemeTuning {
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: number;
  lineWidth: number;
  textColor: string;
}

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

type ExportFormat = 'png' | 'svg' | 'pdf';

type Resolution = 
  | { type: 'preset'; scale: 1 | 2 | 3 | 4 }
  | { type: 'dpi'; value: number }
  | { type: 'custom'; width: number; height: number };

interface Diagnostic {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}
```

### 2.2 状态更新流程

```mermaid
flowchart TD
    subgraph 用户操作
        A[输入代码]
        B[切换引擎]
        C[选择主题]
        D[调整微调参数]
        E[选择导出格式]
        F[选择分辨率]
    end
    
    subgraph 状态更新
        G[更新对应 state]
        H{是否需要重新渲染?}
        I[触发防抖渲染]
    end
    
    subgraph 渲染流程
        J[validate code]
        K{语法正确?}
        L[Engine.render]
        M[更新 previewSvg]
        N[更新 previewError]
    end
    
    A --> G --> H
    B --> G --> H
    C --> G --> H
    D --> G --> H
    E --> G
    F --> G
    
    H -->|是| I --> J
    H -->|否| END[结束]
    
    J --> K
    K -->|是| L --> M
    K -->|否| N
```

---

## 3. 错误处理流程

### 3.1 错误分类与处理

```mermaid
flowchart TD
    subgraph 错误类型
        A[WASM 初始化失败]
        B[语法错误]
        C[渲染错误]
        D[网络错误]
        E[导出错误]
    end
    
    subgraph 处理方式
        F[全屏错误提示<br>引导刷新页面]
        G[编辑器波浪线标记<br>+ 错误面板]
        H[错误面板显示<br>渲染失败原因]
        I[错误面板显示<br>网络错误 + 重试按钮]
        J[导出面板显示<br>导出失败原因]
    end
    
    A --> F
    B --> G
    C --> H
    D --> I
    E --> J
```

### 3.2 PlantUML 服务器错误处理

```mermaid
sequenceDiagram
    participant E as Engine
    participant F as Frontend
    participant S as PlantUML Server
    
    E->>F: 返回 ServerURL
    F->>S: GET {encoded_url}
    
    alt 成功
        S-->>F: 200 OK + SVG/PNG
        F->>F: 显示预览
    else 超时 (10s)
        S-->>F: Timeout
        F->>F: 显示错误: "服务器响应超时"
        F->>F: 显示重试按钮
    else 服务器错误 (5xx)
        S-->>F: 500 Error
        F->>F: 显示错误: "服务器暂时不可用"
        F->>F: 显示稍后重试提示
    else 语法错误 (400)
        S-->>F: 400 + 错误 SVG
        F->>F: 解析错误 SVG
        F->>F: 显示语法错误位置
    end
```

### 3.3 重试策略

| 错误类型 | 重试次数 | 重试间隔 | 降级策略 |
|----------|---------|---------|---------|
| 网络超时 | 3 次 | 指数退避 (1s, 2s, 4s) | 显示错误，用户手动重试 |
| 服务器 5xx | 2 次 | 固定 2s | 引导稍后重试 |
| 语法错误 | 不重试 | - | 显示错误位置 |

---

## 4. 性能优化流程

### 4.1 渲染防抖

```typescript
// 防抖渲染 Hook
function useDebouncedRender(delay = 300) {
  const timerRef = useRef<NodeJS.Timeout>();
  
  const scheduleRender = useCallback((code: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      renderDiagram(code);
    }, delay);
  }, [delay]);
  
  return scheduleRender;
}
```

### 4.2 大图渲染优化

```mermaid
flowchart TD
    A[开始渲染] --> B{图表节点数 > 100?}
    
    B -->|是| C[显示渲染中提示]
    C --> D[Web Worker 渲染]
    D --> E{渲染成功?}
    
    B -->|否| F[主线程渲染]
    F --> E
    
    E -->|成功| G[显示预览]
    E -->|超时 (>5s)| H[显示简化版预览]
    H --> I[提示: 图表较大，已简化显示]
```

### 4.3 模板库虚拟滚动

```typescript
// 虚拟滚动实现
interface VirtualScrollConfig {
  itemHeight: 150;      // 每个卡片高度
  visibleCount: 6;      // 可见数量
  bufferCount: 3;       // 缓冲数量
}

// 只渲染可见区域 + 缓冲区域的模板卡片
function renderVisibleTemplates(scrollTop: number) {
  const startIndex = Math.floor(scrollTop / itemHeight) - bufferCount;
  const endIndex = startIndex + visibleCount + bufferCount * 2;
  
  return templates.slice(
    Math.max(0, startIndex),
    Math.min(templates.length, endIndex)
  );
}
```

---

## 5. 导出流程

### 5.1 PNG 导出

```mermaid
sequenceDiagram
    participant U as 用户
    participant P as Preview
    participant E as Exporter
    participant C as Canvas
    
    U->>P: 点击导出 PNG
    P->>E: 获取 SVG 元素
    E->>E: 应用分辨率缩放
    E->>C: 创建 Canvas
    E->>C: drawImage(SVG)
    C-->>E: 返回 Blob
    E->>E: 下载文件
    E-->>U: 显示成功提示
```

### 5.2 SVG 导出

```mermaid
sequenceDiagram
    participant U as 用户
    participant P as Preview
    participant E as Exporter
    
    U->>P: 点击导出 SVG
    P->>E: 获取 SVG 元素
    E->>E: 序列化 SVG
    E->>E: 添加 XML 声明
    E->>E: 下载文件
    E-->>U: 显示成功提示
```

### 5.3 PDF 导出

```mermaid
sequenceDiagram
    participant U as 用户
    participant P as Preview
    participant E as Exporter
    participant PDF as jsPDF
    
    U->>P: 点击导出 PDF
    P->>E: 获取 SVG 元素
    E->>E: 转换为高分辨率 Canvas
    E->>PDF: 创建 PDF 文档
    PDF->>PDF: 设置页面尺寸
    E->>PDF: 添加图片
    alt 包含标题
        E->>PDF: 添加标题文字
    end
    alt 包含日期
        E->>PDF: 添加日期文字
    end
    PDF-->>E: 返回 Blob
    E->>E: 下载文件
    E-->>U: 显示成功提示
```

---

## 6. Desktop 存储流程

### 6.1 历史记录存储

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as Frontend
    participant T as Tauri
    participant FS as 文件系统
    
    Note over U,FS: 保存历史
    U->>F: 渲染成功
    F->>F: 收集历史条目
    alt Desktop 模式
        F->>T: invoke('save_history', entry)
        T->>FS: 追加到 history.json
        FS-->>T: 成功
        T-->>F: 确认
    end
    
    Note over U,FS: 加载历史
    U->>F: 打开历史面板
    alt Desktop 模式
        F->>T: invoke('load_history', {limit: 20})
        T->>FS: 读取 history.json
        FS-->>T: 历史列表
        T-->>F: 返回列表
        F-->>U: 显示历史列表
    end
```

### 6.2 自定义模板存储

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as Frontend
    participant T as Tauri
    participant FS as 文件系统
    
    U->>F: 点击保存为模板
    F->>F: 收集模板数据
    F->>T: invoke('save_template', template)
    T->>FS: 保存到 templates/{id}.json
    FS-->>T: 成功
    T-->>F: 确认
    F-->>U: 显示保存成功
```

---

## 7. WASM 初始化流程

```mermaid
sequenceDiagram
    participant P as Page
    participant W as WASM
    participant R as Engine Registry
    
    P->>P: 页面加载
    P->>P: 显示加载状态
    P->>W: initWasm()
    
    alt 成功
        W-->>P: 就绪
        P->>R: 初始化引擎
        R-->>P: 返回可用引擎列表
        P->>P: 设置 isWasmReady = true
        P->>P: 隐藏加载状态
        P->>P: 显示编辑器
    else 失败
        W-->>P: 错误
        P->>P: 设置 wasmError
        P->>P: 隐藏加载状态
        P->>P: 显示错误提示
        P->>P: 显示刷新按钮
    end
```

### 7.1 初始化状态管理

```typescript
type WasmStatus = 'idle' | 'loading' | 'ready' | 'error';

interface WasmState {
  status: WasmStatus;
  error: string | null;
  engines: string[];
}

// 初始化 Hook
function useWasmInit() {
  const [state, setState] = useState<WasmState>({
    status: 'idle',
    error: null,
    engines: [],
  });
  
  useEffect(() => {
    setState(s => ({ ...s, status: 'loading' }));
    
    initWasm()
      .then(() => {
        // 获取可用引擎
        const engines = getAvailableEngines();
        setState({ status: 'ready', error: null, engines });
      })
      .catch((err) => {
        setState({ 
          status: 'error', 
          error: err.message, 
          engines: [] 
        });
      });
  }, []);
  
  return state;
}
```

---

## 8. 测试关键路径

| # | 测试场景 | 预期结果 |
|---|----------|---------|
| 1 | 页面首次加载 | WASM 初始化成功，显示编辑器 |
| 2 | WASM 加载失败 | 显示错误提示和刷新按钮 |
| 3 | 输入有效 Mermaid 代码 | 预览区显示渲染结果 |
| 4 | 输入无效语法 | 编辑器显示错误波浪线，错误面板显示详情 |
| 5 | 切换主题 | 图表立即应用新主题 |
| 6 | 调整全局微调参数 | 图表实时更新 |
| 7 | 导出 PNG 2x | 下载双倍分辨率 PNG |
| 8 | 生成分享链接 | URL 更新，可复制分享 |
| 9 | 打开分享链接 | 恢复完整编辑器状态 |
| 10 | PlantUML 服务器超时 | 显示错误，提供重试按钮 |
| 11 | Desktop 保存历史 | 历史记录持久化到本地 |
| 12 | 移动端切换 Tab | 正确显示对应功能 |
## 8. 离线支持流程

### 8.1 离线状态检测

```mermaid
flowchart TD
    A[应用启动] --> B[初始化网络状态]
    B --> C{网络可用?}
    C -->|是| D[设置状态: online]
    C -->|否| E[设置状态: offline]
    
    D --> F[监听 online/offline 事件]
    E --> F
    
    F --> G{网络状态变化}
    G -->|变为 online| H[显示恢复提示]
    G -->|变为 offline| I[显示离线提示]
    I --> J[触发 UI 更新]
```

### 8.2 引擎离线支持

```mermaid
flowchart TD
    A[用户选择引擎] --> B{引擎类型}
    
    B -->|Mermaid| C[直接本地渲染]
    C --> D[无需网络]
    
    B -->|PlantUML| E{网络状态}
    E -->|online| F[请求 PlantUML 服务器]
    E -->|offline| G[显示离线错误]
    F --> H{服务器响应}
    H -->|成功| I[显示渲染结果]
    H -->|失败| J[显示服务器错误]
    G --> K[提示: 请联网后使用 PlantUML]
```

### 8.3 useNetwork Hook

```typescript
interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;  // 曾离线，用于显示恢复提示
}

// Hook 实现
function useNetwork(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);  // 标记曾离线
      setTimeout(() => setWasOffline(false), 5000);  // 5秒后清除
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}
```

### 8.4 离线状态 UI

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [Logo]  UML Styler                    [主题选择] [分享] [导出]  [主题切换] │
│  ⚠️ 离线模式 - Mermaid 可用，PlantUML 需要网络                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐   │
│  │                             │  │                                     │   │
│  │       代码编辑器            │  │          预览区域                   │   │
│  │                             │  │                                     │   │
│  └─────────────────────────────┘  └─────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**离线提示位置:** Header 下方，显示为黄色警告条

**离线提示内容:**
- 离线时: `⚠️ 离线模式 - Mermaid 可用，PlantUML 需要网络`
- 恢复在线时 (5秒): `✅ 网络已恢复`

### 8.5 Mermaid 离线验证

| 场景 | 预期行为 |
|------|---------|
| 完全离线 (无网络) | Mermaid 正常渲染，无需网络 |
| 首次加载 (有缓存) | Mermaid 从缓存加载，正常工作 |
| 首次加载 (无缓存) | 需要网络加载 Mermaid 库，之后可离线使用 |
| 离线后恢复网络 | 自动检测，无需刷新 |

**关键点:**
- Mermaid 是纯客户端库，一旦加载完成就不需要网络
- 只需在首次加载时联网，之后可完全离线使用
- PlantUML 需要连接到 PlantUML 服务器，无法离线工作

---

## 9. 测试关键路径

| # | 测试场景 | 预期结果 |
|---|----------|---------|
| 1 | 页面首次加载 | WASM 初始化成功，显示编辑器 |
| 2 | WASM 加载失败 | 显示错误提示和刷新按钮 |
| 3 | 输入有效 Mermaid 代码 | 预览区显示渲染结果 |
| 4 | 输入无效语法 | 编辑器显示错误波浪线，错误面板显示详情 |
| 5 | 切换主题 | 图表立即应用新主题 |
| 6 | 调整全局微调参数 | 图表实时更新 |
| 7 | 导出 PNG 2x | 下载双倍分辨率 PNG |
| 8 | 生成分享链接 | URL 更新，可复制分享 |
| 9 | 打开分享链接 | 恢复完整编辑器状态 |
| 10 | PlantUML 服务器超时 | 显示错误，提供重试按钮 |
| 11 | Desktop 保存历史 | 历史记录持久化到本地 |
| 12 | 移动端切换 Tab | 正确显示对应功能 |
| 13 | 离线状态打开页面 | 显示离线提示，Mermaid 正常渲染 |
| 14 | 离线选择 PlantUML 引擎 | 显示需要网络的错误提示 |
| 15 | 从离线恢复网络 | 显示恢复提示，PlantUML 恢复正常 |
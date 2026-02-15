# JSON Extractor - 功能流程设计

## 用户操作流程

```mermaid
flowchart TD
    A[进入页面] --> B[输入JSON]
    B --> C{JSON有效?}
    C -->|否| D[显示错误提示]
    D --> B
    C -->|是| E[输入Path表达式]
    E --> F{Path有效?}
    F -->|否| G[显示语法错误]
    G --> E
    F -->|是| H[点击Extract]
    H --> I[WASM处理]
    I --> J{提取成功?}
    J -->|否| K[显示提取错误]
    K --> E
    J -->|是| L[显示结果]
    L --> M[选择输出格式]
    M --> N[复制/下载]
```

## 组件交互时序

```mermaid
sequenceDiagram
    actor User
    participant UI as Web UI
    participant WASM as WASM Module
    participant Tool as JsonExtractor

    User->>UI: 粘贴JSON
    UI->>UI: 本地JSON验证
    UI-->>User: 显示验证状态

    User->>UI: 输入Path
    UI->>UI: Path语法检查

    User->>UI: 点击Extract
    UI->>UI: 显示加载状态
    UI->>WASM: initWasm()
    WASM-->>UI: 初始化完成
    UI->>WASM: new JsonExtractor()
    WASM-->>UI: 返回实例
    UI->>WASM: extract(json, paths)
    WASM->>Tool: extract()
    Tool-->>WASM: 返回结果
    WASM-->>UI: 序列化结果
    UI-->>User: 显示输出
```

## 状态机

```mermaid
stateDiagram-v2
    [*] --> Idle: 页面加载
    Idle --> Inputting: 用户输入JSON
    Inputting --> Valid: JSON验证通过
    Inputting --> Invalid: JSON验证失败
    Invalid --> Inputting: 修正JSON
    Valid --> Extracting: 点击Extract
    Extracting --> Success: 提取成功
    Extracting --> Error: 提取失败
    Error --> Valid: 修正Path
    Success --> Idle: 点击Clear
    Success --> Downloading: 点击Download
    Success --> Copying: 点击Copy
    Downloading --> Success: 完成
    Copying --> Success: 完成
```

## 错误处理路径

| 错误类型 | 触发条件 | 用户反馈 | 恢复操作 |
|----------|----------|----------|----------|
| JSON语法错误 | 输入无效JSON | 红色边框 + 底部提示 | 修正JSON |
| Path语法错误 | 路径表达式无效 | 路径框红色 + 建议 | 修正Path |
| 路径不存在 | Path不匹配任何字段 | Toast通知 | 使用自动检测 |
| 提取异常 | WASM内部错误 | 错误详情弹窗 | 重试 |
| 空结果 | 路径存在但值为null | 黄色提示 | 检查JSON结构 |

## 异步操作状态

### WASM初始化
```
状态: idle -> loading -> ready | error
- idle: 未初始化
- loading: 正在加载WASM文件
- ready: 可以调用工具方法
- error: 加载失败，显示重试按钮
```

### 提取操作
```
状态: idle -> validating -> extracting -> success | error
- idle: 等待输入
- validating: 本地验证JSON和Path
- extracting: WASM执行提取（可取消）
- success: 显示结果
- error: 显示错误信息
```

## 性能考虑

1. **防抖处理**: JSON输入防抖500ms后验证
2. **节流处理**: Path输入建议节流300ms
3. **懒加载**: WASM模块首次使用时加载
4. **缓存**: 相同输入结果缓存（LRU，最大10条）
5. **虚拟滚动**: 结果数组过大时使用虚拟滚动

## 边界情况

1. **超大JSON**: >10MB时提示警告，>50MB时拒绝处理
2. **深层嵌套**: 超过20层时显示警告
3. **特殊字符**: 支持Unicode和emoji的JSON
4. **空输入**: 禁用Extract按钮
5. **浏览器刷新**: 保留输入内容（sessionStorage）

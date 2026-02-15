# JSON Extractor - 状态机说明

## 核心状态

### 应用级别状态

```
┌─────────────────────────────────────────┐
│           AppState                      │
├─────────────────────────────────────────┤
│ - wasmReady: boolean                    │
│ - currentTool: string                   │
│ - theme: 'light' | 'dark' | 'system'    │
└─────────────────────────────────────────┘
```

### 提取器级别状态

```
┌─────────────────────────────────────────┐
│        ExtractorState                   │
├─────────────────────────────────────────┤
│ - input: string                         │
│ - inputStatus: 'empty' | 'valid' | 'invalid' │
│ - paths: string[]                       │
│ - pathsStatus: 'empty' | 'valid' | 'invalid' │
│ - operation: OperationState             │
│ - output: OutputState                   │
└─────────────────────────────────────────┘
```

### 操作状态

```
OperationState =
  | { status: 'idle' }
  | { status: 'validating' }
  | { status: 'extracting', cancelToken: () => void }
  | { status: 'success', result: any, duration: number }
  | { status: 'error', error: Error, type: ErrorType }
```

### 输出状态

```
OutputState =
  | { status: 'empty' }
  | { status: 'ready', data: any, format: Format }
  | { status: 'formatted', content: string }
```

## 状态转换图

```
                    ┌─────────────┐
                    │    Idle     │
                    └──────┬──────┘
                           │ input change
                           ▼
                    ┌─────────────┐
            ┌───────│ Validating  │───────┐
            │       └──────┬──────┘       │
            │              │              │
       invalid            valid      still validating
            │              │              │
            ▼              ▼              ▼
     ┌────────────┐ ┌────────────┐ ┌───────────┐
     │  Invalid   │ │   Valid    │ │ Validating│
     └─────┬──────┘ └─────┬──────┘ └─────┬─────┘
           │              │              │
           └──────────────┼──────────────┘
                          │ extract()
                          ▼
                   ┌──────────────┐
                   │  Extracting  │
                   └──────┬───────┘
                          │
              ┌───────────┴───────────┐
              │                       │
           success                  error
              │                       │
              ▼                       ▼
       ┌───────────┐           ┌───────────┐
       │  Success  │           │   Error   │
       └─────┬─────┘           └─────┬─────┘
             │                       │
             │ clear()               │ retry()
             ▼                       ▼
       ┌───────────┐           ┌───────────┐
       │   Idle    │◄──────────│   Valid   │
       └───────────┘           └───────────┘
```

## 事件处理

### 输入事件

| 事件 | 当前状态 | 动作 | 新状态 |
|------|----------|------|--------|
| JSON输入 | Idle | 验证JSON | Validating |
| JSON输入 | Validating | 防抖验证 | Validating |
| JSON输入 | Valid | 重新验证 | Validating |
| Path输入 | Valid | 验证Path | Validating |
| Path输入 | Invalid | 验证Path | Validating |

### 操作事件

| 事件 | 当前状态 | 动作 | 新状态 |
|------|----------|------|--------|
| Extract | Valid | 调用WASM | Extracting |
| Cancel | Extracting | 取消操作 | Valid |
| Clear | * | 重置所有 | Idle |
| Format切换 | Success | 重新格式化 | Success |

## 状态派生

### UI派生状态

```typescript
// 是否可以执行提取
const canExtract = 
  state.inputStatus === 'valid' && 
  state.pathsStatus === 'valid' &&
  state.operation.status !== 'extracting';

// 是否显示加载
const isLoading = 
  state.operation.status === 'extracting' ||
  state.inputStatus === 'validating';

// 是否有错误
const hasError = 
  state.operation.status === 'error' ||
  state.inputStatus === 'invalid' ||
  state.pathsStatus === 'invalid';

// 是否可以导出
const canExport = 
  state.operation.status === 'success';
```

### 副作用

```typescript
// WASM初始化副作用
useEffect(() => {
  if (!wasmReady) {
    initWasm().then(() => setWasmReady(true));
  }
}, [wasmReady]);

// 输入验证副作用
useEffect(() => {
  const timer = setTimeout(() => {
    validateInput(input).then(setInputStatus);
  }, 500);
  return () => clearTimeout(timer);
}, [input]);

// 提取操作副作用
useEffect(() => {
  if (operation.status === 'extracting') {
    performExtraction()
      .then(result => setOperation({ status: 'success', result }))
      .catch(error => setOperation({ status: 'error', error }));
  }
}, [operation.status]);
```

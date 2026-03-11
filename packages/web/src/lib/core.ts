// WASM bindings for ShardDen

import init, { JsonExtractor as WasmJsonExtractor, ping, version, render_diagram } from '@/../public/wasm/shard_den_wasm.js';

// Types
export type WasmResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface UmlRenderResult {
  svg?: string;
  error?: string;
  engine: string;
}

export type WasmState = 'idle' | 'loading' | 'ready' | 'error';

// Configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 500;
const MAX_DELAY_MS = 4000;

export interface WasmInitOptions {
  /** 强制重新初始化 */
  force?: boolean;
  /** 初始化成功回调 */
  onReady?: () => void;
  /** 初始化失败回调 */
  onError?: (error: WasmInitError) => void;
  /** 重试回调 */
  onRetry?: (attempt: number, maxRetries: number) => void;
}

// State
let wasmState: WasmState = 'idle';
let wasmReady = false;
let initPromise: Promise<void> | null = null;

// Error Classes
export class WasmInitError extends Error {
  public readonly retries: number;
  public readonly lastError: Error | unknown;

  constructor(message: string, retries: number, lastError: Error | unknown) {
    super(message);
    this.name = 'WasmInitError';
    this.retries = retries;
    this.lastError = lastError;
  }
}

export class WasmNotReadyError extends Error {
  constructor() {
    super('WASM not initialized. Call initWasm() first.');
    this.name = 'WasmNotReadyError';
  }
}

export class WasmOperationError extends Error {
  public readonly operation: string;

  constructor(operation: string, cause: Error | unknown) {
    super(`WASM operation failed: ${operation}`, { cause });
    this.name = 'WasmOperationError';
    this.operation = operation;
  }
}

// Core Functions
function getRetryDelay(attempt: number): number {
  const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
  return Math.min(delay, MAX_DELAY_MS);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function initWasm(options: WasmInitOptions = {}): Promise<void> {
  const { force = false, onReady, onError, onRetry } = options;
  
  if (wasmReady && !force) {
    onReady?.();
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = doInitWasm(force, onRetry);
  
  try {
    await initPromise;
    onReady?.();
  } catch (err) {
    wasmState = 'idle';
    initPromise = null;
    const error = err instanceof WasmInitError 
      ? err 
      : new WasmInitError('WASM init failed', 0, err);
    onError?.(error);
    throw error;
  }
}

async function doInitWasm(force: boolean, onRetry?: (attempt: number, maxRetries: number) => void): Promise<void> {
  if (wasmReady && !force) {
    return;
  }

  wasmState = 'loading';
  let lastError: Error | unknown = new Error('Unknown error');

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // 调用重试回调
    onRetry?.(attempt + 1, MAX_RETRIES);
    
    try {
      await init();
      
      try {
        ping();
      } catch {
        // ping might fail if WASM doesn't export it
      }
      
      wasmReady = true;
      wasmState = 'ready';
      return;
    } catch (error) {
      lastError = error;
      
      console.warn(
        `[WASM] Initialization attempt ${attempt + 1}/${MAX_RETRIES} failed:`,
        error
      );

      if (attempt < MAX_RETRIES - 1) {
        const delay = getRetryDelay(attempt);
        console.log(`[WASM] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  wasmState = 'error';
  const errorMessage = lastError instanceof Error 
    ? lastError.message 
    : String(lastError);
  
  throw new WasmInitError(
    `WASM initialization failed after ${MAX_RETRIES} attempts: ${errorMessage}`,
    MAX_RETRIES,
    lastError
  );
}

export function getWasmState(): WasmState {
  return wasmState;
}

export function isWasmReady(): boolean {
  return wasmReady;
}

export function getWasm() {
  if (!wasmReady) {
    throw new WasmNotReadyError();
  }
  return {
    JsonExtractor: WasmJsonExtractor,
    ping,
    version,
    render_diagram,
  };
}

export function tryGetWasm(): WasmResult<ReturnType<typeof getWasm>> {
  if (!wasmReady) {
    return { 
      success: false, 
      error: 'WASM not initialized. Call initWasm() first.' 
    };
  }
  
  try {
    return { success: true, data: getWasm() };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}

// JsonExtractor
export const JsonExtractor = {
  async create() {
    await initWasm();
    const wasm = getWasm();
    return new wasm.JsonExtractor();
  },

  async extract(
    json: string, 
    paths: string, 
    format: string
  ): Promise<string> {
    await initWasm();
    const wasm = getWasm();
    const extractor = new wasm.JsonExtractor();
    
    try {
      return extractor.extract_with_format(json, paths, format);
    } catch (e) {
      throw new WasmOperationError('extract', e instanceof Error ? e : new Error(String(e)));
    }
  },

  async detect(json: string): Promise<string[]> {
    await initWasm();
    const wasm = getWasm();
    const extractor = new wasm.JsonExtractor();
    
    try {
      const result = extractor.detect_paths(json);
      return JSON.parse(result);
    } catch (e) {
      throw new WasmOperationError('detect_paths', e instanceof Error ? e : new Error(String(e)));
    }
  },
};

// UmlStyler
export const UmlStyler = {
  async render(
    engine: string, 
    code: string, 
    theme: string
  ): Promise<UmlRenderResult> {
    await initWasm();
    const wasm = getWasm();
    
    try {
      const result = wasm.render_diagram(engine, code, theme);
      
      if (typeof result === 'string') {
        if (result.includes('<svg') || result.includes('<?xml')) {
          return { svg: result, engine };
        }
        if (result.toLowerCase().includes('error') || result.toLowerCase().includes('fail')) {
          return { error: result, engine };
        }
        return { svg: result, engine };
      }
      
      return result as UmlRenderResult;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { error: message, engine };
    }
  },
};

export async function getVersion(): Promise<string> {
  await initWasm();
  const wasm = getWasm();
  return wasm.version();
}

export async function healthCheck(): Promise<boolean> {
  if (!wasmReady) {
    return false;
  }
  
  try {
    const wasm = getWasm();
    wasm.ping();
    return true;
  } catch {
    return false;
  }
}

// WASM bindings for ShardDen
// This file loads the WASM module and exports tool classes

// Mock implementation for development (will be replaced by real WASM when built)
class MockJsonExtractor {
  extract(json: string, paths: string): string { 
    try {
      JSON.parse(json);
      return '[]';
    } catch { return '[]'; }
  }
  extract_with_format(json: string, paths: string, format: string): string { 
    return this.extract(json, paths);
  }
  detect_paths(json: string): string { 
    try {
      const obj = JSON.parse(json);
      const paths: string[] = [];
      const findPaths = (o: any, prefix: string = '') => {
        if (Array.isArray(o)) {
          o.forEach((item, i) => findPaths(item, `${prefix}[${i}]`));
        } else if (o && typeof o === 'object') {
          Object.keys(o).forEach(k => {
            const p = prefix ? `${prefix}.${k}` : k;
            paths.push(p);
            findPaths(o[k], p);
          });
        }
      };
      findPaths(obj);
      return JSON.stringify(paths);
    } catch { return '[]'; }
  }
}

let wasmModule: any = null;

export async function initWasm(): Promise<void> {
  if (wasmModule) return;
  
  // Use mock for now - WASM will be added when built
  wasmModule = {
    JsonExtractor: MockJsonExtractor,
    version: () => '0.1.0',
    ping: () => 'pong',
  };
}

export function getWasm() {
  if (!wasmModule) {
    throw new Error('WASM not initialized. Call initWasm() first.');
  }
  return wasmModule;
}

// Re-export tool classes
export const JsonExtractor = {
  async create() {
    await initWasm();
    const wasm = getWasm();
    return new wasm.JsonExtractor();
  },
};

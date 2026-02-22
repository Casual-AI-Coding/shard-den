// WASM bindings for ShardDen
// This file loads the WASM module and exports tool classes

import init, { JsonExtractor as WasmJsonExtractor, ping, version } from '@/../public/wasm/shard_den_wasm.js';

let wasmReady = false;

export async function initWasm(): Promise<void> {
  if (wasmReady) return;
  
  // Load the real WASM module
  await init();
  wasmReady = true;
}

export function getWasm() {
  if (!wasmReady) {
    throw new Error('WASM not initialized. Call initWasm() first.');
  }
  return {
    JsonExtractor: WasmJsonExtractor,
    ping,
    version,
  };
}

// Re-export tool classes - create new instance each time to avoid wasm-bindgen refcount bug
export const JsonExtractor = {
  async create() {
    await initWasm();
    const wasm = getWasm();
    return new wasm.JsonExtractor();
  },
  
  // Create and use a new extractor for each operation
  async extract(json: string, paths: string, format: string): Promise<string> {
    await initWasm();
    const wasm = getWasm();
    const extractor = new wasm.JsonExtractor();
    try {
      return extractor.extract_with_format(json, paths, format);
    } finally {
      // Clean up - let JS GC handle it
    }
  },
  
  async detect(json: string): Promise<string[]> {
    await initWasm();
    const wasm = getWasm();
    const extractor = new wasm.JsonExtractor();
    try {
      const result = extractor.detect_paths(json);
      return JSON.parse(result);
    } finally {
      // Clean up
    }
  },
};

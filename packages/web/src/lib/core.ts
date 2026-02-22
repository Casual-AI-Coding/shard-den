// WASM bindings for ShardDen
// This file loads the WASM module and exports tool classes

import init, { JsonExtractor as WasmJsonExtractor, ping, version } from '@/../public/wasm/shard_den_wasm.js';

let wasmModule: typeof import('@/../public/wasm/shard_den_wasm.js') | null = null;
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

// Re-export tool classes
export const JsonExtractor = {
  async create() {
    await initWasm();
    const wasm = getWasm();
    return new wasm.JsonExtractor();
  },
};

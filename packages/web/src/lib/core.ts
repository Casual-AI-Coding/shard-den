// WASM bindings for ShardDen
// This file loads the WASM module and exports tool classes

let wasmModule: typeof import('../../../wasm/pkg') | null = null;

export async function initWasm(): Promise<void> {
  if (wasmModule) return;
  
  // Dynamic import of WASM
  const wasm = await import('../../../wasm/pkg');
  wasmModule = wasm;
  wasm.start?.();
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

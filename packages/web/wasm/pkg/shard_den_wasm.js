// Mock WASM module for build
export class JsonExtractor {
  constructor() {}
  
  extract(json: string, paths: string): string {
    return JSON.stringify({ error: 'WASM not loaded' });
  }
  
  extract_with_format(json: string, paths: string, format: string): string {
    return JSON.stringify({ error: 'WASM not loaded' });
  }
  
  detect_paths(json: string): string {
    return JSON.stringify({ error: 'WASM not loaded' });
  }
  
  get name(): string {
    return 'json-extractor';
  }
  
  get description(): string {
    return 'Extract fields from JSON using path syntax';
  }
}

export function start() {}
export function version(): string { return '0.1.0'; }
export function ping(): string { return 'pong'; }

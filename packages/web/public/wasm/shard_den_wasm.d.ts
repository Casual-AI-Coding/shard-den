/* tslint:disable */
/* eslint-disable */

/**
 * WASM-compatible JSON Extractor
 */
export class JsonExtractor {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Auto-detect available paths in JSON
     */
    detect_paths(json: string): string;
    /**
     * Extract fields from JSON
     */
    extract(json: string, paths: string): string;
    /**
     * Extract with format
     */
    extract_with_format(json: string, paths: string, format: string): string;
    /**
     * Create a new extractor
     */
    constructor();
    readonly description: string;
    readonly name: string;
}

/**
 * 获取版本号
 */
export function get_version(): string;

/**
 * 初始化 WASM
 */
export function init(): void;

/**
 * Health check
 */
export function ping(): string;

/**
 * 渲染图表
 */
export function render_diagram(engine_name: string, code: string, theme_id: string): any;

/**
 * Initialize the WASM module
 */
export function start(): void;

/**
 * Get version info
 */
export function version(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly ping: (a: number) => void;
    readonly version: (a: number) => void;
    readonly start: () => void;
    readonly get_version: (a: number) => void;
    readonly render_diagram: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly init: () => void;
    readonly __wbg_jsonextractor_free: (a: number, b: number) => void;
    readonly jsonextractor_description: (a: number, b: number) => void;
    readonly jsonextractor_detect_paths: (a: number, b: number, c: number, d: number) => void;
    readonly jsonextractor_extract: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly jsonextractor_extract_with_format: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly jsonextractor_name: (a: number, b: number) => void;
    readonly jsonextractor_new: () => number;
    readonly __wbindgen_export: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export2: (a: number, b: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;

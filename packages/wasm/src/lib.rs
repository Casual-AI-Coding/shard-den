//! ShardDen WASM - WebAssembly bindings for all tools
//!
//! This crate re-exports all tool functionality as WASM-compatible modules.
//! Web and Desktop both use this single WASM bundle.

mod utils;

use wasm_bindgen::prelude::*;

// Re-export utils
pub use utils::*;

// Re-export tools
pub use shard_den_json_extractor::JsonExtractor;

/// Initialize the WASM module
#[wasm_bindgen(start)]
pub fn start() {
    utils::set_panic_hook();
}

/// Get version info
#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Health check
#[wasm_bindgen]
pub fn ping() -> String {
    "pong".to_string()
}

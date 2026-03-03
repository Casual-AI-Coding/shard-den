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
pub fn version() -> Result<String, JsValue> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

/// Health check
#[wasm_bindgen]
pub fn ping() -> Result<String, JsValue> {
    Ok("pong".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Test that start() doesn't panic when called
    #[test]
    fn test_start() {
        // start() initializes panic hook, should not panic
        start();
    }

    /// Test version returns a non-empty string
    #[test]
    fn test_version() {
        let version = version().expect("version should return Ok");
        // Version should be non-empty and match semver format
        assert!(!version.is_empty(), "version should not be empty");
        assert!(
            version.contains('.'),
            "version should contain dots for semver"
        );
    }

    /// Test version returns correct format (major.minor.patch)
    #[test]
    fn test_version_format() {
        let version = version().expect("version should return Ok");
        let parts: Vec<&str> = version.split('.').collect();
        assert_eq!(
            parts.len(),
            3,
            "version should have 3 parts (major.minor.patch)"
        );
    }

    /// Test ping returns "pong"
    #[test]
    fn test_ping() {
        let result = ping().expect("ping should return Ok");
        assert_eq!(result, "pong", "ping should return 'pong'");
    }

    /// Test ping is idempotent
    #[test]
    fn test_ping_idempotent() {
        let result1 = ping().expect("first ping should return Ok");
        let result2 = ping().expect("second ping should return Ok");
        assert_eq!(result1, result2, "ping should return same result each time");
    }
}

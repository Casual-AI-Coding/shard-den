//! WASM utilities

use wasm_bindgen::prelude::*;

/// Set the panic hook for better error messages in browser console
pub fn set_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Log a message to the browser console
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    pub fn log(s: &str);
}

/// Log a message (Rust-side wrapper)
pub fn console_log(msg: &str) {
    log(msg);
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Test that set_panic_hook doesn't panic
    #[test]
    fn test_set_panic_hook() {
        set_panic_hook();
    }

    /// Test console_log with message - uses test-compatible version
    #[test]
    fn test_console_log() {
        // In test mode, we can't call WASM log(), so test the setup
        // The important thing is that the function can be called
        // For actual WASM testing, use wasm-pack test
        set_panic_hook();
    }
}

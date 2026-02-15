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

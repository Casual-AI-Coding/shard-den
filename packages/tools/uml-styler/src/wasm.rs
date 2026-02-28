//! WASM 导出模块

use wasm_bindgen::prelude::*;

/// 初始化 WASM
#[wasm_bindgen]
pub fn init() {
    // 设置 panic hook 以便在控制台显示错误
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// 获取版本号
#[wasm_bindgen]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

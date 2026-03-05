//! WASM 导出模块

use crate::engine::{D2Engine, EngineRegistry, MermaidEngine, PlantUmlEngine};
use crate::theme::{Theme, ThemeCategory, ThemeTuning};
use wasm_bindgen::prelude::*;
use once_cell::sync::Lazy;

static REGISTRY: Lazy<EngineRegistry> = Lazy::new(|| {
    let mut registry = EngineRegistry::new();
    registry.register(Box::new(MermaidEngine::new()));
    registry.register(Box::new(PlantUmlEngine::new()));
    registry.register(Box::new(D2Engine::new()));
    registry
});

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

/// 渲染图表
#[wasm_bindgen]
pub fn render_diagram(engine_name: &str, code: &str, theme_id: &str) -> Result<JsValue, JsValue> {
    let engine = REGISTRY
        .get_engine(engine_name)
        .ok_or_else(|| JsValue::from_str(&format!("Engine not found: {}", engine_name)))?;

    // 构造基础 Theme 对象
    // 注意：目前未传递 ThemeTuning，如果需要完整支持，需扩展此函数接收 theme object
    let theme = Theme {
        id: theme_id.to_string(),
        name: theme_id.to_string(),
        category: ThemeCategory::Shared,
        tuning: ThemeTuning::default(),
    };

    let result = engine
        .render(code, &theme)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(serde_wasm_bindgen::to_value(&result)?)
}

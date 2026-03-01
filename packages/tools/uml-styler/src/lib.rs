//! ShardDen UML Styler - UML 图表编辑器
//!
//! 支持多种图表语言的在线编辑器，主打"一键美化"和"灵活导出"

pub mod engine;
pub mod error;
pub mod templates;
pub mod theme;

#[cfg(feature = "wasm")]
mod wasm;

// Re-exports
pub use engine::{DiagramType, Engine, EngineRegistry, RenderHint};
pub use error::{Diagnostic, EngineError, Severity};
pub use templates::{get_mermaid_templates, Template};
pub use theme::{Theme, ThemeCategory, ThemeTuning};

#[cfg(feature = "wasm")]
pub use wasm::*;

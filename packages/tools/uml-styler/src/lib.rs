//! ShardDen UML Styler - UML 图表编辑器
//!
//! 支持多种图表语言的在线编辑器，主打"一键美化"和"灵活导出"

pub mod engine;
pub mod error;
pub mod theme;
pub mod templates;

#[cfg(feature = "wasm")]
mod wasm;

// Re-exports
pub use engine::{DiagramType, Engine, EngineRegistry, RenderHint};
pub use error::{EngineError, Diagnostic, Severity};
pub use theme::{Theme, ThemeCategory, ThemeTuning};
pub use templates::Template;

#[cfg(feature = "wasm")]
pub use wasm::*;

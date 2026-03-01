//! 主题系统模块
//!
//! 支持共享主题和独立主题，以及全局微调参数
//!
//! 模块结构:
//! - data.rs: 主题数据结构 (Theme, ThemeTuning, ThemeCategory)
//! - transformer.rs: 主题转换器 (ThemeTransformer)
//! - shared: 共享主题
//! - mermaid: Mermaid 专用主题

pub mod data;
pub mod mermaid;
pub mod shared;
pub mod transformer;

// Re-exports for backward compatibility
pub use data::{Theme, ThemeCategory, ThemeTuning};
pub use transformer::ThemeTransformer;

/// 获取所有主题
pub fn get_all_themes() -> Vec<Theme> {
    let mut themes = shared::get_shared_themes();
    themes.extend(mermaid::get_mermaid_themes());
    themes
}

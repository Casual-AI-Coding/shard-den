//! 主题数据模块
//!
//! 包含主题定义和相关数据结构

use std::fmt::Debug;

#[cfg(feature = "wasm")]
use serde::{Deserialize, Serialize};

/// 主题分类
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "wasm", derive(Serialize, Deserialize))]
pub enum ThemeCategory {
    /// 共享主题 - 同时应用到所有引擎
    Shared,
    /// Mermaid 独立主题
    MermaidSpecific,
    /// PlantUML 独立主题
    PlantUMLSpecific,
}

/// 全局微调参数
#[derive(Debug, Clone, Default)]
#[cfg_attr(feature = "wasm", derive(Serialize, Deserialize))]
pub struct ThemeTuning {
    /// 主色调 (十六进制颜色)
    pub primary_color: Option<String>,
    /// 背景色
    pub background_color: Option<String>,
    /// 字体族
    pub font_family: Option<String>,
    /// 字号 (px)
    pub font_size: Option<u16>,
    /// 线条粗细
    pub line_width: Option<u16>,
    /// 文字颜色
    pub text_color: Option<String>,
}

impl ThemeTuning {
    pub fn with_font_family(mut self, family: impl Into<String>) -> Self {
        self.font_family = Some(family.into());
        self
    }

    pub fn with_font_size(mut self, size: u16) -> Self {
        self.font_size = Some(size);
        self
    }

    pub fn with_line_width(mut self, width: u16) -> Self {
        self.line_width = Some(width);
        self
    }

    pub fn with_text_color(mut self, color: impl Into<String>) -> Self {
        self.text_color = Some(color.into());
        self
    }
}

/// 主题
#[derive(Debug, Clone)]
#[cfg_attr(feature = "wasm", derive(Serialize, Deserialize))]
pub struct Theme {
    /// 主题 ID (格式: "shared/default", "mermaid/forest")
    pub id: String,
    /// 主题显示名称
    pub name: String,
    /// 主题分类
    pub category: ThemeCategory,
    /// 全局微调参数
    #[cfg_attr(feature = "wasm", serde(default))]
    pub tuning: ThemeTuning,
}

impl Default for Theme {
    fn default() -> Self {
        Self {
            id: "shared/default".to_string(),
            name: "Default".to_string(),
            category: ThemeCategory::Shared,
            tuning: ThemeTuning::default(),
        }
    }
}

impl Theme {
    /// 创建新主题
    pub fn new(id: impl Into<String>, name: impl Into<String>, category: ThemeCategory) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            category,
            tuning: ThemeTuning::default(),
        }
    }

    /// 应用微调参数
    pub fn with_tuning(mut self, tuning: ThemeTuning) -> Self {
        self.tuning = tuning;
        self
    }

    /// 设置主色调
    pub fn with_primary_color(mut self, color: impl Into<String>) -> Self {
        self.tuning.primary_color = Some(color.into());
        self
    }

    /// 设置背景色
    pub fn with_background_color(mut self, color: impl Into<String>) -> Self {
        self.tuning.background_color = Some(color.into());
        self
    }

    /// 设置文字颜色
    pub fn with_text_color(mut self, color: impl Into<String>) -> Self {
        self.tuning.text_color = Some(color.into());
        self
    }

    /// 设置字体族
    pub fn with_font_family(mut self, family: impl Into<String>) -> Self {
        self.tuning.font_family = Some(family.into());
        self
    }

    /// 设置字号
    pub fn with_font_size(mut self, size: u16) -> Self {
        self.tuning.font_size = Some(size);
        self
    }

    /// 设置线条粗细
    pub fn with_line_width(mut self, width: u16) -> Self {
        self.tuning.line_width = Some(width);
        self
    }
}

/// 主题数据别名
pub type ThemeData = Theme;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_theme_default() {
        let theme = Theme::default();
        assert_eq!(theme.id, "shared/default");
        assert_eq!(theme.category, ThemeCategory::Shared);
    }

    #[test]
    fn test_theme_new() {
        let theme = Theme::new("mermaid/forest", "Forest", ThemeCategory::MermaidSpecific);
        assert_eq!(theme.id, "mermaid/forest");
        assert_eq!(theme.name, "Forest");
        assert_eq!(theme.category, ThemeCategory::MermaidSpecific);
    }

    #[test]
    fn test_theme_with_tuning() {
        let theme = Theme::default()
            .with_primary_color("#3B82F6")
            .with_background_color("#FFFFFF");

        assert_eq!(theme.tuning.primary_color, Some("#3B82F6".to_string()));
        assert_eq!(theme.tuning.background_color, Some("#FFFFFF".to_string()));
    }

    #[test]
    fn test_theme_with_font_family() {
        let theme = Theme::default().with_font_family("Inter");
        assert_eq!(theme.tuning.font_family, Some("Inter".to_string()));
    }

    #[test]
    fn test_theme_with_font_size() {
        let theme = Theme::default().with_font_size(14);
        assert_eq!(theme.tuning.font_size, Some(14));
    }

    #[test]
    fn test_theme_with_line_width() {
        let theme = Theme::default().with_line_width(2);
        assert_eq!(theme.tuning.line_width, Some(2));
    }

    #[test]
    fn test_theme_tuning_builder() {
        let tuning = ThemeTuning::default()
            .with_font_family("Arial")
            .with_font_size(12)
            .with_line_width(3)
            .with_text_color("#000000");

        assert_eq!(tuning.font_family, Some("Arial".to_string()));
        assert_eq!(tuning.font_size, Some(12));
        assert_eq!(tuning.line_width, Some(3));
        assert_eq!(tuning.text_color, Some("#000000".to_string()));
    }
}

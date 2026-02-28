//! 主题系统模块
//!
//! 支持共享主题和独立主题，以及全局微调参数

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

    /// 转换为 Mermaid 主题配置
    /// 返回 (主题名, themeVariables)
    pub fn to_mermaid_config(&self) -> (String, Option<String>) {
        // 从 ID 提取 Mermaid 主题名
        let theme_name = if self.id.starts_with("mermaid/") {
            self.id
                .strip_prefix("mermaid/")
                .unwrap_or("default")
                .to_string()
        } else if self.id.starts_with("shared/") {
            // 共享主题映射到 Mermaid 主题
            match self.id.as_str() {
                "shared/dark" => "dark".to_string(),
                _ => "default".to_string(),
            }
        } else {
            "default".to_string()
        };

        // 构建 themeVariables
        let mut variables = Vec::new();
        if let Some(ref color) = self.tuning.primary_color {
            variables.push(format!("primaryColor '{}'", color));
        }
        if let Some(ref color) = self.tuning.background_color {
            variables.push(format!("background '{}'", color));
        }
        if let Some(ref family) = self.tuning.font_family {
            variables.push(format!("fontFamily '{}'", family));
        }
        if let Some(ref color) = self.tuning.text_color {
            variables.push(format!("primaryTextColor '{}'", color));
        }

        let theme_variables = if variables.is_empty() {
            None
        } else {
            Some(format!(
                "themeVariables: {{\n  {}\n}}",
                variables.join(",\n  ")
            ))
        };

        (theme_name, theme_variables)
    }

    /// 转换为 PlantUML 主题配置
    /// 返回主题名和 skinParam
    pub fn to_plantuml_config(&self) -> (String, Option<String>) {
        // 从 ID 提取 PlantUML 主题名
        let theme_name = if self.id.starts_with("plantuml/") {
            self.id
                .strip_prefix("plantuml/")
                .unwrap_or("cerulean")
                .to_string()
        } else if self.id.starts_with("shared/") {
            // 共享主题映射到 PlantUML 主题
            match self.id.as_str() {
                "shared/dark" => "dark".to_string(),
                "shared/sketchy" => "sketchy".to_string(),
                _ => "cerulean".to_string(),
            }
        } else {
            "cerulean".to_string()
        };

        // 构建 skinParam
        let mut params = Vec::new();
        if let Some(ref color) = self.tuning.primary_color {
            params.push(format!("ArrowColor {}", color));
            params.push(format!("ActorBorderColor {}", color));
        }
        if let Some(ref color) = self.tuning.background_color {
            params.push(format!("BackgroundColor {}", color));
        }
        if let Some(ref family) = self.tuning.font_family {
            params.push(format!("FontName {}", family));
        }
        if let Some(ref color) = self.tuning.text_color {
            params.push(format!("FontColor {}", color));
        }

        let skin_params = if params.is_empty() {
            None
        } else {
            Some(
                params
                    .iter()
                    .map(|p| format!("skinparam {}", p))
                    .collect::<Vec<_>>()
                    .join("\n"),
            )
        };

        (theme_name, skin_params)
    }
}

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
    fn test_theme_to_mermaid_config() {
        let theme = Theme::new("mermaid/forest", "Forest", ThemeCategory::MermaidSpecific);
        let (name, vars) = theme.to_mermaid_config();
        assert_eq!(name, "forest");
        assert!(vars.is_none());
    }

    #[test]
    fn test_theme_to_mermaid_config_with_tuning() {
        let theme = Theme::default().with_primary_color("#3B82F6");
        let (name, vars) = theme.to_mermaid_config();
        assert_eq!(name, "default");
        assert!(vars.is_some());
        assert!(vars.unwrap().contains("primaryColor '#3B82F6'"));
    }

    #[test]
    fn test_theme_to_plantuml_config() {
        let theme = Theme::new(
            "plantuml/sketchy",
            "Sketchy",
            ThemeCategory::PlantUMLSpecific,
        );
        let (name, params) = theme.to_plantuml_config();
        assert_eq!(name, "sketchy");
        assert!(params.is_none());
    }

    #[test]
    fn test_theme_to_plantuml_config_with_tuning() {
        let theme = Theme::default().with_primary_color("#3B82F6");
        let (name, params) = theme.to_plantuml_config();
        assert_eq!(name, "cerulean");
        assert!(params.is_some());
        assert!(params.unwrap().contains("ArrowColor #3B82F6"));
    }
}

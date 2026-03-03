//! 主题转换器模块
//!
//! 负责将主题应用到不同的输出格式

use super::data::{Theme, ThemeTuning};

/// 主题转换器
pub struct ThemeTransformer {
    theme: Theme,
}

impl ThemeTransformer {
    /// 创建新的主题转换器
    pub fn new(theme: Theme) -> Self {
        Self { theme }
    }

    /// 从主题创建
    pub fn from(theme: Theme) -> Self {
        Self { theme }
    }

    /// 转换为 Mermaid 主题配置
    /// 返回 (主题名, themeVariables)
    pub fn to_mermaid_config(&self) -> (String, Option<String>) {
        let theme = &self.theme;

        // 从 ID 提取 Mermaid 主题名
        let theme_name = if theme.id.starts_with("mermaid/") {
            theme
                .id
                .strip_prefix("mermaid/")
                .unwrap_or("default")
                .to_string()
        } else if theme.id.starts_with("shared/") {
            // 共享主题映射到 Mermaid 主题
            match theme.id.as_str() {
                "shared/dark" => "dark".to_string(),
                _ => "default".to_string(),
            }
        } else {
            "default".to_string()
        };

        // 构建 themeVariables
        let variables = Self::build_theme_variables(&theme.tuning);

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

    ///  主题配置
    /// 返回主题名和 skinParam转换为 PlantUML
    pub fn to_plantuml_config(&self) -> (String, Option<String>) {
        let theme = &self.theme;

        // 从 ID 提取 PlantUML 主题名
        let theme_name = if theme.id.starts_with("plantuml/") {
            theme
                .id
                .strip_prefix("plantuml/")
                .unwrap_or("cerulean")
                .to_string()
        } else if theme.id.starts_with("shared/") {
            // 共享主题映射到 PlantUML 主题
            match theme.id.as_str() {
                "shared/dark" => "dark".to_string(),
                "shared/sketchy" => "sketchy".to_string(),
                _ => "cerulean".to_string(),
            }
        } else {
            "cerulean".to_string()
        };

        // 构建 skinParam
        let params = Self::build_skin_params(&theme.tuning);

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

    /// 应用到 CSS
    pub fn apply_to_css(&self, css: &str) -> String {
        let tuning = &self.theme.tuning;
        let mut result = css.to_string();

        if let Some(ref color) = tuning.primary_color {
            result = result.replace("--primary-color", color);
        }
        if let Some(ref color) = tuning.background_color {
            result = result.replace("--background-color", color);
        }
        if let Some(ref color) = tuning.text_color {
            result = result.replace("--text-color", color);
        }
        if let Some(ref family) = tuning.font_family {
            result = result.replace("--font-family", family);
        }
        if let Some(size) = tuning.font_size {
            result = result.replace("--font-size", &format!("{}px", size));
        }
        if let Some(width) = tuning.line_width {
            result = result.replace("--line-width", &format!("{}px", width));
        }

        result
    }

    /// 构建 Mermaid 主题变量
    fn build_theme_variables(tuning: &ThemeTuning) -> Vec<String> {
        let mut variables = Vec::new();

        if let Some(ref color) = tuning.primary_color {
            variables.push(format!("primaryColor '{}'", color));
        }
        if let Some(ref color) = tuning.background_color {
            variables.push(format!("background '{}'", color));
        }
        if let Some(ref family) = tuning.font_family {
            variables.push(format!("fontFamily '{}'", family));
        }
        if let Some(ref color) = tuning.text_color {
            variables.push(format!("primaryTextColor '{}'", color));
        }

        variables
    }

    /// 构建 PlantUML skin 参数
    fn build_skin_params(tuning: &ThemeTuning) -> Vec<String> {
        let mut params = Vec::new();

        if let Some(ref color) = tuning.primary_color {
            params.push(format!("ArrowColor {}", color));
            params.push(format!("ActorBorderColor {}", color));
        }
        if let Some(ref color) = tuning.background_color {
            params.push(format!("BackgroundColor {}", color));
        }
        if let Some(ref family) = tuning.font_family {
            params.push(format!("FontName {}", family));
        }
        if let Some(ref color) = tuning.text_color {
            params.push(format!("FontColor {}", color));
        }

        params
    }
}

impl From<Theme> for ThemeTransformer {
    fn from(theme: Theme) -> Self {
        ThemeTransformer::new(theme)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::theme::ThemeCategory;

    #[test]
    fn test_to_mermaid_config() {
        let theme = Theme::new("mermaid/forest", "Forest", ThemeCategory::MermaidSpecific);
        let transformer = ThemeTransformer::new(theme);
        let (name, vars) = transformer.to_mermaid_config();
        assert_eq!(name, "forest");
        assert!(vars.is_none());
    }

    #[test]
    fn test_to_mermaid_config_with_tuning() {
        let theme = Theme::default().with_primary_color("#3B82F6");
        let transformer = ThemeTransformer::new(theme);
        let (name, vars) = transformer.to_mermaid_config();
        assert_eq!(name, "default");
        assert!(vars.is_some());
        assert!(vars.unwrap().contains("primaryColor '#3B82F6'"));
    }

    #[test]
    fn test_to_plantuml_config() {
        let theme = Theme::new(
            "plantuml/sketchy",
            "Sketchy",
            ThemeCategory::PlantUMLSpecific,
        );
        let transformer = ThemeTransformer::new(theme);
        let (name, params) = transformer.to_plantuml_config();
        assert_eq!(name, "sketchy");
        assert!(params.is_none());
    }

    #[test]
    fn test_to_plantuml_config_with_tuning() {
        let theme = Theme::default().with_primary_color("#3B82F6");
        let transformer = ThemeTransformer::new(theme);
        let (name, params) = transformer.to_plantuml_config();
        assert_eq!(name, "cerulean");
        assert!(params.is_some());
        assert!(params.unwrap().contains("ArrowColor #3B82F6"));
    }

    #[test]
    fn test_to_mermaid_config_shared_dark() {
        let theme = Theme::new("shared/dark", "Dark", ThemeCategory::Shared);
        let transformer = ThemeTransformer::new(theme);
        let (name, _) = transformer.to_mermaid_config();
        assert_eq!(name, "dark");
    }

    #[test]
    fn test_to_plantuml_config_plantuml_sketchy() {
        let theme = Theme::new(
            "plantuml/sketchy",
            "Sketchy",
            ThemeCategory::PlantUMLSpecific,
        );
        let transformer = ThemeTransformer::new(theme);
        let (name, _) = transformer.to_plantuml_config();
        assert_eq!(name, "sketchy");
    }

    #[test]
    fn test_to_mermaid_config_with_all_tuning() {
        let theme = Theme::default()
            .with_primary_color("#3B82F6")
            .with_background_color("#FFFFFF")
            .with_text_color("#000000");
        let transformer = ThemeTransformer::new(theme);
        let (name, vars) = transformer.to_mermaid_config();
        assert_eq!(name, "default");
        let vars = vars.unwrap();
        assert!(vars.contains("primaryColor '#3B82F6'"));
        assert!(vars.contains("background '#FFFFFF'"));
        assert!(vars.contains("primaryTextColor '#000000'"));
    }

    #[test]
    fn test_to_plantuml_config_with_all_tuning() {
        let theme = Theme::default()
            .with_primary_color("#3B82F6")
            .with_background_color("#FFFFFF")
            .with_text_color("#000000")
            .with_font_family("Arial");
        let transformer = ThemeTransformer::new(theme);
        let (name, params) = transformer.to_plantuml_config();
        assert_eq!(name, "cerulean");
        let params = params.unwrap();
        assert!(params.contains("ArrowColor #3B82F6"));
        assert!(params.contains("BackgroundColor #FFFFFF"));
        assert!(params.contains("FontColor #000000"));
        assert!(params.contains("FontName Arial"));
    }

    #[test]
    fn test_theme_transformer_from() {
        let theme = Theme::default();
        let transformer: ThemeTransformer = theme.into();
        let (name, _) = transformer.to_mermaid_config();
        assert_eq!(name, "default");
    }

    // Tests for apply_to_css
    #[test]
    fn test_apply_to_css_basic() {
        let theme = Theme::default();
        let transformer = ThemeTransformer::new(theme);
        let css = "body { color: var(--text-color); }".to_string();
        let result = transformer.apply_to_css(&css);
        // Default theme has no tuning, so should return unchanged
        assert!(result.contains("text-color"));
    }

    #[test]
    fn test_apply_to_css_with_primary_color() {
        let theme = Theme::default().with_primary_color("#FF0000");
        let transformer = ThemeTransformer::new(theme);
        let css = "div { background: var(--primary-color); }".to_string();
        let result = transformer.apply_to_css(&css);
        assert!(result.contains("#FF0000"));
        assert!(!result.contains("primary-color"));
    }

    #[test]
    fn test_apply_to_css_with_background_color() {
        let theme = Theme::default().with_background_color("#FFFFFF");
        let transformer = ThemeTransformer::new(theme);
        let css = "body { background: var(--background-color); }".to_string();
        let result = transformer.apply_to_css(&css);
        assert!(result.contains("#FFFFFF"));
    }

    #[test]
    fn test_apply_to_css_with_text_color() {
        let theme = Theme::default().with_text_color("#000000");
        let transformer = ThemeTransformer::new(theme);
        let css = "p { color: var(--text-color); }".to_string();
        let result = transformer.apply_to_css(&css);
        assert!(result.contains("#000000"));
    }

    #[test]
    fn test_apply_to_css_with_font_family() {
        let theme = Theme::default().with_font_family("Arial");
        let transformer = ThemeTransformer::new(theme);
        let css = "body { font-family: var(--font-family); }".to_string();
        let result = transformer.apply_to_css(&css);
        assert!(result.contains("Arial"));
    }

    #[test]
    fn test_apply_to_css_with_font_size() {
        let theme = Theme::default().with_font_size(16);
        let transformer = ThemeTransformer::new(theme);
        let css = "body { font-size: var(--font-size); }".to_string();
        let result = transformer.apply_to_css(&css);
        assert!(result.contains("16px"));
    }

    #[test]
    fn test_apply_to_css_with_line_width() {
        let theme = Theme::default().with_line_width(2);
        let transformer = ThemeTransformer::new(theme);
        let css = "svg { stroke-width: var(--line-width); }".to_string();
        let result = transformer.apply_to_css(&css);
        assert!(result.contains("2px"));
    }

    #[test]
    fn test_apply_to_css_with_all_tunings() {
        let theme = Theme::default()
            .with_primary_color("#FF0000")
            .with_background_color("#FFFFFF")
            .with_text_color("#000000")
            .with_font_family("Arial")
            .with_font_size(14)
            .with_line_width(1);
        let transformer = ThemeTransformer::new(theme);
        let css = "div { color: var(--text-color); background: var(--primary-color); font-family: var(--font-family); font-size: var(--font-size); }".to_string();
        let result = transformer.apply_to_css(&css);
        assert!(result.contains("#FF0000"));
        assert!(result.contains("#FFFFFF"));
        assert!(result.contains("#000000"));
        assert!(result.contains("14px"));
        assert!(!result.contains("primary-color"));
    }

    #[test]  
    fn test_theme_transformer_from() {
        let theme = Theme::default();
        let transformer: ThemeTransformer = theme.into();
        let (name, _) = transformer.to_mermaid_config();
        assert_eq!(name, "default");
    }
}

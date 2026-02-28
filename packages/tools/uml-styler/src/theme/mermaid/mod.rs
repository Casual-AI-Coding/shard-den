//! Mermaid 独立主题

use crate::theme::{Theme, ThemeCategory};

/// 获取所有 Mermaid 独立主题
pub fn get_mermaid_themes() -> Vec<Theme> {
    vec![
        default_theme(),
        dark_theme(),
        forest_theme(),
        neutral_theme(),
    ]
}

/// Mermaid 默认主题
pub fn default_theme() -> Theme {
    Theme::new("mermaid/default", "Default", ThemeCategory::MermaidSpecific)
}

/// Mermaid 暗黑主题
pub fn dark_theme() -> Theme {
    Theme::new("mermaid/dark", "Dark", ThemeCategory::MermaidSpecific)
}

/// Mermaid 森林主题
pub fn forest_theme() -> Theme {
    Theme::new("mermaid/forest", "Forest", ThemeCategory::MermaidSpecific)
}

/// Mermaid 中性主题
pub fn neutral_theme() -> Theme {
    Theme::new("mermaid/neutral", "Neutral", ThemeCategory::MermaidSpecific)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_mermaid_themes_count() {
        let themes = get_mermaid_themes();
        assert!(themes.len() >= 4);
    }

    #[test]
    fn test_mermaid_default_theme() {
        let theme = default_theme();
        assert_eq!(theme.id, "mermaid/default");
        assert_eq!(theme.name, "Default");
    }

    #[test]
    fn test_mermaid_dark_theme() {
        let theme = dark_theme();
        assert_eq!(theme.id, "mermaid/dark");
        assert_eq!(theme.name, "Dark");
    }

    #[test]
    fn test_mermaid_forest_theme() {
        let theme = forest_theme();
        assert_eq!(theme.id, "mermaid/forest");
        assert_eq!(theme.name, "Forest");
    }

    #[test]
    fn test_mermaid_neutral_theme() {
        let theme = neutral_theme();
        assert_eq!(theme.id, "mermaid/neutral");
        assert_eq!(theme.name, "Neutral");
    }
}

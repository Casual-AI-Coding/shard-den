//! 共享主题 - 同时应用到所有引擎

use crate::theme::{Theme, ThemeCategory};

/// 获取所有共享主题
pub fn get_shared_themes() -> Vec<Theme> {
    vec![
        default_theme(),
        dark_theme(),
        business_theme(),
        sketchy_theme(),
        minimal_theme(),
        colorful_theme(),
    ]
}

/// 默认主题
pub fn default_theme() -> Theme {
    Theme::new("shared/default", "Default", ThemeCategory::Shared)
}

/// 暗黑主题
pub fn dark_theme() -> Theme {
    Theme::new("shared/dark", "Dark", ThemeCategory::Shared)
        .with_background_color("#1E1E1E")
        .with_text_color("#FFFFFF")
}

/// 商务蓝主题
pub fn business_theme() -> Theme {
    Theme::new("shared/business", "Business Blue", ThemeCategory::Shared)
        .with_primary_color("#2563EB")
}

/// 手绘风主题
pub fn sketchy_theme() -> Theme {
    Theme::new("shared/sketchy", "Sketchy", ThemeCategory::Shared)
        .with_font_family("Comic Sans MS, cursive")
}

/// 极简主题
pub fn minimal_theme() -> Theme {
    Theme::new("shared/minimal", "Minimal", ThemeCategory::Shared)
}

/// 彩虹主题
pub fn colorful_theme() -> Theme {
    Theme::new("shared/colorful", "Colorful", ThemeCategory::Shared).with_primary_color("#E11D48")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_shared_themes_count() {
        let themes = get_shared_themes();
        assert!(themes.len() >= 6);
    }

    #[test]
    fn test_default_theme() {
        let theme = default_theme();
        assert_eq!(theme.id, "shared/default");
        assert_eq!(theme.name, "Default");
    }

    #[test]
    fn test_dark_theme_has_custom_colors() {
        let theme = dark_theme();
        assert_eq!(theme.tuning.background_color, Some("#1E1E1E".to_string()));
        assert_eq!(theme.tuning.text_color, Some("#FFFFFF".to_string()));
    }

    #[test]
    fn test_business_theme_has_primary_color() {
        let theme = business_theme();
        assert_eq!(theme.tuning.primary_color, Some("#2563EB".to_string()));
    }

    #[test]
    fn test_sketchy_theme_has_font_family() {
        let theme = sketchy_theme();
        assert_eq!(
            theme.tuning.font_family,
            Some("Comic Sans MS, cursive".to_string())
        );
    }
}

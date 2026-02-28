//! 主题和模板测试

use shard_den_uml_styler::templates::get_mermaid_templates;
use shard_den_uml_styler::theme::{get_all_themes, mermaid, shared};

#[test]
fn test_shared_themes_count() {
    let themes = shared::get_shared_themes();
    assert!(themes.len() >= 6);
}

#[test]
fn test_mermaid_themes_count() {
    let themes = mermaid::get_mermaid_themes();
    assert!(themes.len() >= 4);
}

#[test]
fn test_all_themes() {
    let themes = get_all_themes();
    assert!(themes.len() >= 10);
}

#[test]
fn test_mermaid_templates_count() {
    let templates = get_mermaid_templates();
    assert!(templates.len() >= 5);
}

#[test]
fn test_template_has_diagram_type() {
    let templates = get_mermaid_templates();
    for template in templates {
        assert!(!template.id.is_empty());
        assert!(!template.name.is_empty());
        assert!(!template.code.is_empty());
    }
}

#[test]
fn test_dark_theme_has_custom_colors() {
    let theme = shared::dark_theme();
    assert!(theme.tuning.background_color.is_some());
    assert!(theme.tuning.text_color.is_some());
}

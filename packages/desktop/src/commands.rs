//! Tauri commands for desktop functionality
//!
//! These commands are exposed to the frontend via IPC.
//

use shard_den_core::{Config, HistoryEntry, UmlStylerConfig};
use shard_den_json_extractor::JsonExtractorCore;
use tauri::State;

use crate::storage::{Storage, UmlTemplate, UmlTheme};

/// Application state
pub struct AppState {
    pub storage: Storage,
}

/// Get application version
#[tauri::command]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Save configuration
#[tauri::command]
pub fn save_config(config: Config, state: State<'_, AppState>) -> Result<(), String> {
    state
        .storage
        .save_config(&config)
        .map_err(|e| e.to_string())
}

/// Load configuration
#[tauri::command]
pub fn load_config(state: State<'_, AppState>) -> Result<Config, String> {
    state.storage.load_config().map_err(|e| e.to_string())
}

/// Save history entry
#[tauri::command]
pub fn save_history(entry: HistoryEntry, state: State<'_, AppState>) -> Result<(), String> {
    state.storage.add_history(entry).map_err(|e| e.to_string())
}

/// Load history entries
#[tauri::command]
pub fn load_history(
    tool: Option<String>, limit: usize, state: State<'_, AppState>,
) -> Result<Vec<HistoryEntry>, String> {
    state
        .storage
        .list_history(tool.as_deref(), limit)
        .map_err(|e| e.to_string())
}

/// Clear all history
#[tauri::command]
pub fn clear_history(state: State<'_, AppState>) -> Result<(), String> {
    state.storage.clear_history().map_err(|e| e.to_string())
}

/// Detect paths in JSON
#[tauri::command]
pub fn detect_paths(json: String) -> Result<Vec<String>, String> {
    let extractor = JsonExtractorCore::new();
    extractor.detect_paths(&json).map_err(|e| e.to_string())
}

/// Extract JSON using paths
#[tauri::command]
pub fn extract_json(json: String, paths: String) -> Result<String, String> {
    let extractor = JsonExtractorCore::new();
    extractor.extract(&json, &paths).map_err(|e| e.to_string())
}

/// Extract JSON with format
#[tauri::command]
pub fn extract_json_with_format(
    json: String, paths: String, format: String,
) -> Result<String, String> {
    use shard_den_json_extractor::OutputFormat;

    let output_format = match format.to_lowercase().as_str() {
        "csv" => OutputFormat::Csv,
        "text" => OutputFormat::Text,
        "yaml" => OutputFormat::Yaml,
        _ => OutputFormat::Json,
    };

    let extractor = JsonExtractorCore::new();
    extractor
        .extract_with_format(&json, &paths, output_format)
        .map_err(|e| e.to_string())
}

// ==================== UML Styler Commands ====================

/// Save UML template
#[tauri::command]
pub fn save_uml_template(template: UmlTemplate, state: State<'_, AppState>) -> Result<(), String> {
    state
        .storage
        .save_uml_template(template)
        .map_err(|e| e.to_string())
}

/// Load all UML templates
#[tauri::command]
pub fn load_uml_templates(state: State<'_, AppState>) -> Result<Vec<UmlTemplate>, String> {
    state
        .storage
        .load_uml_templates()
        .map_err(|e| e.to_string())
}

/// Delete UML template by ID
#[tauri::command]
pub fn delete_uml_template(id: String, state: State<'_, AppState>) -> Result<(), String> {
    state
        .storage
        .delete_uml_template(&id)
        .map_err(|e| e.to_string())
}

/// Save custom UML theme
#[tauri::command]
pub fn save_uml_theme(theme: UmlTheme, state: State<'_, AppState>) -> Result<(), String> {
    state
        .storage
        .save_uml_theme(theme)
        .map_err(|e| e.to_string())
}

/// Load all custom UML themes
#[tauri::command]
pub fn load_uml_themes(state: State<'_, AppState>) -> Result<Vec<UmlTheme>, String> {
    state.storage.load_uml_themes().map_err(|e| e.to_string())
}

/// Delete custom UML theme by ID
#[tauri::command]
pub fn delete_uml_theme(id: String, state: State<'_, AppState>) -> Result<(), String> {
    state
        .storage
        .delete_uml_theme(&id)
        .map_err(|e| e.to_string())
}

/// Save UML Styler configuration
#[tauri::command]
pub fn save_uml_config(config: UmlStylerConfig, state: State<'_, AppState>) -> Result<(), String> {
    state
        .storage
        .save_uml_config(&config)
        .map_err(|e| e.to_string())
}

/// Load UML Styler configuration
#[tauri::command]
pub fn load_uml_config(state: State<'_, AppState>) -> Result<UmlStylerConfig, String> {
    state.storage.load_uml_config().map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn create_storage() -> (Storage, TempDir) {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let storage = Storage::with_data_dir(temp_dir.path().to_path_buf());
        (storage, temp_dir)
    }

    #[test]
    fn test_get_version() {
        let version = get_version();
        assert!(!version.is_empty());
    }

    #[test]
    fn test_save_and_load_config() {
        let (storage, _temp_dir) = create_storage();
        let config = Config::default();
        storage.save_config(&config).unwrap();
        let loaded = storage.load_config().unwrap();
        assert_eq!(config.history.max_entries, loaded.history.max_entries);
    }

    #[test]
    fn test_save_and_load_history() {
        let (storage, _temp_dir) = create_storage();
        let entry = HistoryEntry::new("test", "input", "output", false);
        storage.add_history(entry).unwrap();
        let history = storage.list_history(None, 10).unwrap();
        assert_eq!(history.len(), 1);
    }

    #[test]
    fn test_load_history_with_filter() {
        let (storage, _temp_dir) = create_storage();
        storage
            .add_history(HistoryEntry::new("tool-a", "i1", "o1", false))
            .unwrap();
        storage
            .add_history(HistoryEntry::new("tool-b", "i2", "o2", false))
            .unwrap();
        let tool_a = storage.list_history(Some("tool-a"), 10).unwrap();
        assert_eq!(tool_a.len(), 1);
    }

    #[test]
    fn test_clear_history() {
        let (storage, _temp_dir) = create_storage();
        storage
            .add_history(HistoryEntry::new("test", "input", "output", false))
            .unwrap();
        storage.clear_history().unwrap();
        let history = storage.list_history(None, 10).unwrap();
        assert!(history.is_empty());
    }

    #[test]
    fn test_detect_paths() {
        let json = r#"{"name": "test"}"#.to_string();
        let result = detect_paths(json);
        assert!(result.is_ok());
    }

    #[test]
    fn test_extract_json() {
        let json = r#"{"name": "test"}"#.to_string();
        let paths = "$.name".to_string();
        let result = extract_json(json, paths);
        assert!(result.is_ok());
    }

    #[test]
    fn test_extract_json_with_format() {
        let json = r#"{"name": "test"}"#.to_string();
        let paths = "$.name".to_string();
        let result = extract_json_with_format(json, paths, "json".to_string());
        assert!(result.is_ok());
    }

    #[test]
    fn test_extract_json_with_format_csv() {
        let json = r#"[{"name": "a"}, {"name": "b"}]"#.to_string();
        let paths = "$[*].name".to_string();
        let result = extract_json_with_format(json, paths, "csv".to_string());
        assert!(result.is_ok());
    }

    #[test]
    fn test_extract_json_with_format_text() {
        let json = r#"{"name": "test"}"#.to_string();
        let paths = "$.name".to_string();
        let result = extract_json_with_format(json, paths, "text".to_string());
        assert!(result.is_ok());
    }

    #[test]
    fn test_extract_json_with_format_yaml() {
        let json = r#"{"name": "test"}"#.to_string();
        let paths = "$.name".to_string();
        let result = extract_json_with_format(json, paths, "yaml".to_string());
        assert!(result.is_ok());
    }

    #[test]
    fn test_extract_json_invalid_json() {
        let json = "not json".to_string();
        let paths = "$.name".to_string();
        let result = extract_json(json, paths);
        assert!(result.is_err());
    }

    // UML Styler command tests
    #[test]
    fn test_save_and_load_uml_template() {
        let (storage, _temp_dir) = create_storage();
        let template = UmlTemplate::new(
            "Test".to_string(),
            "Desc".to_string(),
            "code".to_string(),
            "mermaid".to_string(),
        );
        storage.save_uml_template(template).unwrap();
        let templates = storage.load_uml_templates().unwrap();
        assert_eq!(templates.len(), 1);
    }

    #[test]
    fn test_delete_uml_template() {
        let (storage, _temp_dir) = create_storage();
        let template = UmlTemplate::new(
            "Test".to_string(),
            "Desc".to_string(),
            "code".to_string(),
            "mermaid".to_string(),
        );
        storage.save_uml_template(template).unwrap();
        let templates = storage.load_uml_templates().unwrap();
        let id = templates[0].id.clone();
        storage.delete_uml_template(&id).unwrap();
        let templates = storage.load_uml_templates().unwrap();
        assert!(templates.is_empty());
    }

    #[test]
    fn test_save_and_load_uml_theme() {
        let (storage, _temp_dir) = create_storage();
        let theme = UmlTheme::new(
            "Dark".to_string(),
            "shared".to_string(),
            serde_json::json!({"primary": "#000"}),
        );
        storage.save_uml_theme(theme).unwrap();
        let themes = storage.load_uml_themes().unwrap();
        assert_eq!(themes.len(), 1);
    }

    #[test]
    fn test_delete_uml_theme() {
        let (storage, _temp_dir) = create_storage();
        let theme = UmlTheme::new(
            "Test".to_string(),
            "shared".to_string(),
            serde_json::json!({}),
        );
        storage.save_uml_theme(theme).unwrap();
        let themes = storage.load_uml_themes().unwrap();
        let id = themes[0].id.clone();
        storage.delete_uml_theme(&id).unwrap();
        let themes = storage.load_uml_themes().unwrap();
        assert!(themes.is_empty());
    }

    #[test]
    fn test_save_and_load_uml_config() {
        let (storage, _temp_dir) = create_storage();
        let config = UmlStylerConfig::default();
        storage.save_uml_config(&config).unwrap();
        let loaded = storage.load_uml_config().unwrap();
        assert_eq!(loaded.default_theme, "shared/default");
    }
}

//! Tauri commands for desktop functionality
//!
//! These commands are exposed to the frontend via IPC.

use shard_den_core::{Config, HistoryEntry};
use shard_den_json_extractor::JsonExtractorCore;
use tauri::State;

use crate::storage::Storage;

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

#[cfg(test)]
mod tests {
    use super::*;
    use shard_den_core::config::Theme;
    use std::path::PathBuf;

    /// Temp directory for tests
    struct TempDir(PathBuf);

    impl TempDir {
        fn new() -> std::io::Result<Self> {
            let path = std::env::temp_dir()
                .join(format!("shard-den-commands-test-{}", std::process::id()));
            std::fs::create_dir_all(&path)?;
            Ok(Self(path))
        }

        fn path(&self) -> &PathBuf {
            &self.0
        }
    }

    impl Drop for TempDir {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    /// Create Storage with temp directory for testing
    fn create_storage() -> Storage {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        Storage {
            data_dir: temp_dir.path().to_path_buf(),
        }
    }

    #[test]
    fn test_get_version() {
        let version = get_version();
        // Version should not be empty
        assert!(!version.is_empty());
        // Version should match the pattern X.Y.Z
        let parts: Vec<&str> = version.split('.').collect();
        assert!(parts.len() >= 2, "Version should have at least X.Y format");
    }

    #[test]
    fn test_save_and_load_config() {
        let storage = create_storage();

        // Save config
        let config = Config::default();
        let result = storage.save_config(&config);
        assert!(
            result.is_ok(),
            "save_config should succeed: {:?}",
            result.err()
        );

        // Load config
        let loaded = storage.load_config();
        assert!(
            loaded.is_ok(),
            "load_config should succeed: {:?}",
            loaded.err()
        );
        assert_eq!(
            loaded.unwrap().history.max_entries,
            config.history.max_entries
        );
    }

    #[test]
    fn test_load_config_empty() {
        let storage = create_storage();

        // Load config that doesn't exist - should return default
        let loaded = storage.load_config();
        assert!(
            loaded.is_ok(),
            "load_config should succeed: {:?}",
            loaded.err()
        );
        assert_eq!(loaded.unwrap().history.max_entries, 1000);
    }

    #[test]
    fn test_save_and_load_custom_config() {
        let storage = create_storage();

        // Create custom config
        let mut config = Config::default();
        config.history.enabled = false;
        config.history.max_entries = 500;
        config.ui.theme = Theme::Dark;
        config.ui.language = "en-US".to_string();

        // Save config
        let result = storage.save_config(&config);
        assert!(
            result.is_ok(),
            "save_config should succeed: {:?}",
            result.err()
        );

        // Load config
        let loaded = storage.load_config().unwrap();
        assert_eq!(loaded.history.enabled, false);
        assert_eq!(loaded.history.max_entries, 500);
        assert_eq!(loaded.ui.theme, Theme::Dark);
        assert_eq!(loaded.ui.language, "en-US");
    }

    #[test]
    fn test_save_and_load_history() {
        let storage = create_storage();

        // Save history entry
        let entry = HistoryEntry::new("json-extractor", "{}", "result", false);
        let result = storage.add_history(entry.clone());
        assert!(
            result.is_ok(),
            "add_history should succeed: {:?}",
            result.err()
        );

        // Load history
        let history = storage.list_history(None, 10);
        assert!(
            history.is_ok(),
            "list_history should succeed: {:?}",
            history.err()
        );
        assert_eq!(history.unwrap().len(), 1);
    }

    #[test]
    fn test_load_history_with_tool_filter() {
        let storage = create_storage();

        // Add entries for different tools
        let entry1 = HistoryEntry::new("json-extractor", "{}", "result1", false);
        let entry2 = HistoryEntry::new("json-extractor", "{}", "result2", false);
        let entry3 = HistoryEntry::new("other-tool", "{}", "result3", false);

        storage.add_history(entry1).unwrap();
        storage.add_history(entry2).unwrap();
        storage.add_history(entry3).unwrap();

        // Filter by tool
        let json_history = storage.list_history(Some("json-extractor"), 10).unwrap();
        assert_eq!(json_history.len(), 2);

        let other_history = storage.list_history(Some("other-tool"), 10).unwrap();
        assert_eq!(other_history.len(), 1);
    }

    #[test]
    fn test_load_history_with_limit() {
        let storage = create_storage();

        // Add multiple entries
        for i in 0..5 {
            let entry = HistoryEntry::new(
                "tool",
                &format!("input{}", i),
                &format!("output{}", i),
                false,
            );
            storage.add_history(entry).unwrap();
        }

        // Test limit
        let history = storage.list_history(None, 3).unwrap();
        assert_eq!(history.len(), 3);
    }

    #[test]
    fn test_clear_history() {
        let storage = create_storage();

        // Add some entries
        let entry = HistoryEntry::new("json-extractor", "{}", "result", false);
        storage.add_history(entry).unwrap();

        // Verify entry exists
        let history = storage.list_history(None, 10).unwrap();
        assert_eq!(history.len(), 1);

        // Clear history
        let result = storage.clear_history();
        assert!(
            result.is_ok(),
            "clear_history should succeed: {:?}",
            result.err()
        );

        // Verify history is empty
        let history = storage.list_history(None, 10).unwrap();
        assert!(history.is_empty());
    }

    #[test]
    fn test_detect_paths_valid_json() {
        let json = r#"{"name": "test", "age": 30, "items": [1, 2, 3]}"#;
        let result = detect_paths(json.to_string());
        assert!(
            result.is_ok(),
            "detect_paths should succeed: {:?}",
            result.err()
        );
        let paths = result.unwrap();
        assert!(!paths.is_empty());
        // Should contain root level keys
        assert!(paths.iter().any(|p| p.contains("name")));
        assert!(paths.iter().any(|p| p.contains("age")));
    }

    #[test]
    fn test_detect_paths_nested_json() {
        let json = r#"{"user": {"profile": {"name": "John"}}}"#;
        let result = detect_paths(json.to_string());
        assert!(
            result.is_ok(),
            "detect_paths should succeed: {:?}",
            result.err()
        );
        let paths = result.unwrap();
        // Should contain nested path
        assert!(paths
            .iter()
            .any(|p| p.contains("user") && p.contains("profile")));
    }

    #[test]
    fn test_detect_paths_invalid_json() {
        let json = "not valid json".to_string();
        let result = detect_paths(json);
        assert!(result.is_err(), "detect_paths should fail for invalid JSON");
    }

    #[test]
    fn test_extract_json_valid() {
        let json = r#"{"name": "test", "value": 42}"#;
        let paths = "name".to_string();
        let result = extract_json(json.to_string(), paths);
        assert!(
            result.is_ok(),
            "extract_json should succeed: {:?}",
            result.err()
        );
        let extracted = result.unwrap();
        assert!(extracted.contains("test"));
    }

    #[test]
    fn test_extract_json_multiple_paths() {
        let json = r#"{"name": "test", "value": 42}"#;
        let paths = "name,value".to_string();
        let result = extract_json(json.to_string(), paths);
        assert!(
            result.is_ok(),
            "extract_json should succeed: {:?}",
            result.err()
        );
    }

    #[test]
    fn test_extract_json_invalid_json() {
        let json = "not valid json".to_string();
        let paths = "name".to_string();
        let result = extract_json(json, paths);
        assert!(result.is_err(), "extract_json should fail for invalid JSON");
    }

    #[test]
    fn test_extract_json_with_format_json() {
        let json = r#"{"name": "test", "value": 42}"#;
        let paths = "name".to_string();
        let format = "json".to_string();
        let result = extract_json_with_format(json.to_string(), paths, format);
        assert!(
            result.is_ok(),
            "extract_json_with_format should succeed: {:?}",
            result.err()
        );
    }

    #[test]
    fn test_extract_json_with_format_csv() {
        let json = r#"[{"name": "test1"}, {"name": "test2"}]"#;
        let paths = "name".to_string();
        let format = "csv".to_string();
        let result = extract_json_with_format(json.to_string(), paths, format);
        assert!(
            result.is_ok(),
            "extract_json_with_format csv should succeed: {:?}",
            result.err()
        );
    }

    #[test]
    fn test_extract_json_with_format_text() {
        let json = r#"{"name": "test", "value": 42}"#;
        let paths = "name".to_string();
        let format = "text".to_string();
        let result = extract_json_with_format(json.to_string(), paths, format);
        assert!(
            result.is_ok(),
            "extract_json_with_format text should succeed: {:?}",
            result.err()
        );
    }

    #[test]
    fn test_extract_json_with_format_yaml() {
        let json = r#"{"name": "test", "value": 42}"#;
        let paths = "name".to_string();
        let format = "yaml".to_string();
        let result = extract_json_with_format(json.to_string(), paths, format);
        assert!(
            result.is_ok(),
            "extract_json_with_format yaml should succeed: {:?}",
            result.err()
        );
    }

    #[test]
    fn test_extract_json_with_format_default() {
        let json = r#"{"name": "test", "value": 42}"#;
        let paths = "name".to_string();
        let format = "invalid_format".to_string();
        let result = extract_json_with_format(json.to_string(), paths, format);
        // Invalid format should default to JSON
        assert!(
            result.is_ok(),
            "extract_json_with_format should default to JSON: {:?}",
            result.err()
        );
    }

    #[test]
    fn test_extract_json_with_format_case_insensitive() {
        let json = r#"{"name": "test"}"#;
        let paths = "name".to_string();
        let format = "JSON".to_string();
        let result = extract_json_with_format(json.to_string(), paths, format);
        assert!(
            result.is_ok(),
            "extract_json_with_format should be case insensitive: {:?}",
            result.err()
        );
    }
}

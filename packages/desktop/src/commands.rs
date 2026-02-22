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

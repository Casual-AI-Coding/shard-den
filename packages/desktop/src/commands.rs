//! Tauri commands for desktop functionality
//!
//! These commands are exposed to the frontend via IPC.

use serde::{Deserialize, Serialize};
use shard_den_core::{Config, HistoryEntry};
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

/// Detect paths in JSON (uses WASM)
#[tauri::command]
pub fn detect_paths(json: String) -> Result<Vec<String>, String> {
    // TODO: Call WASM module
    let _ = json;
    Ok(vec![])
}

/// Extract JSON using paths (uses WASM)
#[tauri::command]
pub fn extract_json(json: String, paths: Vec<String>) -> Result<String, String> {
    // TODO: Call WASM module
    let _ = (json, paths);
    Ok("{}".to_string())
}

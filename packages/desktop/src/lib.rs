//! Desktop app library for ShardDen
//!

use tauri::Manager;

pub mod commands;
pub mod storage;

use commands::AppState;
use commands::*;
use storage::Storage;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_version,
            save_config,
            load_config,
            save_history,
            load_history,
            clear_history,
            detect_paths,
            extract_json,
            extract_json_with_format,
            // UML Styler commands
            save_uml_template,
            load_uml_templates,
            delete_uml_template,
            save_uml_theme,
            load_uml_themes,
            delete_uml_theme,
            save_uml_config,
            load_uml_config,
        ])
        .setup(|app| {
            // Initialize storage directory
            let app_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_dir)?;

            // Initialize storage and register state
            let storage = Storage::new().map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;
            app.manage(AppState { storage });

            tracing::info!("App directory: {:?}", app_dir);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    // Note: The run() function uses Tauri runtime and cannot be unit tested.
    // Integration tests with Tauri would be needed for full coverage.
    // The commands module has its own tests.
}

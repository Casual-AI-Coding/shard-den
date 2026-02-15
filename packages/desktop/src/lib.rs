//! Desktop app library for ShardDen

use tauri::Manager;

pub mod commands;
pub mod storage;

use commands::*;

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
        ])
        .setup(|app| {
            // Initialize storage directory
            let app_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_dir)?;

            tracing::info!("App directory: {:?}", app_dir);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

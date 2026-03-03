//! Storage implementation for desktop app
//!
//! Stores data in the app data directory:
//! - macOS: ~/Library/Application Support/com.shardden.app/
//! - Windows: %APPDATA%/com.shardden.app/
//! - Linux: ~/.local/share/com.shardden.app/

use directories::ProjectDirs;
use shard_den_core::{Config, HistoryEntry};
use std::path::PathBuf;

/// File-based storage for desktop
pub struct Storage {
    data_dir: PathBuf,
}

impl Storage {
    /// Create new storage instance
    pub fn new() -> shard_den_core::Result<Self> {
        let proj_dirs = ProjectDirs::from("com", "shardden", "app").ok_or_else(|| {
            shard_den_core::ShardDenError::Config(
                "Could not determine app data directory".to_string(),
            )
        })?;

        let data_dir = proj_dirs.data_dir().to_path_buf();
        std::fs::create_dir_all(&data_dir)?;

        Ok(Self { data_dir })
    }

    /// Get path to config file
    fn config_path(&self) -> PathBuf {
        self.data_dir.join("config.json")
    }

    /// Get path to history file
    fn history_path(&self) -> PathBuf {
        self.data_dir.join("history.json")
    }

    /// Save configuration
    pub fn save_config(&self, config: &Config) -> shard_den_core::Result<()> {
        let path = self.config_path();
        let json = serde_json::to_string_pretty(config)?;
        std::fs::write(path, json)?;
        Ok(())
    }

    /// Load configuration
    pub fn load_config(&self) -> shard_den_core::Result<Config> {
        let path = self.config_path();
        if !path.exists() {
            return Ok(Config::default());
        }
        let json = std::fs::read_to_string(path)?;
        let config = serde_json::from_str(&json)?;
        Ok(config)
    }

    /// Add history entry
    pub fn add_history(&self, entry: HistoryEntry) -> shard_den_core::Result<()> {
        let mut entries = self.load_history_entries()?;
        entries.push(entry);

        // Keep only last 1000 entries
        if entries.len() > 1000 {
            entries = entries.split_off(entries.len() - 1000);
        }

        // Limit file size to 10MB
        let json = serde_json::to_string(&entries)?;
        if json.len() > 10 * 1024 * 1024 {
            entries = entries.split_off(entries.len() - 500);
        }

        self.save_history_entries(&entries)
    }

    /// List history entries

    /// List history entries
    pub fn list_history(
        &self, tool: Option<&str>, limit: usize,
    ) -> shard_den_core::Result<Vec<HistoryEntry>> {
        let entries = self.load_history_entries()?;

        let filtered: Vec<_> = entries
            .into_iter()
            .filter(|e| tool.map_or(true, |t| e.tool == t))
            .rev()
            .take(limit)
            .collect();

        Ok(filtered)
    }

    /// Clear all history
    pub fn clear_history(&self) -> shard_den_core::Result<()> {
        self.save_history_entries(&[])
    }

    fn load_history_entries(&self) -> shard_den_core::Result<Vec<HistoryEntry>> {
        let path = self.history_path();
        if !path.exists() {
            return Ok(vec![]);
        }
        let json = std::fs::read_to_string(path)?;
        let entries = serde_json::from_str(&json)?;
        Ok(entries)
    }

    fn save_history_entries(&self, entries: &[HistoryEntry]) -> shard_den_core::Result<()> {
        let path = self.history_path();
        let json = serde_json::to_string_pretty(entries)?;
        std::fs::write(path, json)?;
        Ok(())
    }

    /// Create storage with custom data directory (for testing only)
    #[cfg(test)]
    pub fn with_data_dir(data_dir: PathBuf) -> Self {
        std::fs::create_dir_all(&data_dir).expect("Failed to create data dir");
        Self { data_dir }
    }
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
    fn test_save_and_load_config() {
        let (storage, _temp_dir) = create_storage();
        let config = Config::default();
        storage.save_config(&config).unwrap();
        let loaded = storage.load_config().unwrap();
        assert_eq!(config.history.max_entries, loaded.history.max_entries);
    }

    #[test]
    fn test_load_config_default() {
        let (storage, _temp_dir) = create_storage();
        // Don't save anything, should return default
        let config = storage.load_config().unwrap();
        assert_eq!(config.history.max_entries, 1000);
    }

    #[test]
    fn test_add_history() {
        let (storage, _temp_dir) = create_storage();
        let entry = HistoryEntry::new("test", "input", "output", false);
        storage.add_history(entry).unwrap();
        let history = storage.list_history(None, 10).unwrap();
        assert_eq!(history.len(), 1);
    }

    #[test]
    fn test_list_history_with_filter() {
        let (storage, _temp_dir) = create_storage();
        storage.add_history(HistoryEntry::new("tool-a", "i1", "o1", false)).unwrap();
        storage.add_history(HistoryEntry::new("tool-b", "i2", "o2", false)).unwrap();
        storage.add_history(HistoryEntry::new("tool-a", "i3", "o3", false)).unwrap();

        let tool_a = storage.list_history(Some("tool-a"), 10).unwrap();
        assert_eq!(tool_a.len(), 2);

        let tool_b = storage.list_history(Some("tool-b"), 10).unwrap();
        assert_eq!(tool_b.len(), 1);
    }

    #[test]
    fn test_list_history_limit() {
        let (storage, _temp_dir) = create_storage();
        for i in 0..10 {
            storage.add_history(HistoryEntry::new("test", &format!("i{}", i), &format!("o{}", i), false)).unwrap();
        }
        let history = storage.list_history(None, 3).unwrap();
        assert_eq!(history.len(), 3);
    }

    #[test]
    fn test_clear_history() {
        let (storage, _temp_dir) = create_storage();
        storage.add_history(HistoryEntry::new("test", "input", "output", false)).unwrap();
        storage.clear_history().unwrap();
        let history = storage.list_history(None, 10).unwrap();
        assert!(history.is_empty());
    }

    #[test]
    fn test_clear_history_empty() {
        let (storage, _temp_dir) = create_storage();
        // Clear when empty should not panic
        storage.clear_history().unwrap();
        let history = storage.list_history(None, 10).unwrap();
        assert!(history.is_empty());
    }

    #[test]
    fn test_storage_new() {
        let result = Storage::new();
        assert!(result.is_ok());
    }

    }

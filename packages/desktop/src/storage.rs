//! Storage implementation for desktop app
//!
//! Stores data in the app data directory:
//! - macOS: ~/Library/Application Support/com.shardden.app/
//! - Windows: %APPDATA%/com.shardden.app/
//! - Linux: ~/.local/share/com.shardden.app/
//!

use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use shard_den_core::{Config, HistoryEntry, UmlStylerConfig};
use std::path::PathBuf;

/// A saved UML template
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UmlTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub code: String,
    pub engine: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl UmlTemplate {
    pub fn new(name: String, description: String, code: String, engine: String) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: format!("tpl-{}", uuid_simple()),
            name,
            description,
            code,
            engine,
            created_at: now,
            updated_at: now,
        }
    }
}

/// A saved custom UML theme
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UmlTheme {
    pub id: String,
    pub name: String,
    pub theme_type: String,
    pub config: serde_json::Value,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl UmlTheme {
    pub fn new(name: String, theme_type: String, config: serde_json::Value) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: format!("thm-{}", uuid_simple()),
            name,
            theme_type,
            config,
            created_at: now,
            updated_at: now,
        }
    }
}

/// Generate a simple UUID-like ID
fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("{:x}", timestamp)
}

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

    /// Get path to UML templates file
    fn templates_path(&self) -> PathBuf {
        self.data_dir.join("uml_templates.json")
    }

    /// Get path to UML themes file
    fn themes_path(&self) -> PathBuf {
        self.data_dir.join("uml_themes.json")
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
    pub fn clear_history(&self, tool: Option<&str>) -> shard_den_core::Result<()> {
        if let Some(t) = tool {
            let mut entries = self.load_history_entries()?;
            entries.retain(|e| e.tool != t);
            self.save_history_entries(&entries)
        } else {
            self.save_history_entries(&[])
        }
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

    // ==================== UML Templates ====================

    /// Save a UML template
    pub fn save_uml_template(&self, mut template: UmlTemplate) -> shard_den_core::Result<()> {
        let mut templates = self.load_uml_templates()?;

        // Update existing or add new
        if let Some(idx) = templates.iter().position(|t| t.id == template.id) {
            template.updated_at = chrono::Utc::now();
            templates[idx] = template;
        } else {
            templates.push(template);
        }

        let path = self.templates_path();
        let json = serde_json::to_string_pretty(&templates)?;
        std::fs::write(path, json)?;
        Ok(())
    }

    /// Load all UML templates
    pub fn load_uml_templates(&self) -> shard_den_core::Result<Vec<UmlTemplate>> {
        let path = self.templates_path();
        if !path.exists() {
            return Ok(vec![]);
        }
        let json = std::fs::read_to_string(path)?;
        let templates: Vec<UmlTemplate> = serde_json::from_str(&json)?;
        Ok(templates)
    }

    /// Delete a UML template by ID
    pub fn delete_uml_template(&self, id: &str) -> shard_den_core::Result<()> {
        let mut templates = self.load_uml_templates()?;
        templates.retain(|t| t.id != id);

        let path = self.templates_path();
        let json = serde_json::to_string_pretty(&templates)?;
        std::fs::write(path, json)?;
        Ok(())
    }

    // ==================== UML Themes ====================

    /// Save a custom UML theme
    pub fn save_uml_theme(&self, mut theme: UmlTheme) -> shard_den_core::Result<()> {
        let mut themes = self.load_uml_themes()?;

        // Update existing or add new
        if let Some(idx) = themes.iter().position(|t| t.id == theme.id) {
            // Update timestamp when updating existing theme
            theme.updated_at = chrono::Utc::now();
            themes[idx] = theme;
        } else {
            themes.push(theme);
        }

        let path = self.themes_path();
        let json = serde_json::to_string_pretty(&themes)?;
        std::fs::write(path, json)?;
        Ok(())
    }

    /// Load all custom UML themes
    pub fn load_uml_themes(&self) -> shard_den_core::Result<Vec<UmlTheme>> {
        let path = self.themes_path();
        if !path.exists() {
            return Ok(vec![]);
        }
        let json = std::fs::read_to_string(path)?;
        let themes: Vec<UmlTheme> = serde_json::from_str(&json)?;
        Ok(themes)
    }

    /// Delete a custom UML theme by ID
    pub fn delete_uml_theme(&self, id: &str) -> shard_den_core::Result<()> {
        let mut themes = self.load_uml_themes()?;
        themes.retain(|t| t.id != id);

        let path = self.themes_path();
        let json = serde_json::to_string_pretty(&themes)?;
        std::fs::write(path, json)?;
        Ok(())
    }

    // ==================== UML Config ====================

    /// Save UML Styler configuration
    pub fn save_uml_config(&self, config: &UmlStylerConfig) -> shard_den_core::Result<()> {
        let mut full_config = self.load_config()?;
        full_config.tools.uml_styler = config.clone();
        self.save_config(&full_config)?;
        Ok(())
    }

    /// Load UML Styler configuration
    pub fn load_uml_config(&self) -> shard_den_core::Result<UmlStylerConfig> {
        let full_config = self.load_config()?;
        Ok(full_config.tools.uml_styler)
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
        storage
            .add_history(HistoryEntry::new("tool-a", "i1", "o1", false))
            .unwrap();
        storage
            .add_history(HistoryEntry::new("tool-b", "i2", "o2", false))
            .unwrap();
        storage
            .add_history(HistoryEntry::new("tool-a", "i3", "o3", false))
            .unwrap();

        let tool_a = storage.list_history(Some("tool-a"), 10).unwrap();
        assert_eq!(tool_a.len(), 2);

        let tool_b = storage.list_history(Some("tool-b"), 10).unwrap();
        assert_eq!(tool_b.len(), 1);
    }

    #[test]
    fn test_list_history_limit() {
        let (storage, _temp_dir) = create_storage();
        for i in 0..10 {
            storage
                .add_history(HistoryEntry::new(
                    "test",
                    &format!("i{}", i),
                    &format!("o{}", i),
                    false,
                ))
                .unwrap();
        }
        let history = storage.list_history(None, 3).unwrap();
        assert_eq!(history.len(), 3);
    }

    #[test]
    fn test_clear_history() {
        let (storage, _temp_dir) = create_storage();
        storage
            .add_history(HistoryEntry::new("test", "input", "output", false))
            .unwrap();
        storage.clear_history(None).unwrap();
        let history = storage.list_history(None, 10).unwrap();
        assert!(history.is_empty());
    }

    #[test]
    fn test_clear_history_empty() {
        let (storage, _temp_dir) = create_storage();
        // Clear when empty should not panic
        storage.clear_history(None).unwrap();
        let history = storage.list_history(None, 10).unwrap();
        assert!(history.is_empty());
    }

    #[test]
    fn test_storage_new() {
        let result = Storage::new();
        assert!(result.is_ok());
    }

    // UML Template tests
    #[test]
    fn test_save_and_load_uml_template() {
        let (storage, _temp_dir) = create_storage();
        let template = UmlTemplate::new(
            "Test Template".to_string(),
            "A test template".to_string(),
            "graph TD\nA-->B".to_string(),
            "mermaid".to_string(),
        );
        storage.save_uml_template(template.clone()).unwrap();

        let templates = storage.load_uml_templates().unwrap();
        assert_eq!(templates.len(), 1);
        assert_eq!(templates[0].name, "Test Template");
    }

    #[test]
    fn test_update_uml_template() {
        let (storage, _temp_dir) = create_storage();
        let template = UmlTemplate::new(
            "Test Template".to_string(),
            "Description".to_string(),
            "code1".to_string(),
            "mermaid".to_string(),
        );
        storage.save_uml_template(template).unwrap();

        // Update with same ID
        let updated = UmlTemplate {
            id: storage.load_uml_templates().unwrap()[0].id.clone(),
            name: "Updated Name".to_string(),
            description: "Updated Description".to_string(),
            code: "code2".to_string(),
            engine: "plantuml".to_string(),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };
        storage.save_uml_template(updated).unwrap();

        let templates = storage.load_uml_templates().unwrap();
        assert_eq!(templates.len(), 1);
        assert_eq!(templates[0].name, "Updated Name");
    }

    #[test]
    fn test_delete_uml_template() {
        let (storage, _temp_dir) = create_storage();
        let template = UmlTemplate::new(
            "Test Template".to_string(),
            "Description".to_string(),
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

    // UML Theme tests
    #[test]
    fn test_save_and_load_uml_theme() {
        let (storage, _temp_dir) = create_storage();
        let theme = UmlTheme::new(
            "Dark Theme".to_string(),
            "shared".to_string(),
            serde_json::json!({"primary": "#000000"}),
        );
        storage.save_uml_theme(theme.clone()).unwrap();

        let themes = storage.load_uml_themes().unwrap();
        assert_eq!(themes.len(), 1);
        assert_eq!(themes[0].name, "Dark Theme");
    }

    #[test]
    fn test_delete_uml_theme() {
        let (storage, _temp_dir) = create_storage();
        let theme = UmlTheme::new(
            "Test Theme".to_string(),
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

    // UML Config tests
    #[test]
    fn test_save_and_load_uml_config() {
        let (storage, _temp_dir) = create_storage();
        let config = UmlStylerConfig::default();
        storage.save_uml_config(&config).unwrap();

        let loaded = storage.load_uml_config().unwrap();
        assert_eq!(loaded.default_theme, "shared/default");
    }

    #[test]
    fn test_load_uml_config_default() {
        let (storage, _temp_dir) = create_storage();
        // Don't save anything, should return default
        let config = storage.load_uml_config().unwrap();
        assert_eq!(config.default_theme, "shared/default");
    }

    #[test]
    fn test_uuid_simple_generation() {
        let id1 = uuid_simple();
        let id2 = uuid_simple();
        assert!(!id1.is_empty());
        assert!(!id2.is_empty());
    }
}

//! Configuration management for ShardDen

use serde::{Deserialize, Serialize};

/// Global configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub tools: ToolConfig,
    pub ui: UiConfig,
    pub history: HistoryConfig,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            tools: ToolConfig::default(),
            ui: UiConfig::default(),
            history: HistoryConfig::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolConfig {
    pub json_extractor: JsonExtractorConfig,
}

impl Default for ToolConfig {
    fn default() -> Self {
        Self {
            json_extractor: JsonExtractorConfig::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonExtractorConfig {
    pub default_output_format: OutputFormat,
    pub max_history: usize,
    pub favorite_paths: Vec<String>,
}

impl Default for JsonExtractorConfig {
    fn default() -> Self {
        Self {
            default_output_format: OutputFormat::Json,
            max_history: 100,
            favorite_paths: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OutputFormat {
    Json,
    Csv,
    Text,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiConfig {
    pub theme: Theme,
    pub language: String,
}

impl Default for UiConfig {
    fn default() -> Self {
        Self {
            theme: Theme::System,
            language: "zh-CN".to_string(),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Theme {
    Light,
    Dark,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryConfig {
    pub enabled: bool,
    pub max_entries: usize,
}

impl Default for HistoryConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            max_entries: 1000,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = Config::default();
        assert!(config.history.enabled);
        assert_eq!(config.history.max_entries, 1000);
    }

    #[test]
    fn test_config_serialization() {
        let config = Config::default();
        let json = serde_json::to_string(&config).unwrap();
        let deserialized: Config = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.history.max_entries, config.history.max_entries);
    }
}

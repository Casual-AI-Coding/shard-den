//! Configuration management for ShardDen
#![allow(clippy::derivable_impls)]

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

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ToolConfig {
    pub json_extractor: JsonExtractorConfig,
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

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Default, PartialEq)]
pub enum OutputFormat {
    #[default]
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
        // 从 LANG 环境变量读取语言设置，格式如 "zh_CN.UTF-8"
        // 取第一部分（如 "zh_CN"），不存在时回退到 "zh-CN"
        let language = std::env::var("LANG")
            .ok()
            .and_then(|l| l.split('.').next().map(|s| s.to_string()))
            .unwrap_or_else(|| "zh-CN".to_string());

        Self {
            theme: Theme::System,
            language,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Default, PartialEq)]
pub enum Theme {
    Light,
    Dark,
    #[default]
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

    #[test]
    fn test_tool_config_default() {
        let tool_config = ToolConfig::default();
        assert_eq!(tool_config.json_extractor.default_output_format, OutputFormat::Json);
        assert_eq!(tool_config.json_extractor.max_history, 100);
        assert!(tool_config.json_extractor.favorite_paths.is_empty());
    }

    #[test]
    fn test_json_extractor_config() {
        let config = JsonExtractorConfig {
            default_output_format: OutputFormat::Csv,
            max_history: 50,
            favorite_paths: vec!["/path1".to_string(), "/path2".to_string()],
        };
        assert_eq!(config.default_output_format, OutputFormat::Csv);
        assert_eq!(config.max_history, 50);
        assert_eq!(config.favorite_paths.len(), 2);
    }

    #[test]
    fn test_output_format_serialization() {
        // Test serialization
        let json_str = serde_json::to_string(&OutputFormat::Json).unwrap();
        assert!(json_str.contains("Json"), "Expected 'Json', got: {}", json_str);
        
        let csv_str = serde_json::to_string(&OutputFormat::Csv).unwrap();
        assert!(csv_str.contains("Csv"), "Expected 'Csv', got: {}", csv_str);
        
        let text_str = serde_json::to_string(&OutputFormat::Text).unwrap();
        assert!(text_str.contains("Text"), "Expected 'Text', got: {}", text_str);

        // Test deserialization
        let format: OutputFormat = serde_json::from_str("\"Json\"").unwrap();
        assert_eq!(format, OutputFormat::Json);

        let format: OutputFormat = serde_json::from_str("\"Csv\"").unwrap();
        assert_eq!(format, OutputFormat::Csv);

        let format: OutputFormat = serde_json::from_str("\"Text\"").unwrap();
        assert_eq!(format, OutputFormat::Text);
    }

    #[test]
    fn test_ui_config_default() {
        let ui_config = UiConfig::default();
        assert_eq!(ui_config.theme, Theme::System);
    }

    #[test]
    fn test_theme_variants() {
        // Test serialization
        let light_json = serde_json::to_string(&Theme::Light).unwrap();
        let dark_json = serde_json::to_string(&Theme::Dark).unwrap();
        let system_json = serde_json::to_string(&Theme::System).unwrap();
        
        assert!(light_json.contains("Light"), "Expected 'Light', got: {}", light_json);
        assert!(dark_json.contains("Dark"), "Expected 'Dark', got: {}", dark_json);
        assert!(system_json.contains("System"), "Expected 'System', got: {}", system_json);
        
        // Test deserialization
        let light: Theme = serde_json::from_str("\"Light\"").unwrap();
        let dark: Theme = serde_json::from_str("\"Dark\"").unwrap();
        let system: Theme = serde_json::from_str("\"System\"").unwrap();
        
        assert!(matches!(light, Theme::Light));
        assert!(matches!(dark, Theme::Dark));
        assert!(matches!(system, Theme::System));
    }
    #[test]
    fn test_history_config_default() {
        let history_config = HistoryConfig::default();
        assert!(history_config.enabled);
        assert_eq!(history_config.max_entries, 1000);
    }

    #[test]
    fn test_config_yaml_serialization() {
        let config = Config::default();
        let yaml = serde_yaml::to_string(&config).unwrap();
        let deserialized: Config = serde_yaml::from_str(&yaml).unwrap();
        assert_eq!(deserialized.history.max_entries, config.history.max_entries);
    }

    #[test]
    fn test_custom_config() {
        let config = Config {
            tools: ToolConfig {
                json_extractor: JsonExtractorConfig {
                    default_output_format: OutputFormat::Text,
                    max_history: 200,
                    favorite_paths: vec!["/home/user/data".to_string()],
                },
            },
            ui: UiConfig {
                theme: Theme::Dark,
                language: "en-US".to_string(),
            },
            history: HistoryConfig {
                enabled: false,
                max_entries: 500,
            },
        };

        assert_eq!(config.tools.json_extractor.default_output_format, OutputFormat::Text);
        assert_eq!(config.ui.theme, Theme::Dark);
        assert!(!config.history.enabled);
    }
}

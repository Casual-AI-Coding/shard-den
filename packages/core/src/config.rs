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
    pub uml_styler: UmlStylerConfig,
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

/// UML Styler specific configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UmlStylerConfig {
    pub default_theme: String,
    pub default_engine: UmlEngine,
    pub export_resolution: ExportResolution,
    pub auto_save: bool,
    pub auto_save_interval_secs: u32,
}

impl Default for UmlStylerConfig {
    fn default() -> Self {
        Self {
            default_theme: "shared/default".to_string(),
            default_engine: UmlEngine::Mermaid,
            export_resolution: ExportResolution::Default,
            auto_save: true,
            auto_save_interval_secs: 30,
        }
    }
}

/// UML diagram engine
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Default, PartialEq)]
pub enum UmlEngine {
    #[default]
    Mermaid,
    D2,
    /// Graphviz/DOT Engine
    Graphviz,
}

/// Export resolution presets
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Default, PartialEq)]
pub enum ExportResolution {
    #[default]
    Default, // 1x
    X2, // 2x
    X3, // 3x
    X4, // 4x
    Custom(u32),
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

    #[test]
    fn test_tool_config_default() {
        let tool_config = ToolConfig::default();
        assert_eq!(
            tool_config.json_extractor.default_output_format,
            OutputFormat::Json
        );
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
        let json_str = serde_json::to_string(&OutputFormat::Json).unwrap();
        assert!(json_str.contains("Json"));

        let csv_str = serde_json::to_string(&OutputFormat::Csv).unwrap();
        assert!(csv_str.contains("Csv"));

        let text_str = serde_json::to_string(&OutputFormat::Text).unwrap();
        assert!(text_str.contains("Text"));

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
        let light_json = serde_json::to_string(&Theme::Light).unwrap();
        let dark_json = serde_json::to_string(&Theme::Dark).unwrap();
        let system_json = serde_json::to_string(&Theme::System).unwrap();

        assert!(light_json.contains("Light"));
        assert!(dark_json.contains("Dark"));
        assert!(system_json.contains("System"));

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
                uml_styler: UmlStylerConfig::default(),
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

        assert_eq!(
            config.tools.json_extractor.default_output_format,
            OutputFormat::Text
        );
        assert_eq!(config.ui.theme, Theme::Dark);
        assert!(!config.history.enabled);
    }

    #[test]
    fn test_uml_styler_config_default() {
        let config = UmlStylerConfig::default();
        assert_eq!(config.default_theme, "shared/default");
        assert_eq!(config.default_engine, UmlEngine::Mermaid);
        assert_eq!(config.export_resolution, ExportResolution::Default);
        assert!(config.auto_save);
        assert_eq!(config.auto_save_interval_secs, 30);
    }

    #[test]
    fn test_uml_styler_config_custom() {
        let config = UmlStylerConfig {
            default_theme: "shared/dark".to_string(),
            default_engine: UmlEngine::PlantUML,
            export_resolution: ExportResolution::X4,
            auto_save: false,
            auto_save_interval_secs: 60,
        };

        assert_eq!(config.default_theme, "shared/dark");
        assert_eq!(config.default_engine, UmlEngine::PlantUML);
        assert_eq!(config.export_resolution, ExportResolution::X4);
        assert!(!config.auto_save);
        assert_eq!(config.auto_save_interval_secs, 60);
    }

    #[test]
    fn test_uml_engine_serialization() {
        let mermaid = serde_json::to_string(&UmlEngine::Mermaid).unwrap();
        assert!(mermaid.contains("Mermaid"));

        let plantuml = serde_json::to_string(&UmlEngine::PlantUML).unwrap();
        assert!(plantuml.contains("PlantUML"));

        let decoded: UmlEngine = serde_json::from_str("\"Mermaid\"").unwrap();
        assert_eq!(decoded, UmlEngine::Mermaid);
    }

    #[test]
    fn test_export_resolution_serialization() {
        let default = serde_json::to_string(&ExportResolution::Default).unwrap();
        let x2 = serde_json::to_string(&ExportResolution::X2).unwrap();
        let x4 = serde_json::to_string(&ExportResolution::X4).unwrap();
        let custom = serde_json::to_string(&ExportResolution::Custom(300)).unwrap();

        assert!(default.contains("Default"));
        assert!(x2.contains("X2"));
        assert!(x4.contains("X4"));
        assert!(custom.contains("300"));

        let decoded: ExportResolution = serde_json::from_str("\"X2\"").unwrap();
        assert_eq!(decoded, ExportResolution::X2);

        let decoded_custom: ExportResolution = serde_json::from_str("{\"Custom\":150}").unwrap();
        assert_eq!(decoded_custom, ExportResolution::Custom(150));
    }

    #[test]
    fn test_uml_styler_config_serialization() {
        let config = UmlStylerConfig::default();
        let json = serde_json::to_string(&config).unwrap();
        let deserialized: UmlStylerConfig = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.default_theme, config.default_theme);
        assert_eq!(deserialized.default_engine, config.default_engine);
    }

    #[test]
    fn test_tool_config_with_uml_styler() {
        let tool_config = ToolConfig {
            json_extractor: JsonExtractorConfig::default(),
            uml_styler: UmlStylerConfig {
                default_theme: "shared/business".to_string(),
                default_engine: UmlEngine::PlantUML,
                export_resolution: ExportResolution::Custom(300),
                auto_save: true,
                auto_save_interval_secs: 45,
            },
        };

        assert_eq!(tool_config.uml_styler.default_theme, "shared/business");
        assert_eq!(tool_config.uml_styler.default_engine, UmlEngine::PlantUML);
    }
}

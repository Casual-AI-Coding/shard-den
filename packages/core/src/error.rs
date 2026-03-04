//! Error types for ShardDen

use thiserror::Error;

/// Result type alias for ShardDen operations
pub type Result<T> = std::result::Result<T, ShardDenError>;

/// Main error type for ShardDen
#[derive(Error, Debug)]
pub enum ShardDenError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("YAML error: {0}")]
    Yaml(#[from] serde_yaml::Error),

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Tool error [{tool}]: {message}")]
    Tool { tool: String, message: String },

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("History error: {0}")]
    History(String),

    #[error("Unknown error: {0}")]
    Unknown(String),
}

impl ShardDenError {
    /// Create a tool-specific error
    pub fn tool_error(tool: impl Into<String>, message: impl Into<String>) -> Self {
        Self::Tool {
            tool: tool.into(),
            message: message.into(),
        }
    }

    /// Create an invalid input error
    pub fn invalid_input(message: impl Into<String>) -> Self {
        Self::InvalidInput(message.into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tool_error() {
        let err = ShardDenError::tool_error("json-extractor", "invalid path");
        assert!(matches!(err, ShardDenError::Tool { .. }));
        assert!(err.to_string().contains("json-extractor"));
    }

    #[test]
    fn test_invalid_input() {
        let err = ShardDenError::invalid_input("empty string");
        assert!(matches!(err, ShardDenError::InvalidInput(_)));
    }

    #[test]
    fn test_error_io() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file not found");
        let err = ShardDenError::from(io_err);
        assert!(matches!(err, ShardDenError::Io(_)));
    }

    #[test]
    fn test_error_json() {
        let json_err = serde_json::from_str::<serde_json::Value>("invalid json").unwrap_err();
        let err = ShardDenError::from(json_err);
        assert!(matches!(err, ShardDenError::Json(_)));
    }

    #[test]
    fn test_error_yaml() {
        let yaml_err = serde_yaml::from_str::<serde_yaml::Value>("invalid: yaml: ").unwrap_err();
        let err = ShardDenError::from(yaml_err);
        assert!(matches!(err, ShardDenError::Yaml(_)));
    }

    #[test]
    fn test_error_config() {
        let err = ShardDenError::Config("missing required field".to_string());
        assert!(matches!(err, ShardDenError::Config(_)));
        assert!(err.to_string().contains("Configuration error"));
    }

    #[test]
    fn test_error_not_found() {
        let err = ShardDenError::NotFound("entry not found".to_string());
        assert!(matches!(err, ShardDenError::NotFound(_)));
        assert!(err.to_string().contains("Not found"));
    }

    #[test]
    fn test_error_history() {
        let err = ShardDenError::History("storage error".to_string());
        assert!(matches!(err, ShardDenError::History(_)));
        assert!(err.to_string().contains("History error"));
    }

    #[test]
    fn test_error_unknown() {
        let err = ShardDenError::Unknown("unexpected error".to_string());
        assert!(matches!(err, ShardDenError::Unknown(_)));
        assert!(err.to_string().contains("Unknown error"));
    }

    #[test]
    fn test_error_display() {
        let err = ShardDenError::tool_error("test-tool", "test message");
        let display = err.to_string();
        assert!(display.contains("test-tool"));
        assert!(display.contains("test message"));
    }
}

#[test]
fn test_tool_error_with_string() {
    // Test tool_error with String type
    let err = ShardDenError::tool_error("test-tool".to_string(), "test message".to_string());
    assert!(matches!(err, ShardDenError::Tool { .. }));
}

#[test]
fn test_invalid_input_with_string() {
    // Test invalid_input with String type
    let err = ShardDenError::invalid_input("error message".to_string());
    assert!(matches!(err, ShardDenError::InvalidInput(_)));
}

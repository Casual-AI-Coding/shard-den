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
}

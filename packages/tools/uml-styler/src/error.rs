//! 错误处理模块

use thiserror::Error;

#[cfg(feature = "wasm")]
use serde::{Deserialize, Serialize};

/// 引擎错误
#[derive(Debug, Error)]
pub enum EngineError {
    #[error("Parse error at line {line}: {message}")]
    ParseError { line: usize, message: String },

    #[error("Render error: {0}")]
    RenderError(String),

    #[error("Validation error: {} errors found", .0.len())]
    ValidationError(Vec<Diagnostic>),

    #[error("Network error: {0}")]
    NetworkError(String),

    #[error("Engine not found: {0}")]
    EngineNotFound(String),

    #[error("Unsupported diagram type: {0}")]
    UnsupportedDiagram(String),
}

/// 诊断信息（语法错误）
#[derive(Debug, Clone, PartialEq, Eq)]
#[cfg_attr(feature = "wasm", derive(Serialize, Deserialize))]
pub struct Diagnostic {
    /// 行号 (1-based)
    pub line: usize,
    /// 列号 (1-based)
    pub column: usize,
    /// 错误消息
    pub message: String,
    /// 严重程度
    pub severity: Severity,
}

impl Diagnostic {
    /// 创建新的诊断信息
    pub fn new(line: usize, column: usize, message: impl Into<String>, severity: Severity) -> Self {
        Self {
            line,
            column,
            message: message.into(),
            severity,
        }
    }

    /// 创建错误级别的诊断
    pub fn error(line: usize, column: usize, message: impl Into<String>) -> Self {
        Self::new(line, column, message, Severity::Error)
    }

    /// 创建警告级别的诊断
    pub fn warning(line: usize, column: usize, message: impl Into<String>) -> Self {
        Self::new(line, column, message, Severity::Warning)
    }

    /// 创建信息级别的诊断
    pub fn info(line: usize, column: usize, message: impl Into<String>) -> Self {
        Self::new(line, column, message, Severity::Info)
    }
}

/// 严重程度
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "wasm", derive(Serialize, Deserialize))]
pub enum Severity {
    Error,
    Warning,
    Info,
}

impl Severity {
    pub fn as_str(&self) -> &'static str {
        match self {
            Severity::Error => "error",
            Severity::Warning => "warning",
            Severity::Info => "info",
        }
    }
}

impl std::fmt::Display for Severity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_diagnostic_new() {
        let diag = Diagnostic::new(1, 5, "Test error", Severity::Error);
        assert_eq!(diag.line, 1);
        assert_eq!(diag.column, 5);
        assert_eq!(diag.message, "Test error");
        assert_eq!(diag.severity, Severity::Error);
    }

    #[test]
    fn test_diagnostic_convenience_methods() {
        let err = Diagnostic::error(10, 1, "Parse error");
        assert_eq!(err.severity, Severity::Error);

        let warn = Diagnostic::warning(5, 3, "Unused variable");
        assert_eq!(warn.severity, Severity::Warning);

        let info = Diagnostic::info(1, 1, "Hint");
        assert_eq!(info.severity, Severity::Info);
    }

    #[test]
    fn test_severity_display() {
        assert_eq!(format!("{}", Severity::Error), "error");
        assert_eq!(format!("{}", Severity::Warning), "warning");
        assert_eq!(format!("{}", Severity::Info), "info");
    }

    #[test]
    fn test_engine_error_parse_error() {
        let err = EngineError::ParseError {
            line: 5,
            message: "Unexpected token".to_string(),
        };
        assert!(err.to_string().contains("line 5"));
        assert!(err.to_string().contains("Unexpected token"));
    }

    #[test]
    fn test_engine_error_validation_error() {
        let diags = vec![
            Diagnostic::error(1, 1, "Error 1"),
            Diagnostic::warning(2, 1, "Warning 1"),
        ];
        let err = EngineError::ValidationError(diags);
        assert!(err.to_string().contains("2 errors"));
    }

    #[test]
    fn test_engine_error_engine_not_found() {
        let err = EngineError::EngineNotFound("unknown".to_string());
        assert!(err.to_string().contains("unknown"));
    }

    #[test]
    fn test_engine_error_unsupported_diagram() {
        let err = EngineError::UnsupportedDiagram("pie".to_string());
        assert!(err.to_string().contains("pie"));
    }
}

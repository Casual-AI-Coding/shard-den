//! 错误处理模块

use thiserror::Error;

/// 引擎错误
#[derive(Debug, Error)]
pub enum EngineError {
    #[error("Parse error: {0}")]
    ParseError(String),

    #[error("Render error: {0}")]
    RenderError(String),

    #[error("Network error: {0}")]
    NetworkError(String),
}

/// 诊断信息（语法错误）
#[derive(Debug, Clone)]
pub struct Diagnostic {
    pub line: usize,
    pub column: usize,
    pub message: String,
    pub severity: Severity,
}

/// 严重程度
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Severity {
    Error,
    Warning,
    Info,
}

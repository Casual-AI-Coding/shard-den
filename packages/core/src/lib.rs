//! ShardDen Core - Shared types and utilities
//!
//! This crate provides common functionality used across all ShardDen tools:
//! - Configuration management
//! - Error types
//! - History storage traits
//! - Logging utilities

pub mod config;
pub mod error;
pub mod history;
pub mod logger;

pub use config::Config;
pub use error::{ShardDenError, Result};
pub use history::{HistoryEntry, HistoryStore};

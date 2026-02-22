//! History storage traits

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Generate a simple unique ID without uuid crate
fn generate_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    // Use a simple hash-based approach for uniqueness
    format!("{:x}-{:x}", timestamp, std::process::id())
}

/// A single history entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: String,
    pub tool: String,
    pub input: String,
    pub output: String,
    pub timestamp: DateTime<Utc>,
    pub metadata: HashMap<String, String>,
}

impl HistoryEntry {
    /// Create a new history entry
    pub fn new(
        tool: impl Into<String>, input: impl Into<String>, output: impl Into<String>,
    ) -> Self {
        Self {
            id: generate_id(),
            tool: tool.into(),
            input: input.into(),
            output: output.into(),
            timestamp: Utc::now(),
            metadata: HashMap::new(),
        }
    }

    /// Add metadata to the entry
    pub fn with_metadata(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.metadata.insert(key.into(), value.into());
        self
    }
}

/// Trait for history storage implementations
///
/// Desktop uses file-based storage, Web is stateless
pub trait HistoryStore: Send + Sync {
    /// Add a new entry to history
    fn add(&mut self, entry: HistoryEntry) -> crate::Result<()>;

    /// List history entries, optionally filtered by tool
    fn list(&self, tool: Option<&str>, limit: usize) -> Vec<HistoryEntry>;

    /// Search history entries
    fn search(&self, query: &str) -> Vec<HistoryEntry>;

    /// Delete a specific entry by ID
    fn delete(&mut self, id: &str) -> crate::Result<()>;

    /// Clear all history
    fn clear(&mut self) -> crate::Result<()>;

    /// Get total count of entries
    fn count(&self) -> usize;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_history_entry_creation() {
        let entry = HistoryEntry::new("json-extractor", "{}", "result");
        assert_eq!(entry.tool, "json-extractor");
        assert_eq!(entry.input, "{}");
        assert_eq!(entry.output, "result");
    }

    #[test]
    fn test_history_entry_metadata() {
        let entry =
            HistoryEntry::new("json-extractor", "{}", "result").with_metadata("format", "json");
        assert_eq!(entry.metadata.get("format"), Some(&"json".to_string()));
    }
}

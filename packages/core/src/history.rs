//! History storage traits

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Generate a simple unique ID without uuid crate
fn generate_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    // Use map + unwrap_or to handle potential SystemTime errors gracefully
    // (e.g., system clock set before UNIX_EPOCH)
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
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
    pub is_sensitive: bool,
}

impl HistoryEntry {
    /// Create a new history entry
    pub fn new(
        tool: impl Into<String>, input: impl Into<String>, output: impl Into<String>,
        is_sensitive: bool,
    ) -> Self {
        Self {
            id: generate_id(),
            tool: tool.into(),
            input: if is_sensitive {
                Self::obfuscate(input)
            } else {
                input.into()
            },
            output: if is_sensitive {
                Self::obfuscate(output)
            } else {
                output.into()
            },
            timestamp: Utc::now(),
            metadata: HashMap::new(),
            is_sensitive,
        }
    }

    /// Obfuscate data using base64 encoding
    fn obfuscate(data: impl Into<String>) -> String {
        use base64::Engine;
        let data = data.into();
        base64::engine::general_purpose::STANDARD.encode(data.as_bytes())
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
        let entry = HistoryEntry::new("json-extractor", "{}", "result", false);
        assert_eq!(entry.tool, "json-extractor");
        assert_eq!(entry.input, "{}");
        assert_eq!(entry.output, "result");
    }

    #[test]
    fn test_history_entry_metadata() {
        let entry = HistoryEntry::new("json-extractor", "{}", "result", false).with_metadata("format", "json");
        assert_eq!(entry.metadata.get("format"), Some(&"json".to_string()));
    }
}

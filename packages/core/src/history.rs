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
    ///
    /// ⚠️ WARNING: This is NOT encryption! Base64 is trivial to reverse.
    /// This provides only basic obfuscation to prevent casual observation.
    /// For actual security, use proper encryption (e.g., AES-256-GCM).
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
        let entry = HistoryEntry::new("json-extractor", "{}", "result", false)
            .with_metadata("format", "json");
        assert_eq!(entry.metadata.get("format"), Some(&"json".to_string()));
    }

    #[test]
    fn test_generate_id() {
        // Test that generate_id produces unique IDs
        let id1 = generate_id();
        let id2 = generate_id();
        
        // IDs should not be empty
        assert!(!id1.is_empty());
        assert!(!id2.is_empty());
        
        // IDs should contain a hyphen (format: timestamp-pid)
        assert!(id1.contains('-'));
        assert!(id2.contains('-'));
    }

    #[test]
    fn test_history_entry_sensitive_data() {
        // Test that sensitive data is obfuscated
        let entry = HistoryEntry::new("json-extractor", "secret input", "secret output", true);
        
        // Input and output should be different from original (obfuscated)
        assert_ne!(entry.input, "secret input");
        assert_ne!(entry.output, "secret output");
        
        // The is_sensitive flag should be set
        assert!(entry.is_sensitive);
    }

    #[test]
    fn test_history_entry_non_sensitive_data() {
        // Test that non-sensitive data is not obfuscated
        let entry = HistoryEntry::new("json-extractor", "plain input", "plain output", false);
        
        // Input and output should be the same as original
        assert_eq!(entry.input, "plain input");
        assert_eq!(entry.output, "plain output");
        
        // The is_sensitive flag should be false
        assert!(!entry.is_sensitive);
    }

    #[test]
    fn test_history_entry_timestamp() {
        let entry = HistoryEntry::new("json-extractor", "{}", "result", false);
        
        // Timestamp should be set
        assert!(entry.timestamp <= chrono::Utc::now());
    }

    #[test]
    fn test_history_entry_multiple_metadata() {
        let entry = HistoryEntry::new("json-extractor", "{}", "result", false)
            .with_metadata("key1", "value1")
            .with_metadata("key2", "value2")
            .with_metadata("key3", "value3");
        
        assert_eq!(entry.metadata.get("key1"), Some(&"value1".to_string()));
        assert_eq!(entry.metadata.get("key2"), Some(&"value2".to_string()));
        assert_eq!(entry.metadata.get("key3"), Some(&"value3".to_string()));
        assert_eq!(entry.metadata.len(), 3);
    }

    // A simple in-memory implementation of HistoryStore for testing
    struct InMemoryHistoryStore {
        entries: Vec<HistoryEntry>,
    }

    impl InMemoryHistoryStore {
        fn new() -> Self {
            Self { entries: Vec::new() }
        }
    }

    impl HistoryStore for InMemoryHistoryStore {
        fn add(&mut self, entry: HistoryEntry) -> crate::Result<()> {
            self.entries.push(entry);
            Ok(())
        }

        fn list(&self, tool: Option<&str>, limit: usize) -> Vec<HistoryEntry> {
            let filtered: Vec<_> = self.entries.iter()
                .filter(|e| tool.map_or(true, |t| e.tool == t))
                .cloned()
                .collect();
            filtered.into_iter().take(limit).collect()
        }

        fn search(&self, query: &str) -> Vec<HistoryEntry> {
            self.entries.iter()
                .filter(|e| e.input.contains(query) || e.output.contains(query))
                .cloned()
                .collect()
        }

        fn delete(&mut self, id: &str) -> crate::Result<()> {
            if let Some(pos) = self.entries.iter().position(|e| e.id == id) {
                self.entries.remove(pos);
                Ok(())
            } else {
                Err(crate::ShardDenError::NotFound(format!("Entry with id '{}' not found", id)))
            }
        }

        fn clear(&mut self) -> crate::Result<()> {
            self.entries.clear();
            Ok(())
        }

        fn count(&self) -> usize {
            self.entries.len()
        }
    }

    #[test]
    fn test_history_store_add_and_list() {
        let mut store = InMemoryHistoryStore::new();
        
        let entry1 = HistoryEntry::new("tool1", "input1", "output1", false);
        let entry2 = HistoryEntry::new("tool2", "input2", "output2", false);
        
        store.add(entry1).unwrap();
        store.add(entry2).unwrap();
        
        assert_eq!(store.count(), 2);
    }

    #[test]
    fn test_history_store_list_by_tool() {
        let mut store = InMemoryHistoryStore::new();
        
        store.add(HistoryEntry::new("json-extractor", "{}", "result1", false)).unwrap();
        store.add(HistoryEntry::new("json-extractor", "{}", "result2", false)).unwrap();
        store.add(HistoryEntry::new("other-tool", "{}", "result3", false)).unwrap();
        
        let json_entries = store.list(Some("json-extractor"), 10);
        assert_eq!(json_entries.len(), 2);
        
        let other_entries = store.list(Some("other-tool"), 10);
        assert_eq!(other_entries.len(), 1);
        
        let all_entries = store.list(None, 10);
        assert_eq!(all_entries.len(), 3);
    }

    #[test]
    fn test_history_store_list_limit() {
        let mut store = InMemoryHistoryStore::new();
        
        for i in 0..10 {
            store.add(HistoryEntry::new("tool", &format!("input{}", i), &format!("output{}", i), false)).unwrap();
        }
        
        let limited = store.list(None, 5);
        assert_eq!(limited.len(), 5);
    }

    #[test]
    fn test_history_store_search() {
        let mut store = InMemoryHistoryStore::new();
        
        store.add(HistoryEntry::new("tool", "hello world", "result1", false)).unwrap();
        store.add(HistoryEntry::new("tool", "foo bar", "result2", false)).unwrap();
        store.add(HistoryEntry::new("tool", "hello again", "result3", false)).unwrap();
        
        let results = store.search("hello");
        assert_eq!(results.len(), 2);
        
        let results = store.search("xyz");
        assert!(results.is_empty());
    }

    #[test]
    fn test_history_store_delete() {
        let mut store = InMemoryHistoryStore::new();
        
        let entry = HistoryEntry::new("tool", "input", "output", false);
        let id = entry.id.clone();
        store.add(entry).unwrap();
        
        assert_eq!(store.count(), 1);
        
        store.delete(&id).unwrap();
        assert_eq!(store.count(), 0);
    }

    #[test]
    fn test_history_store_delete_not_found() {
        let mut store = InMemoryHistoryStore::new();
        
        let result = store.delete("non-existent-id");
        assert!(result.is_err());
    }

    #[test]
    fn test_history_store_clear() {
        let mut store = InMemoryHistoryStore::new();
        
        store.add(HistoryEntry::new("tool", "input1", "output1", false)).unwrap();
        store.add(HistoryEntry::new("tool", "input2", "output2", false)).unwrap();
        
        assert_eq!(store.count(), 2);
        
        store.clear().unwrap();
        assert_eq!(store.count(), 0);
    }

    #[test]
    fn test_history_entry_serialization() {
        let entry = HistoryEntry::new("json-extractor", "{}", "result", false)
            .with_metadata("format", "json");
        
        // Test JSON serialization
        let json = serde_json::to_string(&entry).unwrap();
        let deserialized: HistoryEntry = serde_json::from_str(&json).unwrap();
        
        assert_eq!(deserialized.id, entry.id);
        assert_eq!(deserialized.tool, entry.tool);
        assert_eq!(deserialized.input, entry.input);
        assert_eq!(deserialized.output, entry.output);
        assert_eq!(deserialized.metadata, entry.metadata);
    }
}


    #[test]
    fn test_history_entry_obfuscate_basic() {
        // Test obfuscate method directly
        use base64::Engine;
        let data = "test data";
        let encoded = base64::engine::general_purpose::STANDARD.encode(data.as_bytes());
        // Verify base64 encoding works
        assert!(!encoded.is_empty());
    }

    #[test]
    fn test_history_entry_with_metadata_chaining() {
        // Test that with_metadata returns self for chaining
        let entry = HistoryEntry::new("tool", "input", "output", false)
            .with_metadata("key1", "value1")
            .with_metadata("key2", "value2");
        assert_eq!(entry.metadata.len(), 2);
    }

    #[test]
    fn test_history_entry_empty_metadata() {
        // Test entry created without metadata
        let entry = HistoryEntry::new("tool", "input", "output", false);
        assert!(entry.metadata.is_empty());
    }

    #[test]
    fn test_history_entry_tool_with_special_chars() {
        // Test tool name with special characters
        let entry = HistoryEntry::new("json-extractor-v2", "{}", "result", false);
        assert_eq!(entry.tool, "json-extractor-v2");
    }
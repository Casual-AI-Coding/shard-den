//! JSON extraction logic

use jsonpath_rust::parser::JsonPath;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use shard_den_core::Result;

/// Result of an extraction operation
#[derive(Debug, Clone)]
pub struct ExtractResult {
    pub values: Vec<ExtractedValue>,
}

/// A single extracted value
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractedValue {
    pub path: String,
    pub value: Value,
}

/// Main extractor implementation
#[derive(Debug, Default)]
pub struct Extractor;

impl Extractor {
    /// Create a new extractor
    pub fn new() -> Self {
        Self
    }

    /// Extract values from JSON using the given paths
    pub fn extract(&self, json: &Value, paths: &[String]) -> Result<ExtractResult> {
        let values = paths
            .iter()
            .map(|path| self.extract_single(json, path))
            .collect::<Result<Vec<_>>>()?;

        Ok(ExtractResult { values })
    }

    fn extract_single(&self, json: &Value, path: &str) -> Result<ExtractedValue> {
        let json_path = JsonPath::try_from(path).map_err(|e| {
            shard_den_core::ShardDenError::invalid_input(format!("JSONPath error: {}", e))
        })?;

        let result = json_path.find(json);

        Ok(ExtractedValue {
            path: path.to_string(),
            value: result,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extractor_new() {
        let extractor = Extractor::new();
        let _ = extractor; // Placeholder assertion
    }

    #[test]
    fn test_extract_array_wildcard() {
        let json: Value =
            serde_json::from_str(r#"{"items": [{"id": 1}, {"id": 2}, {"id": 3}]}"#).unwrap();
        let extractor = Extractor::new();
        // JSONPath array wildcard syntax: $.items[*].id
        let result = extractor.extract(&json, &["$.items[*].id".to_string()]);
        println!("Array wildcard result: {:?}", result);
        assert!(result.is_ok(), "Error: {:?}", result.err());
        let extract_result = result.unwrap();
        assert_eq!(extract_result.values.len(), 1);
        let extracted = &extract_result.values[0].value;
        // find() wraps result in array
        let arr = extracted.as_array().unwrap();
        // Should get [1, 2, 3]
        assert_eq!(arr.len(), 3);
    }

    #[test]
    fn test_extract_filter() {
        let json: Value =
            serde_json::from_str(r#"{"items": [{"price": 10}, {"price": 20}, {"price": 30}]}"#)
                .unwrap();
        let extractor = Extractor::new();
        // JSONPath filter syntax: $.items[?(@.price > 15)]
        let result = extractor.extract(&json, &["$.items[?(@.price > 15)]".to_string()]);
        println!("Filter result: {:?}", result);
        assert!(result.is_ok(), "Error: {:?}", result.err());
        let extract_result = result.unwrap();
        assert_eq!(extract_result.values.len(), 1);
        let extracted = &extract_result.values[0].value;
        let arr = extracted.as_array().unwrap();
        // Should get items with price > 15: [{"price": 20}, {"price": 30}]
        assert_eq!(arr.len(), 2);
    }

    #[test]
    fn test_extract_recursive() {
        let json: Value =
            serde_json::from_str(r#"{"a": {"id": 1}, "b": {"c": {"id": 2}}}"#).unwrap();
        let extractor = Extractor::new();
        // JSONPath recursive descent: $..id
        let result = extractor.extract(&json, &["$..id".to_string()]);
        println!("Recursive result: {:?}", result);
        assert!(result.is_ok(), "Error: {:?}", result.err());
        let extract_result = result.unwrap();
        assert_eq!(extract_result.values.len(), 1);
        let extracted = &extract_result.values[0].value;
        let arr = extracted.as_array().unwrap();
        // Should find all id fields recursively: [1, 2]
        assert_eq!(arr.len(), 2);
    }
}

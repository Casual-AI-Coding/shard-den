//! JSON extraction logic

use jsonpath_rust::parser::JsonPath;
use serde_json::Value;
use shard_den_core::Result;

/// Result of an extraction operation
#[derive(Debug, Clone)]
pub struct ExtractResult {
    pub values: Vec<ExtractedValue>,
}

/// A single extracted value
#[derive(Debug, Clone)]
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
    fn test_extract_simple_path() {
        let json: Value = serde_json::from_str(r#"{"name": "test", "value": 123}"#).unwrap();
        let extractor = Extractor::new();
        // JSONPath needs to start with $
        let result = extractor.extract(&json, &["$.name".to_string()]);
        println!("Result: {:?}", result);
        assert!(result.is_ok(), "Error: {:?}", result.err());
        let extract_result = result.unwrap();
        assert_eq!(extract_result.values.len(), 1);
        // find() wraps result in array
        let extracted = &extract_result.values[0].value;
        assert!(extracted.is_array(), "Expected array, got: {:?}", extracted);
        let arr = extracted.as_array().unwrap();
        assert_eq!(arr.len(), 1);
        assert_eq!(arr[0], "test");
    }
}

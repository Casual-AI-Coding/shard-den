//! JSON Extractor - Extract fields from JSON using path syntax
//!
//! Supports JSONPath-like syntax:
//! - `key` - Get key value
//! - `*` - Wildcard
//! - `[]` - Array iteration
//! - `[0]` - Array index
//! - `..` - Recursive descent

use wasm_bindgen::prelude::*;

pub mod extract;
pub mod format;
pub mod path;

pub use extract::{Extractor, ExtractResult};
pub use format::{Formatter, OutputFormat};
pub use path::{JsonPath, PathParser};

/// WASM-compatible JSON Extractor
#[wasm_bindgen]
pub struct JsonExtractor {
    parser: PathParser,
    formatter: Formatter,
}

#[wasm_bindgen]
impl JsonExtractor {
    /// Create a new extractor
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            parser: PathParser::new(),
            formatter: Formatter::new(),
        }
    }

    /// Extract fields from JSON
    /// 
    /// # Arguments
    /// * `json` - Input JSON string
    /// * `paths` - Comma-separated path expressions
    /// 
    /// # Returns
    /// Extracted values as JSON string, or error
    pub fn extract(&self, json: &str, paths: &str) -> Result<String, JsValue> {
        let paths: Vec<&str> = paths.split(',').map(|s| s.trim()).collect();
        let result = self.extract_internal(json, &paths)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
        serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Auto-detect available paths in JSON
    pub fn detect_paths(&self, json: &str) -> Result<String, JsValue> {
        let paths = self.detect_paths_internal(json)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
        serde_json::to_string(&paths)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Get tool name
    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        "json-extractor".to_string()
    }

    /// Get tool description
    #[wasm_bindgen(getter)]
    pub fn description(&self) -> String {
        "Extract fields from JSON using path syntax".to_string()
    }
}

impl JsonExtractor {
    fn extract_internal(&self, json: &str, paths: &[&str]) -> shard_den_core::Result<serde_json::Value> {
        // Placeholder - will be implemented
        let _ = paths;
        let value: serde_json::Value = serde_json::from_str(json)?;
        Ok(value)
    }

    fn detect_paths_internal(&self, json: &str) -> shard_den_core::Result<Vec<String>> {
        // Placeholder - will be implemented
        let _ = json;
        Ok(vec![])
    }
}

impl Default for JsonExtractor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extractor_creation() {
        let extractor = JsonExtractor::new();
        assert_eq!(extractor.name(), "json-extractor");
    }

    #[test]
    fn test_extract_placeholder() {
        let extractor = JsonExtractor::new();
        let json = r#"{"name": "test"}"#;
        let result = extractor.extract_internal(json, &["name"]);
        assert!(result.is_ok());
    }
}

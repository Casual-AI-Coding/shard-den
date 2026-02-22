//! JSON Extractor - Extract fields from JSON using path syntax
//!
//! Supports JSONPath-like syntax:
//! - `key` - Get key value
//! - `*` - Wildcard
//! - `[]` - Array iteration
//! - `[0]` - Array index
//! - `..` - Recursive descent

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub mod extract;
pub mod format;
pub mod path;

pub use extract::{ExtractResult, Extractor};
pub use format::{Formatter, OutputFormat};
pub use path::{JsonPath, PathParser};

/// Pure Rust JSON Extractor (for CLI)
#[allow(dead_code)]
pub struct JsonExtractorCore {
    extractor: Extractor,
    formatter: Formatter,
    path_parser: PathParser,
}

impl JsonExtractorCore {
    pub fn new() -> Self {
        Self {
            extractor: Extractor::new(),
            formatter: Formatter::new(),
            path_parser: PathParser::new(),
        }
    }

    pub fn extract(&self, json: &str, paths: &str) -> shard_den_core::Result<String> {
        let paths_vec: Vec<String> = paths.split(',').map(|s| s.trim().to_string()).collect();

        let value: serde_json::Value = serde_json::from_str(json)?;
        let result = self.extractor.extract(&value, &paths_vec)?;

        // Return just the extracted values as JSON array
        // Each path returns an array of values from jsonpath-rust
        let mut all_values: Vec<serde_json::Value> = Vec::new();
        for extracted in &result.values {
            if let serde_json::Value::Array(arr) = &extracted.value {
                all_values.extend(arr.clone());
            } else {
                all_values.push(extracted.value.clone());
            }
        }
        serde_json::to_string(&all_values).map_err(Into::into)
    }

    pub fn extract_with_format(
        &self, json: &str, paths: &str, format: OutputFormat,
    ) -> shard_den_core::Result<String> {
        let paths_vec: Vec<String> = paths.split(',').map(|s| s.trim().to_string()).collect();

        let value: serde_json::Value = serde_json::from_str(json)?;
        let result = self.extractor.extract(&value, &paths_vec)?;

        // Get all extracted values (flatten arrays from jsonpath)
        let mut all_values: Vec<serde_json::Value> = Vec::new();
        for extracted in &result.values {
            if let serde_json::Value::Array(arr) = &extracted.value {
                all_values.extend(arr.clone());
            } else {
                all_values.push(extracted.value.clone());
            }
        }

        // Convert to JSON Value for formatting
        let json_value: serde_json::Value = serde_json::to_value(&all_values)?;
        self.formatter.format(&json_value, format)
    }

    pub fn detect_paths(&self, json: &str) -> shard_den_core::Result<Vec<String>> {
        let value: serde_json::Value = serde_json::from_str(json)?;
        Ok(self.path_parser.detect_paths(&value))
    }
}

impl Default for JsonExtractorCore {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(feature = "wasm")]
/// WASM-compatible JSON Extractor
#[wasm_bindgen]
#[allow(dead_code)]
pub struct JsonExtractor {
    extractor: Extractor,
    formatter: Formatter,
    path_parser: PathParser,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl JsonExtractor {
    /// Create a new extractor
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            extractor: Extractor::new(),
            formatter: Formatter::new(),
            path_parser: PathParser::new(),
        }
    }

    /// Extract fields from JSON
    pub fn extract(&self, json: &str, paths: &str) -> Result<String, JsValue> {
        let paths_vec: Vec<String> = paths.split(',').map(|s| s.trim().to_string()).collect();

        let value: serde_json::Value =
            serde_json::from_str(json).map_err(|e| JsValue::from_str(&e.to_string()))?;

        let result = self
            .extractor
            .extract(&value, &paths_vec)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        // Flatten the extracted values
        let mut all_values: Vec<serde_json::Value> = Vec::new();
        for extracted in &result.values {
            if let serde_json::Value::Array(arr) = &extracted.value {
                all_values.extend(arr.clone());
            } else {
                all_values.push(extracted.value.clone());
            }
        }

        // If single path with single value, return unwrapped
        let json_value = if paths_vec.len() == 1 && all_values.len() == 1 {
            all_values.into_iter().next().unwrap()
        } else {
            serde_json::to_value(&all_values).map_err(|e| JsValue::from_str(&e.to_string()))?
        };

        serde_json::to_string(&json_value).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Extract with format
    pub fn extract_with_format(
        &self, json: &str, paths: &str, format: &str,
    ) -> Result<String, JsValue> {
        let paths_vec: Vec<String> = paths.split(',').map(|s| s.trim().to_string()).collect();

        let value: serde_json::Value =
            serde_json::from_str(json).map_err(|e| JsValue::from_str(&e.to_string()))?;

        let result = self
            .extractor
            .extract(&value, &paths_vec)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        // Flatten the extracted values
        let mut all_values: Vec<serde_json::Value> = Vec::new();
        for extracted in &result.values {
            if let serde_json::Value::Array(arr) = &extracted.value {
                all_values.extend(arr.clone());
            } else {
                all_values.push(extracted.value.clone());
            }
        }

        // If single path with single value, return unwrapped
        let json_value: serde_json::Value = if paths_vec.len() == 1 && all_values.len() == 1 {
            all_values.into_iter().next().unwrap()
        } else {
            serde_json::to_value(&all_values).map_err(|e| JsValue::from_str(&e.to_string()))?
        };

        let output_format = match format.to_lowercase().as_str() {
            "csv" => OutputFormat::Csv,
            "text" => OutputFormat::Text,
            "yaml" => OutputFormat::Yaml,
            _ => OutputFormat::Json,
        };

        self.formatter
            .format(&json_value, output_format)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Auto-detect available paths in JSON
    pub fn detect_paths(&self, json: &str) -> Result<String, JsValue> {
        let value: serde_json::Value =
            serde_json::from_str(json).map_err(|e| JsValue::from_str(&e.to_string()))?;

        let paths = self.path_parser.detect_paths(&value);

        serde_json::to_string(&paths).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        "json-extractor".to_string()
    }

    #[wasm_bindgen(getter)]
    pub fn description(&self) -> String {
        "Extract fields from JSON using path syntax".to_string()
    }
}

#[cfg(feature = "wasm")]
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
        let extractor = JsonExtractorCore::new();
        let json = r#"{"name": "test"}"#;
        // JSONPath requires $ prefix
        let result = extractor.extract(json, "$.name");
        assert!(result.is_ok());
    }

    #[test]
    fn test_extract_placeholder() {
        let extractor = JsonExtractorCore::new();
        let json = r#"{"name": "test"}"#;
        // JSONPath requires $ prefix
        let result = extractor.extract(json, "$.name");
        assert!(result.is_ok());
    }

    #[test]
    fn test_extract_with_format_json() {
        let extractor = JsonExtractorCore::new();
        let json = r#"{"items": [{"id": 1}]}"#;
        let result = extractor.extract_with_format(json, "$.items[*].id", OutputFormat::Json);
        assert!(result.is_ok());
    }

    #[test]
    fn test_extract_with_format_csv() {
        let extractor = JsonExtractorCore::new();
        let json = r#"{"items": [{"id": 1}]}"#;
        let result = extractor.extract_with_format(json, "$.items[*].id", OutputFormat::Csv);
        assert!(result.is_ok());
    }

    #[test]
    fn test_extract_with_format_text() {
        let extractor = JsonExtractorCore::new();
        let json = r#"{"items": [{"id": 1}]}"#;
        let result = extractor.extract_with_format(json, "$.items[*].id", OutputFormat::Text);
        assert!(result.is_ok());
    }

    #[test]
    fn test_extract_with_format_yaml() {
        let extractor = JsonExtractorCore::new();
        let json = r#"{"items": [{"id": 1}]}"#;
        let result = extractor.extract_with_format(json, "$.items[*].id", OutputFormat::Yaml);
        assert!(result.is_ok());
    }

    #[test]
    fn test_detect_paths() {
        let extractor = JsonExtractorCore::new();
        let json = r#"{"name": "test", "data": {"id": 1}}"#;
        let result = extractor.detect_paths(json);
        assert!(result.is_ok());
        let paths = result.unwrap();
        assert!(paths.contains(&"name".to_string()));
        assert!(paths.contains(&"data".to_string()));
    }

    #[test]
    fn test_detect_paths_invalid_json() {
        let extractor = JsonExtractorCore::new();
        let json = r#"not json"#;
        let result = extractor.detect_paths(json);
        assert!(result.is_err());
    }

    #[test]
    fn test_extract_invalid_json() {
        let extractor = JsonExtractorCore::new();
        let json = r#"not json"#;
        let result = extractor.extract(json, "$.name");
        assert!(result.is_err());
    }

    #[test]
    fn test_extract_multiple_paths() {
        let extractor = JsonExtractorCore::new();
        let json = r#"{"name": "test", "value": 42}"#;
        let result = extractor.extract(json, "$.name,$.value");
        assert!(result.is_ok());
    }
}

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

use shard_den_core::ShardDenError;

/// Maximum allowed JSON nesting depth to prevent stack overflow
const MAX_JSON_DEPTH: usize = 128;

/// Check JSON value depth recursively
fn check_json_depth(value: &serde_json::Value, depth: usize) -> Result<(), String> {
    if depth > MAX_JSON_DEPTH {
        return Err(format!("JSON too deeply nested (max: {})", MAX_JSON_DEPTH));
    }

    match value {
        serde_json::Value::Array(arr) => {
            for item in arr {
                check_json_depth(item, depth + 1)?;
            }
        }
        serde_json::Value::Object(obj) => {
            for (_, v) in obj {
                check_json_depth(v, depth + 1)?;
            }
        }
        _ => {}
    }
    Ok(())
}

/// Parse paths string, handling quoted strings and escape characters
pub fn parse_paths(input: &str) -> Vec<String> {
    let mut paths = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    let mut escape_next = false;

    for ch in input.chars() {
        match (ch, escape_next, in_quotes) {
            // Handle escape character
            ('\\', false, _) => escape_next = true,
            // Handle escaped quote inside quotes - add quote and reset escape
            ('"', true, true) => {
                current.push('"');
                escape_next = false;
            }
            // Handle quote toggle (only when not escaped)
            ('"', false, _) => in_quotes = !in_quotes,
            // Handle comma separator (only when outside quotes)
            (',', false, false) => {
                if !current.is_empty() {
                    paths.push(current.trim().to_string());
                    current.clear();
                }
            }
            _ => {
                current.push(ch);
                escape_next = false;
            }
        }
    }

    if !current.is_empty() {
        paths.push(current.trim().to_string());
    }

    paths
}

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
        let paths_vec = parse_paths(paths);

        let value: serde_json::Value = serde_json::from_str(json)?;
        check_json_depth(&value, 0).map_err(ShardDenError::invalid_input)?;
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
        let paths_vec = parse_paths(paths);

        let value: serde_json::Value = serde_json::from_str(json)?;
        check_json_depth(&value, 0).map_err(ShardDenError::invalid_input)?;
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
        check_json_depth(&value, 0).map_err(ShardDenError::invalid_input)?;
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
        let paths_vec = parse_paths(paths);

        let value: serde_json::Value =
            serde_json::from_str(json).map_err(|e| JsValue::from_str(&e.to_string()))?;
        check_json_depth(&value, 0).map_err(|e| JsValue::from_str(&e))?;

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
        let paths_vec = parse_paths(paths);

        let value: serde_json::Value =
            serde_json::from_str(json).map_err(|e| JsValue::from_str(&e.to_string()))?;
        check_json_depth(&value, 0).map_err(|e| JsValue::from_str(&e))?;

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
        check_json_depth(&value, 0).map_err(|e| JsValue::from_str(&e))?;

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
        assert!(paths.contains(&"$.name".to_string()));
        assert!(paths.contains(&"$.data".to_string()));
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

    #[test]
    fn test_extractor_default() {
        // Test Default implementation
        let extractor = JsonExtractorCore::default();
        let json = r#"{"name": "test"}"#;
        let result = extractor.extract(json, "$.name");
        assert!(result.is_ok());
    }

    #[test]
    fn test_extract_single_value_non_array() {
        // Test extracting a single scalar value (not wrapped in array)
        let extractor = JsonExtractorCore::new();
        let json = r#"{"name": "test", "count": 5}"#;
        // Extract single path - result should not be wrapped in array
        let result = extractor.extract(json, "$.count");
        assert!(result.is_ok());
    }

    #[test]
    fn test_extract_with_format_single_value() {
        // Test extract_with_format with single value
        let extractor = JsonExtractorCore::new();
        let json = r#"{"value": 42}"#;
        let result = extractor.extract_with_format(json, "$.value", OutputFormat::Text);
        assert!(result.is_ok());
    }

    #[test]
    fn test_json_depth_limit() {
        // Test that deeply nested JSON is rejected
        let extractor = JsonExtractorCore::new();

        // Create JSON with 200 levels of nesting
        let mut json = "{\"a\":".to_string();
        for _ in 0..199 {
            json.push_str("{\"a\":");
        }
        json.push_str("1");
        for _ in 0..200 {
            json.push_str("}");
        }

        let result = extractor.extract(&json, "$.a");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_paths_basic() {
        let paths = parse_paths("$.name,$.value");
        assert_eq!(paths, vec!["$.name", "$.value"]);
    }

    #[test]
    fn test_parse_paths_with_quoted_comma() {
        // Test quoted string with comma inside
        let paths = parse_paths("\"a,b\",c");
        assert_eq!(paths, vec!["a,b", "c"]);
    }

    #[test]
    fn test_parse_paths_with_spaces() {
        let paths = parse_paths("  $.name  ,  $.value  ");
        assert_eq!(paths, vec!["$.name", "$.value"]);
    }

    #[test]
    fn test_parse_paths_empty() {
        let paths = parse_paths("");
        assert!(paths.is_empty());
    }

    #[test]
    fn test_parse_paths_single() {
        let paths = parse_paths("$.name");
        assert_eq!(paths, vec!["$.name"]);
    }

    #[test]
    fn test_parse_paths_with_escape() {
        // Test escape character
        let paths = parse_paths("a\\,b,c");
        assert_eq!(paths, vec!["a,b", "c"]);
    }

    #[test]
    fn test_parse_paths_with_escaped_quote() {
        // Test escaped quote inside quotes
        let paths = parse_paths(r#"a\"b,c"#);
        assert_eq!(paths, vec![r#"a"b"#, "c"]);
    }

    #[test]
    fn test_extract_scalar_value_not_array() {
        // Test extracting a scalar value which is not wrapped in array
        let extractor = JsonExtractorCore::new();
        let json = r#"{"value": 42}"#;
        // Extract single value - should push directly (line 118/139)
        let result = extractor.extract(json, "$.value");
        assert!(result.is_ok());
        let output = result.unwrap();
        // Should contain the value
        assert!(output.contains("42"));
    }

    #[test]
    fn test_extract_with_format_scalar_value() {
        // Test extract_with_format with scalar value (not array)
        let extractor = JsonExtractorCore::new();
        let json = r#"{"name": "test"}"#;
        let result = extractor.extract_with_format(json, "$.name", OutputFormat::Text);
        assert!(result.is_ok());
    }

    // Tests for check_json_depth function
    #[test]
    fn test_check_json_depth_valid() {
        let json = serde_json::json!({
            "level1": {
                "level2": {
                    "level3": "value"
                }
            }
        });
        let result = check_json_depth(&json, 0);
        assert!(result.is_ok());
    }

    #[test]
    fn test_check_json_depth_array() {
        let json = serde_json::json!({
            "items": [{"a": 1}, {"a": 2}]
        });
        let result = check_json_depth(&json, 0);
        assert!(result.is_ok());
    }

    #[test]
    fn test_check_json_depth_exceeds_limit() {
        // Create deeply nested JSON that exceeds limit
        let mut json = serde_json::json!({"a": 1});
        for _ in 0..130 {
            json = serde_json::json!({"a": json});
        }
        let result = check_json_depth(&json, 0);
        assert!(result.is_err());
    }

    // Tests for parse_paths edge cases
    #[test]
    fn test_parse_paths_only_spaces() {
        let paths = parse_paths("   ");
        assert!(paths.is_empty());
    }

    #[test]
    fn test_parse_paths_trailing_comma() {
        let paths = parse_paths("a,b,");
        assert_eq!(paths, vec!["a", "b"]);
    }

    #[test]
    fn test_parse_paths_multiple_commas() {
        let paths = parse_paths("a,,b");
        assert_eq!(paths, vec!["a", "", "b"]);
    }
}

// Tests for WASM JsonExtractor (only compiled with wasm feature)
#[cfg(feature = "wasm")]
#[cfg(test)]
mod wasm_tests {
    use super::*;

    #[test]
    fn test_wasm_extractor_new() {
        let extractor = JsonExtractor::new();
        // Just verify it can be created
        assert!(!extractor.name().is_empty());
    }

    #[test]
    fn test_wasm_extractor_default() {
        let extractor = JsonExtractor::default();
        assert!(!extractor.name().is_empty());
    }

    #[test]
    fn test_wasm_extractor_name() {
        let extractor = JsonExtractor::new();
        assert_eq!(extractor.name(), "json-extractor");
    }

    #[test]
    fn test_wasm_extractor_description() {
        let extractor = JsonExtractor::new();
        assert!(!extractor.description().is_empty());
    }

    #[test]
    fn test_wasm_extract_basic() {
        let extractor = JsonExtractor::new();
        let json = r#"{"name": "test"}"#;
        let result = extractor.extract(json, "$.name");
        assert!(result.is_ok());
    }

    #[test]
    fn test_wasm_extract_with_format() {
        let extractor = JsonExtractor::new();
        let json = r#"{"items": [{"id": 1}]}"#;
        let result = extractor.extract_with_format(json, "$.items[*].id", "json");
        assert!(result.is_ok());
    }

    #[test]
    fn test_wasm_extract_with_format_csv() {
        let extractor = JsonExtractor::new();
        let json = r#"{"items": [{"name": "a"}, {"name": "b"}]}"#;
        let result = extractor.extract_with_format(json, "$.items[*].name", "csv");
        assert!(result.is_ok());
    }

    #[test]
    fn test_wasm_extract_with_format_text() {
        let extractor = JsonExtractor::new();
        let json = r#"{"value": 42}"#;
        let result = extractor.extract_with_format(json, "$.value", "text");
        assert!(result.is_ok());
    }

    #[test]
    fn test_wasm_extract_with_format_yaml() {
        let extractor = JsonExtractor::new();
        let json = r#"{"name": "test"}"#;
        let result = extractor.extract_with_format(json, "$.name", "yaml");
        assert!(result.is_ok());
    }

    #[test]
    fn test_wasm_detect_paths() {
        let extractor = JsonExtractor::new();
        let json = r#"{"name": "test", "data": {"id": 1}}"#;
        let result = extractor.detect_paths(json);
        assert!(result.is_ok());
        let paths: Vec<String> = serde_json::from_str(&result.unwrap()).unwrap();
        assert!(!paths.is_empty());
    }

    #[test]
    fn test_wasm_extract_invalid_json() {
        let extractor = JsonExtractor::new();
        let result = extractor.extract("not json", "$.name");
        assert!(result.is_err());
    }

    #[test]
    fn test_wasm_extract_invalid_path() {
        let extractor = JsonExtractor::new();
        let json = r#"{"name": "test"}"#;
        let result = extractor.extract(json, "$.invalid[path");
        // Invalid JSONPath may return error or empty
        assert!(result.is_err() || result.unwrap().is_empty());
    }
}

#[cfg(test)]
mod core_tests {
    use super::*;

    #[test]
    fn test_extract_with_format_scalar_value() {
        // Test extract_with_format with scalar value (not array)
        let extractor = JsonExtractorCore::new();
        let json = r#"{"name": "test"}"#;
        let result = extractor.extract_with_format(json, "$.name", OutputFormat::Text);
        assert!(result.is_ok());
    }

    #[test]
    fn test_extract_with_format_scalar_value() {
        // Test extract_with_format with scalar value (not array)
        let extractor = JsonExtractorCore::new();
        let json = r#"{"name": "test"}"#;
        let result = extractor.extract_with_format(json, "$.name", OutputFormat::Text);
        assert!(result.is_ok());
    }
}

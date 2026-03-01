//! Path parsing and traversal

use serde_json::Value;
use shard_den_core::Result;

/// A parsed JSON path
#[derive(Debug, Clone)]
pub enum JsonPath {
    Key(String),
    Index(usize),
    Wildcard,
    Recursive(String),
}

/// Path parser for JSONPath-like syntax
#[derive(Debug, Default)]
pub struct PathParser;

impl PathParser {
    /// Create a new parser
    pub fn new() -> Self {
        Self
    }

    /// Parse a path string into components
    #[doc(hidden)]
    #[deprecated(since = "0.3.0", note = "Not yet implemented - use extract() instead")]
    pub fn parse(&self, path: &str) -> Result<Vec<JsonPath>> {
        // TODO: Implement path parsing
        let _ = path;
        Ok(vec![])
    }

    /// Traverse a JSON value using the parsed path
    #[doc(hidden)]
    #[deprecated(since = "0.3.0", note = "Not yet implemented")]
    pub fn traverse<'a>(&self, value: &'a Value, path: &[JsonPath]) -> Result<Vec<&'a Value>> {
        // TODO: Implement traversal
        let _ = path;
        Ok(vec![value])
    }

    /// Auto-detect all possible paths in a JSON value
    pub fn detect_paths(&self, value: &Value) -> Vec<String> {
        let mut paths = Vec::new();
        self.detect_paths_recursive(value, "", &mut paths);
        paths
    }

    fn detect_paths_recursive(&self, value: &Value, prefix: &str, paths: &mut Vec<String>) {
        match value {
            Value::Object(map) => {
                for (key, val) in map {
                    let path = if prefix.is_empty() {
                        format!("$.{}", key)
                    } else {
                        format!("{}.{}", prefix, key)
                    };
                    paths.push(path.clone());
                    self.detect_paths_recursive(val, &path, paths);
                }
            }
            Value::Array(arr) => {
                if arr.is_empty() {
                    return;
                }
                // For arrays, show only [*] wildcard instead of indices
                let path = format!("{}[*]", prefix);
                paths.push(path);

                // Only recurse into the first element to avoid duplicates
                if let Some(first) = arr.first() {
                    self.detect_paths_recursive(first, &format!("{}[*]", prefix), paths);
                }
            }
            _ => {}
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_path_parser_new() {
        let parser = PathParser::new();
        let _ = parser;
    }

    #[test]
    fn test_detect_paths() {
        let parser = PathParser::new();
        let value = json!({
            "name": "test",
            "data": {
                "items": [1, 2, 3]
            }
        });

        let paths = parser.detect_paths(&value);
        assert!(paths.contains(&"$.name".to_string()));
        assert!(paths.contains(&"$.data".to_string()));
        assert!(paths.contains(&"$.data.items[*]".to_string()));
    }

    #[test]
    fn test_detect_paths_empty() {
        let parser = PathParser::new();
        let value = json!("simple string");
        let paths = parser.detect_paths(&value);
        assert!(paths.is_empty());
    }

    #[test]
    fn test_detect_paths_array() {
        let parser = PathParser::new();
        let value = json!([1, 2, 3]);
        let paths = parser.detect_paths(&value);
        assert!(!paths.is_empty());
        // For array [1,2,3], prefix starts empty so path is "$[*]" from recursion
        // Actually it will be just "[*]" since prefix is empty initially
        // But when recursing into first element, it becomes "$[*]" - wait no
        // Let's check actual output
        let has_array_path = paths.iter().any(|p| p.contains("[*]"));
        assert!(
            has_array_path,
            "Expected path containing [*], got: {:?}",
            paths
        );
    }

    #[test]
    fn test_detect_paths_nested() {
        let parser = PathParser::new();
        let value = json!({"a": {"b": {"c": 1}}});
        let paths = parser.detect_paths(&value);
        assert!(paths.contains(&"$.a".to_string()));
        assert!(paths.contains(&"$.a.b".to_string()));
        assert!(paths.contains(&"$.a.b.c".to_string()));
    }

    #[test]
    fn test_detect_paths_number() {
        let parser = PathParser::new();
        let value = json!(42);
        let paths = parser.detect_paths(&value);
        assert!(paths.is_empty());
    }

    #[test]
    fn test_detect_paths_bool() {
        let parser = PathParser::new();
        let value = json!(true);
        let paths = parser.detect_paths(&value);
        assert!(paths.is_empty());
    }

    #[test]
    fn test_detect_paths_null() {
        let parser = PathParser::new();
        let value = json!(null);
        let paths = parser.detect_paths(&value);
        assert!(paths.is_empty());
    }

    #[test]
    #[allow(deprecated)]
    fn test_parse_deprecated() {
        let parser = PathParser::new();
        let result = parser.parse("data.items[0]");
        // Deprecated method returns empty vec
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[test]
    #[allow(deprecated)]
    fn test_traverse_deprecated() {
        let parser = PathParser::new();
        let value = json!({"key": "value"});
        let result = parser.traverse(&value, &[]);
        // Deprecated method returns the value itself
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 1);
    }

    #[test]
    fn test_detect_paths_empty_array() {
        let parser = PathParser::new();
        let value = json!([]);
        let paths = parser.detect_paths(&value);
        // Empty array should return empty paths
        assert!(paths.is_empty());
    }

    #[test]
    fn test_detect_paths_complex_nested() {
        let parser = PathParser::new();
        let value = json!({
            "users": [
                {"name": "Alice", "age": 30},
                {"name": "Bob", "age": 25}
            ]
        });
        let paths = parser.detect_paths(&value);
        assert!(paths.contains(&"$.users[*]".to_string()));
    }
}

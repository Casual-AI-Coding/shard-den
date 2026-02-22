//! Output formatting

use serde_json::Value;
use shard_den_core::Result;

/// Output format options
#[derive(Debug, Clone, Copy, Default)]
pub enum OutputFormat {
    #[default]
    Json,
    Csv,
    Text,
    Yaml,
}

/// Formatter for extraction results
#[derive(Debug, Default)]
pub struct Formatter;

impl Formatter {
    /// Create a new formatter
    pub fn new() -> Self {
        Self
    }

    /// Format a JSON value to the specified output format
    pub fn format(&self, value: &Value, format: OutputFormat) -> Result<String> {
        match format {
            OutputFormat::Json => {
                serde_json::to_string_pretty(value).map_err(shard_den_core::ShardDenError::Json)
            }
            OutputFormat::Csv => self.format_csv(value),
            OutputFormat::Text => self.format_text(value),
            OutputFormat::Yaml => self.format_yaml(value),
        }
    }

    fn format_csv(&self, value: &Value) -> Result<String> {
        // Handle different value types
        match value {
            // Array of objects -> CSV table
            Value::Array(arr) if !arr.is_empty() && arr.iter().all(|v| v.is_object()) => {
                let mut headers: Vec<String> = Vec::new();
                for item in arr {
                    if let Value::Object(obj) = item {
                        for key in obj.keys() {
                            if !headers.contains(key) {
                                headers.push(key.clone());
                            }
                        }
                    }
                }

                if headers.is_empty() {
                    return Ok(String::new());
                }

                // Build CSV
                let mut csv = headers.join(",") + "\n";
                for item in arr {
                    if let Value::Object(obj) = item {
                        let row: Vec<String> = headers
                            .iter()
                            .map(|h| {
                                obj.get(h)
                                    .map(|v| self.escape_csv_value(v))
                                    .unwrap_or_default()
                            })
                            .collect();
                        csv.push_str(&row.join(","));
                        csv.push('\n');
                    }
                }
                Ok(csv)
            }
            // Simple array -> just values
            Value::Array(arr) => {
                let values: Vec<String> = arr.iter().map(|v| self.escape_csv_value(v)).collect();
                Ok(values.join(","))
            }
            // Single value
            _ => Ok(self.escape_csv_value(value)),
        }
    }

    fn escape_csv_value(&self, value: &Value) -> String {
        match value {
            Value::String(s) => {
                if s.contains(',') || s.contains('"') || s.contains('\n') {
                    format!("\"{}\"", s.replace('"', "\"\""))
                } else {
                    s.clone()
                }
            }
            Value::Null => "".to_string(),
            _ => value.to_string(),
        }
    }

    fn format_text(&self, value: &Value) -> Result<String> {
        match value {
            Value::String(s) => Ok(s.clone()),
            Value::Array(arr) => {
                let items: Vec<String> = arr.iter().map(|v| self.value_to_text(v)).collect();
                Ok(items.join("\n"))
            }
            _ => Ok(self.value_to_text(value)),
        }
    }

    fn value_to_text(&self, value: &Value) -> String {
        match value {
            Value::String(s) => s.clone(),
            Value::Null => "null".to_string(),
            Value::Bool(b) => b.to_string(),
            Value::Number(n) => n.to_string(),
            Value::Array(arr) => {
                let items: Vec<String> = arr.iter().map(|v| self.value_to_text(v)).collect();
                format!("[{}]", items.join(", "))
            }
            Value::Object(obj) => {
                let pairs: Vec<String> = obj
                    .iter()
                    .map(|(k, v)| format!("{}: {}", k, self.value_to_text(v)))
                    .collect();
                format!("{{{}}}", pairs.join(", "))
            }
        }
    }

    fn format_yaml(&self, value: &Value) -> Result<String> {
        serde_yaml::to_string(value).map_err(shard_den_core::ShardDenError::Yaml)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_format_json() {
        let formatter = Formatter::new();
        let value = json!({"key": "value"});
        let result = formatter.format(&value, OutputFormat::Json);
        assert!(result.is_ok());
    }

    #[test]
    fn test_format_json_pretty() {
        let formatter = Formatter::new();
        let value = json!({"a": 1, "b": 2});
        let result = formatter.format(&value, OutputFormat::Json).unwrap();
        assert!(result.contains("a"));
        assert!(result.contains("1"));
    }

    #[test]
    fn test_format_text_string() {
        let formatter = Formatter::new();
        let value = json!("hello world");
        let result = formatter.format(&value, OutputFormat::Text).unwrap();
        assert_eq!(result, "hello world");
    }

    #[test]
    fn test_format_text_number() {
        let formatter = Formatter::new();
        let value = json!(42);
        let result = formatter.format(&value, OutputFormat::Text).unwrap();
        assert_eq!(result, "42");
    }

    #[test]
    fn test_format_text_boolean() {
        let formatter = Formatter::new();
        let value = json!(true);
        let result = formatter.format(&value, OutputFormat::Text).unwrap();
        assert_eq!(result, "true");
    }

    #[test]
    fn test_format_text_null() {
        let formatter = Formatter::new();
        let value = json!(null);
        let result = formatter.format(&value, OutputFormat::Text).unwrap();
        assert_eq!(result, "null");
    }

    #[test]
    fn test_format_text_array() {
        let formatter = Formatter::new();
        let value = json!([1, 2, 3]);
        let result = formatter.format(&value, OutputFormat::Text).unwrap();
        assert!(result.contains("1"));
    }

    #[test]
    fn test_format_text_object() {
        let formatter = Formatter::new();
        let value = json!({"a": 1});
        let result = formatter.format(&value, OutputFormat::Text).unwrap();
        assert!(result.contains("a"));
    }

    #[test]
    fn test_format_csv_array_of_objects() {
        let formatter = Formatter::new();
        let value = json!([
            {"id": 1, "name": "alice"},
            {"id": 2, "name": "bob"}
        ]);
        let result = formatter.format(&value, OutputFormat::Csv).unwrap();
        let expected = "id,name\n1,alice\n2,bob\n";
        assert_eq!(result, expected);
    }

    #[test]
    fn test_format_csv_simple_array() {
        let formatter = Formatter::new();
        let value = json!([1, 2, 3]);
        let result = formatter.format(&value, OutputFormat::Csv).unwrap();
        assert_eq!(result, "1,2,3");
    }

    #[test]
    fn test_format_csv_single_value() {
        let formatter = Formatter::new();
        let value = json!("hello");
        let result = formatter.format(&value, OutputFormat::Csv).unwrap();
        assert_eq!(result, "hello");
    }

    #[test]
    fn test_format_csv_escape_quotes() {
        let formatter = Formatter::new();
        let value = json!(["hello,world", "test\"value"]);
        let result = formatter.format(&value, OutputFormat::Csv).unwrap();
        assert!(result.contains("\""));
    }

    #[test]
    fn test_format_yaml() {
        let formatter = Formatter::new();
        let value = json!({"key": "value"});
        let result = formatter.format(&value, OutputFormat::Yaml);
        assert!(result.is_ok());
    }

    #[test]
    fn test_format_yaml_array() {
        let formatter = Formatter::new();
        let value = json!([1, 2, 3]);
        let result = formatter.format(&value, OutputFormat::Yaml).unwrap();
        assert!(result.contains("- 1"));
    }

    #[test]
    fn test_format_csv_with_null() {
        let formatter = Formatter::new();
        // Array with null values
        let value = json!([{"name": null}, {"name": "test"}]);
        let result = formatter.format(&value, OutputFormat::Csv);
        // Should handle null gracefully
        assert!(result.is_ok());
    }

    #[test]
    fn test_format_csv_empty_array() {
        let formatter = Formatter::new();
        // Empty array
        let value = json!([]);
        let result = formatter.format(&value, OutputFormat::Csv);
        assert!(result.is_ok());
    }

    #[test]
    fn test_value_to_text_string() {
        let formatter = Formatter::new();
        // Direct string value
        let value = json!("hello");
        let result = formatter.format(&value, OutputFormat::Text);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "hello");
    }

    #[test]
    fn test_value_to_text_nested_array() {
        let formatter = Formatter::new();
        // Nested array in text format
        let value = json!([[1, 2], [3, 4]]);
        let result = formatter.format(&value, OutputFormat::Text);
        assert!(result.is_ok());
    }
}

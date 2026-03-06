//! WaveDrom Engine - Digital Timing Diagram Rendering Engine
//!
//! WaveDrom uses JSON format to describe digital timing diagrams.
//! Renders via wavedrom.com online editor using URL hash.

use crate::engine::interface::{DiagramType, Engine, RenderHint};
use crate::error::{Diagnostic, EngineError, Severity};
use crate::templates::Template;
use crate::theme::{Theme, ThemeCategory, ThemeTuning};
use std::fmt::Debug;

/// WaveDrom server base URL
const WAVEDROM_SERVER_URL: &str = "https://wavedrom.com/editor.html";

/// Maximum safe URL length for browsers
///
/// Internet Explorer has a URL limit of ~2083 characters, modern browsers
/// (Chrome, Firefox, Safari) support around 8000+ characters. We use 4000
/// as a safe middle ground to ensure compatibility across all browsers
/// while still allowing reasonably large diagrams.
const DEFAULT_MAX_URL_LENGTH: usize = 4000;

/// WaveDrom rendering engine
#[derive(Debug)]
pub struct WaveDromEngine {
    supported_types: Vec<DiagramType>,
    /// Maximum URL length for generated WaveDrom URLs
    max_url_length: usize,
}

impl Default for WaveDromEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl WaveDromEngine {
    /// Creates a new WaveDrom engine with default URL length limit (4000 chars)
    pub fn new() -> Self {
        Self {
            supported_types: vec![DiagramType::WaveDrom],
            max_url_length: DEFAULT_MAX_URL_LENGTH,
        }
    }

    /// Creates a new WaveDrom engine with custom URL length limit
    ///
    /// # Arguments
    /// * `max_url_length` - Maximum allowed URL length (minimum: 1000)
    ///
    /// # Panics
    /// Panics if `max_url_length` is less than 1000
    ///
    /// # Example
    /// ```ignore
    /// let engine = WaveDromEngine::with_url_limit(8000);
    /// ```
    /// ```ignore
    /// let engine = WaveDromEngine::with_url_limit(8000);
    /// ```
    /// ```
    /// let engine = WaveDromEngine::with_url_limit(8000);
    /// ```
    pub fn with_url_limit(max_url_length: usize) -> Self {
        assert!(
            max_url_length >= 1000,
            "max_url_length must be at least 1000"
        );
        Self {
            supported_types: vec![DiagramType::WaveDrom],
            max_url_length,
        }
    }

    fn get_wavedrom_themes() -> Vec<Theme> {
        vec![Theme {
            id: "wavedrom/default".to_string(),
            name: "Default".to_string(),
            category: ThemeCategory::Shared,
            tuning: ThemeTuning::default(),
        }]
    }

    fn get_wavedrom_templates() -> Vec<Template> {
        vec![
            Template::new(
                "wavedrom/basic_signal",
                "Basic Signal",
                r#"{
  "signal": [
    { "name": "clk", "wave": "p...." },
    { "name": "data", "wave": "x.345x", "data": ["D0", "D1", "D2"] }
  ]
}"#,
                "Basic signal timing diagram",
                DiagramType::WaveDrom,
            ),
            Template::new(
                "wavedrom/clock_data",
                "Clock and Data",
                r#"{
  "signal": [
    { "name": "clk", "wave": "p.....p.....", "period": 2 },
    { "name": "req", "wave": "0.1..0.1..0" },
    { "name": "ack", "wave": "0..1..0..1.." },
    { "name": "data", "wave": "x..3456x", "data": ["D0", "D1", "D2", "D3"] }
  ],
  "config": { "hscale": 2 }
}"#,
                "Clock and data bus timing",
                DiagramType::WaveDrom,
            ),
            Template::new(
                "wavedrom/bus_transaction",
                "Bus Transaction",
                r#"{
  "signal": [
    { "name": "CLK", "wave": "P" },
    { "name": "ADDR", "wave": "x3x4x5x", "data": ["A0", "A1", "A2"] },
    { "name": "DATA", "wave": "x=--=x", "data": ["D0", "D1"] },
    { "name": "WE", "wave": "01.0" },
    { "name": "RD", "wave": "0.1." }
  ]
}"#,
                "Bus transaction timing diagram",
                DiagramType::WaveDrom,
            ),
            Template::new(
                "wavedrom/state_machine",
                "State Machine",
                r#"{
  "signal": [
    { "name": "clk", "wave": "P............" },
    { "name": "rst", "wave": "01..........." },
    { "name": "state", "wave": "x=012=x", "data": ["IDLE", "WORK", "DONE"] },
    { "name": "output", "wave": "0..10..0...." }
  ],
  "config": { "hscale": 2 }
}"#,
                "State machine timing diagram",
                DiagramType::WaveDrom,
            ),
            Template::new(
                "wavedrom/i2c_protocol",
                "I2C Protocol",
                r#"{
  "signal": [
    { "name": "SCL", "wave": "p......p......p...." },
    { "name": "SDA", "wave": "x.1.0.x.0.1.x.1.0.x....", "data": ["START", "ADDR", "ACK", "DATA", "ACK", "STOP"] }
  ],
  "config": { "hscale": 1 }
}"#,
                "I2C communication protocol",
                DiagramType::WaveDrom,
            ),
        ]
    }

    /// Validate JSON syntax for WaveDrom
    fn validate_json(code: &str) -> Result<(), String> {
        serde_json::from_str::<serde_json::Value>(code)
            .map(|_| ())
            .map_err(|e| e.to_string())
    }

    /// Check if JSON has required WaveDrom signal field
    fn validate_structure(code: &str) -> Vec<Diagnostic> {
        let mut diagnostics = Vec::new();

        match serde_json::from_str::<serde_json::Value>(code) {
            Ok(json) => {
                // Check for required "signal" field
                if !json.get("signal").is_some() {
                    diagnostics.push(Diagnostic {
                        line: 1,
                        column: 1,
                        message: "Missing required 'signal' field in WaveDrom JSON".to_string(),
                        severity: Severity::Warning,
                    });
                }

                // Validate signal is an array
                if let Some(signal) = json.get("signal") {
                    if !signal.is_array() {
                        diagnostics.push(Diagnostic {
                            line: 1,
                            column: 1,
                            message: "'signal' must be an array".to_string(),
                            severity: Severity::Error,
                        });
                    }
                }
            }
            Err(e) => {
                // JSON parse error
                let line = e.line();
                let column = e.column();
                diagnostics.push(Diagnostic {
                    line,
                    column,
                    message: format!("JSON parse error: {}", e),
                    severity: Severity::Error,
                });
            }
        }

        diagnostics
    }
}

impl Engine for WaveDromEngine {
    fn name(&self) -> &str {
        "wavedrom"
    }

    fn render(&self, code: &str, _theme: &Theme) -> Result<RenderHint, EngineError> {
        if code.trim().is_empty() {
            return Err(EngineError::RenderError("Empty code".to_string()));
        }

        // Validate JSON before rendering
        if let Err(e) = Self::validate_json(code) {
            return Err(EngineError::RenderError(format!("Invalid JSON: {}", e)));
        }

        // Encode JSON to URL-safe format and build WaveDrom editor URL
        // WaveDrom reads from URL hash
        let encoded = urlencoding::encode(code);
        let url = format!("{}#{}", WAVEDROM_SERVER_URL, encoded);

        // Check URL length to avoid browser limits
        if url.len() > self.max_url_length {
            return Err(EngineError::RenderError(format!(
                "Diagram too large: URL length ({} chars) exceeds maximum allowed ({} chars). \
                 Try simplifying your diagram.",
                url.len(),
                self.max_url_length
            )));
        }

        Ok(RenderHint::ServerURL(url))
    }

    fn supported_diagrams(&self) -> Vec<DiagramType> {
        self.supported_types.clone()
    }

    fn get_themes(&self) -> Vec<Theme> {
        Self::get_wavedrom_themes()
    }

    fn get_templates(&self) -> Vec<Template> {
        Self::get_wavedrom_templates()
    }

    fn validate(&self, code: &str) -> Result<Vec<Diagnostic>, EngineError> {
        let mut diagnostics = Vec::new();

        if code.trim().is_empty() {
            diagnostics.push(Diagnostic {
                line: 1,
                column: 1,
                message: "Empty code".to_string(),
                severity: Severity::Error,
            });
            return Ok(diagnostics);
        }

        // Validate JSON syntax
        if let Err(e) = Self::validate_json(code) {
            diagnostics.push(Diagnostic {
                line: 1,
                column: 1,
                message: format!("Invalid JSON: {}", e),
                severity: Severity::Error,
            });
            return Ok(diagnostics);
        }

        // Validate WaveDrom structure
        let structure_diagnostics = Self::validate_structure(code);
        diagnostics.extend(structure_diagnostics);

        Ok(diagnostics)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_wavedrom_engine_name() {
        let engine = WaveDromEngine::new();
        assert_eq!(engine.name(), "wavedrom");
    }

    #[test]
    fn test_wavedrom_render_empty_code() {
        let engine = WaveDromEngine::new();
        let theme = Theme::default();
        let result = engine.render("", &theme);
        assert!(result.is_err());
    }

    #[test]
    fn test_wavedrom_render_invalid_json() {
        let engine = WaveDromEngine::new();
        let theme = Theme::default();
        let result = engine.render("not valid json", &theme);
        assert!(result.is_err());
    }

    #[test]
    fn test_wavedrom_render_valid_code() {
        let engine = WaveDromEngine::new();
        let theme = Theme::default();
        let code = r#"{"signal": [{"name": "clk", "wave": "p....."}]}"#;
        let result = engine.render(code, &theme);
        assert!(result.is_ok());
        if let Ok(RenderHint::ServerURL(url)) = result {
            assert!(url.contains("wavedrom.com"));
        }
    }

    #[test]
    fn test_wavedrom_themes() {
        let engine = WaveDromEngine::new();
        let themes = engine.get_themes();
        assert!(!themes.is_empty());
        assert!(themes.iter().any(|t| t.id == "wavedrom/default"));
    }

    #[test]
    fn test_wavedrom_templates() {
        let engine = WaveDromEngine::new();
        let templates = engine.get_templates();
        assert!(!templates.is_empty());
        assert!(templates.iter().any(|t| t.id == "wavedrom/basic_signal"));
    }

    #[test]
    fn test_wavedrom_render_url_too_long() {
        let engine = WaveDromEngine::new();
        let theme = Theme::default();
        // Create a very large JSON that will exceed URL length limit
        // Use valid JSON without trailing commas
        let signals: String = (0..500)
            .map(|i| format!(r#"{{"name":"s{}","wave":"p....."}}"#, i))
            .collect::<Vec<_>>()
            .join(",");
        let code = format!(r#"{{"signal":[{}]}}"#, signals);
        let result = engine.render(&code, &theme);
        assert!(result.is_err());
        let err_str = result.unwrap_err().to_string();
        assert!(
            err_str.contains("too large") || err_str.contains("exceeds maximum"),
            "Error should indicate diagram is too large: {}",
            err_str
        );
    }

    #[test]
    fn test_wavedrom_render_url_at_boundary() {
        // Test with a custom limit to verify boundary behavior
        let custom_limit = 1500;
        let engine = WaveDromEngine::with_url_limit(custom_limit);
        let theme = Theme::default();

        // Create valid WaveDrom JSON and test iteratively
        // Start with a size we know works, then increase
        let mut num_entries = 10;
        loop {
            let signals: String = (0..num_entries)
                .map(|i| format!(r#"{{"name":"s{}","wave":"p"}}"#, i))
                .collect::<Vec<_>>()
                .join(",");
            let code = format!(r#"{{"signal":[{}]}}"#, signals);
            let result = engine.render(&code, &theme);

            if result.is_err() {
                // Found the boundary - previous num_entries was OK, current is too large
                assert!(
                    result.unwrap_err().to_string().contains("too large"),
                    "Should fail with URL too large error"
                );
                break;
            }

            // Check if we've hit the limit
            if num_entries >= 100 {
                // Safety limit - shouldn't need this many for 1500 chars
                panic!("Could not reach URL limit with {} entries", num_entries);
            }
            num_entries += 1;
        }

        // Verify the previous size works
        let signals_ok: String = (0..num_entries - 1)
            .map(|i| format!(r#"{{"name":"s{}","wave":"p"}}"#, i))
            .collect::<Vec<_>>()
            .join(",");
        let code_ok = format!(r#"{{"signal":[{}]}}"#, signals_ok);
        let result_ok = engine.render(&code_ok, &theme);
        assert!(result_ok.is_ok(), "URL just under limit should be allowed");
    }

    #[test]
    fn test_wavedrom_with_custom_url_limit() {
        // Use a larger custom limit to ensure small diagrams work
        let custom_limit = 3000;
        let engine = WaveDromEngine::with_url_limit(custom_limit);
        let theme = Theme::default();

        // Create a small diagram (~500 chars when encoded)
        let code = r#"{"signal":[{"name":"clk","wave":"p....."},{"name":"data","wave":"x.345x","data":["D0","D1","D2"]}]}"#;

        // Should succeed with custom limit
        let result = engine.render(&code, &theme);
        assert!(
            result.is_ok(),
            "Should succeed with custom limit of {}: {:?}",
            custom_limit,
            result
        );

        // Verify the URL is actually generated
        if let Ok(RenderHint::ServerURL(url)) = result {
            assert!(url.contains("wavedrom.com"));
            assert!(
                url.len() <= custom_limit,
                "URL length {} exceeds limit {}",
                url.len(),
                custom_limit
            );
        }
    }

    #[test]
    #[should_panic(expected = "max_url_length must be at least 1000")]
    fn test_wavedrom_url_limit_too_small() {
        WaveDromEngine::with_url_limit(500);
    }

    #[test]
    fn test_wavedrom_validate_valid() {
        let engine = WaveDromEngine::new();
        let code = r#"{"signal": [{"name": "clk", "wave": "p....."}]}"#;
        let result = engine.validate(code);
        assert!(result.is_ok());
        let diagnostics = result.unwrap();
        assert!(diagnostics.iter().all(|d| d.severity != Severity::Error));
    }

    #[test]
    fn test_wavedrom_validate_empty() {
        let engine = WaveDromEngine::new();
        let code = "";
        let result = engine.validate(code);
        assert!(result.is_ok());
        let diagnostics = result.unwrap();
        assert!(diagnostics.iter().any(|d| d.severity == Severity::Error));
    }

    #[test]
    fn test_wavedrom_validate_malformed_json() {
        let engine = WaveDromEngine::new();
        let code = r#"{"signal": [{"name": "clk""#;
        let result = engine.validate(code);
        assert!(result.is_ok());
        let diagnostics = result.unwrap();
        assert!(diagnostics.iter().any(|d| d.severity == Severity::Error));
    }

    #[test]
    fn test_supported_diagrams() {
        let engine = WaveDromEngine::new();
        let diagrams = engine.supported_diagrams();
        assert!(diagrams.contains(&DiagramType::WaveDrom));
    }

    #[test]
    fn test_wavedrom_validate_missing_signal() {
        let engine = WaveDromEngine::new();
        let code = r#"{"other": "value"}"#;
        let result = engine.validate(code);
        assert!(result.is_ok());
        let diagnostics = result.unwrap();
        assert!(diagnostics
            .iter()
            .any(|d| d.message.contains("signal") && d.severity == Severity::Warning));
    }
}

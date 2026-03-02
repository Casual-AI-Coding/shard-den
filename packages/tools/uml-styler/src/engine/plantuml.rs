//! PlantUML Engine - 服务器渲染引擎
//!
//! 使用 PlantUML 服务器 API 进行渲染，返回 `ServerURL`

use crate::engine::interface::{DiagramType, Engine, RenderHint};
use crate::error::{Diagnostic, EngineError, Severity};
use crate::templates::Template;
use crate::theme::{Theme, ThemeCategory, ThemeTuning};
use std::fmt::Debug;

/// PlantUML 服务器基础 URL
const PLANTUML_SERVER: &str = "https://www.plantuml.com/plantuml/svg";

/// PlantUML 编码字符集
const PLANTUML_CHARSET: &[u8] = b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";

/// PlantUML 渲染引擎
#[derive(Debug)]
pub struct PlantUmlEngine {
    supported_types: Vec<DiagramType>,
}

impl Default for PlantUmlEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl PlantUmlEngine {
    pub fn new() -> Self {
        Self {
            supported_types: vec![
                DiagramType::Sequence,
                DiagramType::Flowchart,
                DiagramType::Class,
                DiagramType::State,
                DiagramType::Component,
                DiagramType::UseCase,
                DiagramType::Deployment,
                DiagramType::ErDiagram,
                DiagramType::Mindmap,
                DiagramType::Gantt,
                DiagramType::Activity,
            ],
        }
    }

    fn get_plantuml_themes() -> Vec<Theme> {
        vec![
            Theme {
                id: "plantuml/cerulean".to_string(),
                name: "Cerulean".to_string(),
                category: ThemeCategory::PlantUMLSpecific,
                tuning: ThemeTuning {
                    primary_color: Some("#033C73".to_string()),
                    background_color: Some("#FFFFFF".to_string()),
                    font_family: None,
                    font_size: None,
                    line_width: None,
                    text_color: None,
                },
            },
            Theme {
                id: "plantuml/sketchy".to_string(),
                name: "Sketchy".to_string(),
                category: ThemeCategory::PlantUMLSpecific,
                tuning: ThemeTuning {
                    primary_color: Some("#333333".to_string()),
                    background_color: Some("#FEFEFE".to_string()),
                    font_family: None,
                    font_size: None,
                    line_width: None,
                    text_color: None,
                },
            },
            Theme {
                id: "plantuml/toy".to_string(),
                name: "Toy".to_string(),
                category: ThemeCategory::PlantUMLSpecific,
                tuning: ThemeTuning {
                    primary_color: Some("#E0E0E0".to_string()),
                    background_color: Some("#FFFFFF".to_string()),
                    font_family: None,
                    font_size: None,
                    line_width: None,
                    text_color: None,
                },
            },
            Theme {
                id: "plantuml/vibrant".to_string(),
                name: "Vibrant".to_string(),
                category: ThemeCategory::PlantUMLSpecific,
                tuning: ThemeTuning {
                    primary_color: Some("#1A1A1A".to_string()),
                    background_color: Some("#FFFFFF".to_string()),
                    font_family: None,
                    font_size: None,
                    line_width: None,
                    text_color: None,
                },
            },
        ]
    }

    fn get_plantuml_templates() -> Vec<Template> {
        vec![
            Template::new(
                "plantuml/sequence",
                "Sequence Diagram",
                r#"@startuml
actor Alice
actor Bob
Alice -> Bob: Hello!
Bob --> Alice: Hi!
@enduml"#,
                "Basic sequence diagram template",
                DiagramType::Sequence,
            ),
            Template::new(
                "plantuml/class",
                "Class Diagram",
                r#"@startuml
class Animal {
    +name: String
    +age: int
}
class Dog extends Animal {
    +breed: String
}
@enduml"#,
                "Basic class diagram template",
                DiagramType::Class,
            ),
            Template::new(
                "plantuml/flowchart",
                "Activity Diagram",
                r#"@startuml
start
:Initialize;
if (Condition?) then (yes)
    :Action A;
else (no)
    :Action B;
endif
:Finalize;
stop
@enduml"#,
                "Basic activity diagram template",
                DiagramType::Activity,
            ),
        ]
    }

    fn encode_plantuml(code: &str) -> Result<String, EngineError> {
        use std::io::Write;

        let mut encoder =
            flate2::write::DeflateEncoder::new(Vec::new(), flate2::Compression::default());
        encoder
            .write_all(code.as_bytes())
            .map_err(|e| EngineError::RenderError(format!("Compression failed: {}", e)))?;
        let compressed = encoder
            .finish()
            .map_err(|e| EngineError::RenderError(format!("Compression finish failed: {}", e)))?;

        let encoded = Self::plantuml_base64_encode(&compressed);

        Ok(encoded)
    }

    fn plantuml_base64_encode(data: &[u8]) -> String {
        let mut result = String::new();
        let mut i = 0;

        while i < data.len() {
            let c1: u32 = data[i] as u32;
            let c2: u32;
            let c3: u32;

            i += 1;

            if i < data.len() {
                c2 = data[i] as u32;
                i += 1;
            } else {
                c2 = 0;
            }

            if i < data.len() {
                c3 = data[i] as u32;
                i += 1;
            } else {
                c3 = 0;
            }

            result.push(PLANTUML_CHARSET[((c1 >> 2) & 0x3F) as usize] as char);
            result.push(PLANTUML_CHARSET[(((c1 << 4) | (c2 >> 4)) & 0x3F) as usize] as char);

            if i < data.len() + 1 {
                result.push(PLANTUML_CHARSET[(((c2 << 2) | (c3 >> 6)) & 0x3F) as usize] as char);
            }

            if i < data.len() {
                result.push(PLANTUML_CHARSET[(c3 & 0x3F) as usize] as char);
            }
        }

        result
    }

    fn apply_theme(code: &str, theme: &Theme) -> String {
        let theme_directive = match theme.id.as_str() {
            "plantuml/cerulean" => "!theme cerulean\n",
            "plantuml/sketchy" => "!theme sketchy\n",
            "plantuml/toy" => "!theme toy\n",
            "plantuml/vibrant" => "!theme vibrant\n",
            _ => "",
        };

        let mut skinparams = String::new();
        if let Some(color) = &theme.tuning.primary_color {
            skinparams.push_str(&format!("skinparam backgroundColor {}\n", color));
        }
        if let Some(font) = &theme.tuning.font_family {
            skinparams.push_str(&format!("skinparam defaultFontName {}\n", font));
        }
        if let Some(size) = theme.tuning.font_size {
            skinparams.push_str(&format!("skinparam defaultFontSize {}\n", size));
        }

        if code.contains("@startuml\n") {
            code.replace(
                "@startuml\n",
                &format!("@startuml\n{}{}", theme_directive, skinparams),
            )
        } else if code.contains("@startuml ") {
            code.replace(
                "@startuml ",
                &format!("@startuml\n{}{}", theme_directive, skinparams),
            )
        } else {
            format!(
                "@startuml\n{}{}{}\n@enduml",
                theme_directive, skinparams, code
            )
        }
    }

    fn detect_diagram_type(code: &str) -> Option<DiagramType> {
        let code_lower = code.to_lowercase();

        if code_lower.contains("sequencediagram") || code_lower.contains("@startuml\nactor") {
            Some(DiagramType::Sequence)
        } else if code_lower.contains("classdiagram") || code_lower.contains("class ") {
            Some(DiagramType::Class)
        } else if code_lower.contains("statediagram") || code_lower.contains("state ") {
            Some(DiagramType::State)
        } else if code_lower.contains("componentdiagram") || code_lower.contains("component ") {
            Some(DiagramType::Component)
        } else if code_lower.contains("usecase") {
            Some(DiagramType::UseCase)
        } else if code_lower.contains("deployment") {
            Some(DiagramType::Deployment)
        } else if code_lower.contains("entity") || code_lower.contains("erd") {
            Some(DiagramType::ErDiagram)
        } else if code_lower.contains("mindmap") {
            Some(DiagramType::Mindmap)
        } else if code_lower.contains("gantt") {
            Some(DiagramType::Gantt)
        } else if code_lower.contains("activity") || code_lower.contains("start\n") {
            Some(DiagramType::Activity)
        } else {
            Some(DiagramType::Flowchart)
        }
    }
}

impl Engine for PlantUmlEngine {
    fn name(&self) -> &str {
        "plantuml"
    }

    fn render(&self, code: &str, theme: &Theme) -> Result<RenderHint, EngineError> {
        if code.trim().is_empty() {
            return Err(EngineError::RenderError("Empty code".to_string()));
        }

        let themed_code = Self::apply_theme(code, theme);
        let encoded = Self::encode_plantuml(&themed_code)?;
        let url = format!("{}/{}", PLANTUML_SERVER, encoded);

        Ok(RenderHint::ServerURL(url))
    }

    fn supported_diagrams(&self) -> Vec<DiagramType> {
        self.supported_types.clone()
    }

    fn get_themes(&self) -> Vec<Theme> {
        Self::get_plantuml_themes()
    }

    fn get_templates(&self) -> Vec<Template> {
        Self::get_plantuml_templates()
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

        let has_start = code.contains("@startuml");
        let has_end = code.contains("@enduml");

        if !has_start {
            diagnostics.push(Diagnostic {
                line: 1,
                column: 1,
                message: "Missing @startuml directive".to_string(),
                severity: Severity::Warning,
            });
        }

        if !has_end {
            diagnostics.push(Diagnostic {
                line: code.lines().count(),
                column: 1,
                message: "Missing @enduml directive".to_string(),
                severity: Severity::Warning,
            });
        }

        if let Some(diagram_type) = Self::detect_diagram_type(code) {
            if !self.supported_types.contains(&diagram_type) {
                diagnostics.push(Diagnostic {
                    line: 1,
                    column: 1,
                    message: format!("Unsupported diagram type: {:?}", diagram_type),
                    severity: Severity::Warning,
                });
            }
        }

        Ok(diagnostics)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plantuml_engine_new() {
        let engine = PlantUmlEngine::new();
        assert_eq!(engine.name(), "plantuml");
        assert!(!engine.supported_diagrams().is_empty());
    }

    #[test]
    fn test_render_returns_server_url() {
        let engine = PlantUmlEngine::new();
        let theme = Theme::default();
        let code = "@startuml\nA --> B\n@enduml";
        let result = engine.render(code, &theme);
        assert!(result.is_ok());
        if let RenderHint::ServerURL(url) = result.unwrap() {
            assert!(url.starts_with("https://www.plantuml.com/plantuml/svg/"));
        } else {
            panic!("Expected ServerURL");
        }
    }

    #[test]
    fn test_render_empty_code() {
        let engine = PlantUmlEngine::new();
        let theme = Theme::default();
        let result = engine.render("", &theme);
        assert!(result.is_err());
    }

    #[test]
    fn test_get_themes() {
        let engine = PlantUmlEngine::new();
        let themes = engine.get_themes();
        assert_eq!(themes.len(), 4);
        assert!(themes.iter().any(|t| t.id == "plantuml/cerulean"));
    }

    #[test]
    fn test_get_templates() {
        let engine = PlantUmlEngine::new();
        let templates = engine.get_templates();
        assert_eq!(templates.len(), 3);
    }

    #[test]
    fn test_validate_valid_code() {
        let engine = PlantUmlEngine::new();
        let code = "@startuml\nA --> B\n@enduml";
        let result = engine.validate(code);
        assert!(result.is_ok());
        let diagnostics = result.unwrap();
        assert!(diagnostics.is_empty());
    }

    #[test]
    fn test_validate_empty_code() {
        let engine = PlantUmlEngine::new();
        let result = engine.validate("");
        assert!(result.is_ok());
        let diagnostics = result.unwrap();
        assert!(!diagnostics.is_empty());
    }

    #[test]
    fn test_validate_missing_directives() {
        let engine = PlantUmlEngine::new();
        let code = "A --> B";
        let result = engine.validate(code);
        assert!(result.is_ok());
        let diagnostics = result.unwrap();
        assert!(diagnostics.iter().any(|d| d.message.contains("@startuml")));
        assert!(diagnostics.iter().any(|d| d.message.contains("@enduml")));
    }

    #[test]
    fn test_detect_diagram_type() {
        assert!(matches!(
            PlantUmlEngine::detect_diagram_type("@startuml\nactor A\n@enduml"),
            Some(DiagramType::Sequence)
        ));
        assert!(matches!(
            PlantUmlEngine::detect_diagram_type("@startuml\nclass A\n@enduml"),
            Some(DiagramType::Class)
        ));
        assert!(matches!(
            PlantUmlEngine::detect_diagram_type("@startuml\nstart\n@enduml"),
            Some(DiagramType::Activity)
        ));
    }

    #[test]
    fn test_apply_theme() {
        let theme = Theme {
            id: "plantuml/cerulean".to_string(),
            name: "Cerulean".to_string(),
            category: ThemeCategory::PlantUMLSpecific,
            tuning: ThemeTuning::default(),
        };
        let code = "@startuml\nA --> B\n@enduml";
        let result = PlantUmlEngine::apply_theme(code, &theme);
        assert!(result.contains("!theme cerulean"));
    }

    #[test]
    fn test_encode_plantuml() {
        let code = "@startuml\nA --> B\n@enduml";
        let result = PlantUmlEngine::encode_plantuml(code);
        assert!(result.is_ok());
        let encoded = result.unwrap();
        assert!(!encoded.is_empty());
        assert!(encoded
            .chars()
            .all(|c| PLANTUML_CHARSET.contains(&(c as u8))));
    }
}

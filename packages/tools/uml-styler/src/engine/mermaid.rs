//! Mermaid 渲染引擎
//!
//! 返回 `FrontendJS` 标识，由前端使用 mermaid.js 渲染

use crate::engine::{DiagramType, Engine, RenderHint};
use crate::error::{Diagnostic, EngineError, Severity};
use crate::templates::Template;
use crate::theme::{Theme, ThemeCategory, ThemeTuning};

/// Mermaid 引擎
#[derive(Debug)]
pub struct MermaidEngine {
    /// 支持的图表类型
    supported_types: Vec<DiagramType>,
}

impl Default for MermaidEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl MermaidEngine {
    /// 创建新的 Mermaid 引擎实例
    pub fn new() -> Self {
        Self {
            supported_types: vec![
                DiagramType::Sequence,
                DiagramType::Flowchart,
                DiagramType::Class,
                DiagramType::State,
                DiagramType::ErDiagram,
                DiagramType::Mindmap,
                DiagramType::Gantt,
                DiagramType::Activity,
            ],
        }
    }

    /// 获取 Mermaid 官方主题列表
    fn get_mermaid_themes(&self) -> Vec<Theme> {
        vec![
            Theme {
                id: "mermaid/default".to_string(),
                name: "Default".to_string(),
                category: ThemeCategory::MermaidSpecific,
                tuning: ThemeTuning::default(),
            },
            Theme {
                id: "mermaid/dark".to_string(),
                name: "Dark".to_string(),
                category: ThemeCategory::MermaidSpecific,
                tuning: ThemeTuning::default(),
            },
            Theme {
                id: "mermaid/forest".to_string(),
                name: "Forest".to_string(),
                category: ThemeCategory::MermaidSpecific,
                tuning: ThemeTuning::default(),
            },
            Theme {
                id: "mermaid/neutral".to_string(),
                name: "Neutral".to_string(),
                category: ThemeCategory::MermaidSpecific,
                tuning: ThemeTuning::default(),
            },
        ]
    }

    /// 获取 Mermaid 内置模板
    fn get_mermaid_templates(&self) -> Vec<Template> {
        vec![
            Template::new(
                "mermaid/sequence",
                "Sequence Diagram",
                r#"sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello!
    B-->>A: Hi!"#,
                "Basic sequence diagram",
                DiagramType::Sequence,
            ),
            Template::new(
                "mermaid/flowchart",
                "Flowchart",
                r#"flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E"#,
                "Basic flowchart",
                DiagramType::Flowchart,
            ),
            Template::new(
                "mermaid/class",
                "Class Diagram",
                r#"classDiagram
    class Animal {
        +name: String
        +makeSound()
    }
    class Dog {
        +breed: String
        +bark()
    }
    Animal <|-- Dog"#,
                "Basic class diagram",
                DiagramType::Class,
            ),
        ]
    }

    /// 简单的 Mermaid 语法检测

    /// 简单的 Mermaid 语法检测
    fn detect_diagram_type(&self, code: &str) -> Option<DiagramType> {
        let code_lower = code.to_lowercase();
        let trimmed = code_lower.trim();

        if trimmed.starts_with("sequencediagram") || trimmed.starts_with("sequence diagram") {
            return Some(DiagramType::Sequence);
        }
        if trimmed.starts_with("flowchart") || trimmed.starts_with("graph") {
            return Some(DiagramType::Flowchart);
        }
        if trimmed.starts_with("classdiagram") || trimmed.starts_with("class diagram") {
            return Some(DiagramType::Class);
        }
        if trimmed.starts_with("statediagram") || trimmed.starts_with("state diagram") {
            return Some(DiagramType::State);
        }
        if trimmed.starts_with("erdiagram") || trimmed.starts_with("er diagram") {
            return Some(DiagramType::ErDiagram);
        }
        if trimmed.starts_with("mindmap") {
            return Some(DiagramType::Mindmap);
        }
        if trimmed.starts_with("gantt") {
            return Some(DiagramType::Gantt);
        }
        if trimmed.starts_with("journey") {
            return Some(DiagramType::Activity);
        }

        None
    }
}

impl Engine for MermaidEngine {
    fn name(&self) -> &str {
        "mermaid"
    }

    fn render(&self, _code: &str, _theme: &Theme) -> Result<RenderHint, EngineError> {
        // Mermaid 返回 FrontendJS，由前端 mermaid.js 渲染
        Ok(RenderHint::FrontendJS)
    }

    fn supported_diagrams(&self) -> Vec<DiagramType> {
        self.supported_types.clone()
    }

    fn get_themes(&self) -> Vec<Theme> {
        self.get_mermaid_themes()
    }

    fn get_templates(&self) -> Vec<Template> {
        self.get_mermaid_templates()
    }

    fn validate(&self, code: &str) -> Result<Vec<Diagnostic>, EngineError> {
        let mut diagnostics = Vec::new();

        // 检查是否为空
        if code.trim().is_empty() {
            diagnostics.push(Diagnostic {
                line: 1,
                column: 1,
                message: "Empty diagram code".to_string(),
                severity: Severity::Error,
            });
            return Ok(diagnostics);
        }

        // 检测图表类型
        if self.detect_diagram_type(code).is_none() {
            diagnostics.push(Diagnostic {
                line: 1,
                column: 1,
                message: "Unknown diagram type. Supported: sequenceDiagram, flowchart, classDiagram, stateDiagram, erDiagram, mindmap, gantt".to_string(),
                severity: Severity::Warning,
            });
        }

        Ok(diagnostics)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mermaid_engine_name() {
        let engine = MermaidEngine::new();
        assert_eq!(engine.name(), "mermaid");
    }

    #[test]
    fn test_mermaid_engine_render() {
        let engine = MermaidEngine::new();
        let theme = Theme::default();
        let result = engine.render("graph TD\nA-->B", &theme).unwrap();
        assert!(matches!(result, RenderHint::FrontendJS));
    }

    #[test]
    fn test_mermaid_engine_supported_diagrams() {
        let engine = MermaidEngine::new();
        let diagrams = engine.supported_diagrams();
        assert!(diagrams.contains(&DiagramType::Sequence));
        assert!(diagrams.contains(&DiagramType::Flowchart));
        assert!(diagrams.contains(&DiagramType::Class));
    }

    #[test]
    fn test_mermaid_engine_themes() {
        let engine = MermaidEngine::new();
        let themes = engine.get_themes();
        assert!(themes.len() >= 4);
    }

    #[test]
    fn test_mermaid_engine_templates() {
        let engine = MermaidEngine::new();
        let templates = engine.get_templates();
        assert!(templates.len() >= 3);
    }

    #[test]
    fn test_mermaid_validate_empty() {
        let engine = MermaidEngine::new();
        let diagnostics = engine.validate("").unwrap();
        assert!(!diagnostics.is_empty());
        assert_eq!(diagnostics[0].severity, Severity::Error);
    }

    #[test]
    fn test_mermaid_detect_sequence() {
        let engine = MermaidEngine::new();
        let diag_type = engine.detect_diagram_type("sequenceDiagram\nA->>B");
        assert_eq!(diag_type, Some(DiagramType::Sequence));
    }

    #[test]
    fn test_mermaid_detect_flowchart() {
        let engine = MermaidEngine::new();
        let diag_type = engine.detect_diagram_type("flowchart TD\nA-->B");
        assert_eq!(diag_type, Some(DiagramType::Flowchart));
    }
}

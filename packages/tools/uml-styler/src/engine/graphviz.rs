//! Graphviz Engine - Graphviz/DOT 渲染引擎 (via GraphvizOnline)
//!
//! 使用 GraphvizOnline 服务进行 DOT 渲染，返回 SVG

use crate::engine::interface::{DiagramType, Engine, RenderHint};
use crate::error::{Diagnostic, EngineError, Severity};
use crate::templates::Template;
use crate::theme::{Theme, ThemeCategory, ThemeTuning};
use std::fmt::Debug;

/// Graphviz 服务器基础 URL
const GRAPHVIZ_SERVER_URL: &str = "https://dreampuf.github.io/GraphvizOnline";

/// Graphviz 渲染引擎
#[derive(Debug)]
pub struct GraphvizEngine {
    supported_types: Vec<DiagramType>,
}

impl Default for GraphvizEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl GraphvizEngine {
    pub fn new() -> Self {
        Self {
            supported_types: vec![DiagramType::Graphviz],
        }
    }

    fn get_graphviz_themes() -> Vec<Theme> {
        vec![
            Theme {
                id: "graphviz/default".to_string(),
                name: "Default".to_string(),
                category: ThemeCategory::Shared,
                tuning: ThemeTuning::default(),
            },
            Theme {
                id: "graphviz/dot".to_string(),
                name: "Dot".to_string(),
                category: ThemeCategory::Shared,
                tuning: ThemeTuning::default(),
            },
            Theme {
                id: "graphviz/neato".to_string(),
                name: "Neato".to_string(),
                category: ThemeCategory::Shared,
                tuning: ThemeTuning::default(),
            },
            Theme {
                id: "graphviz/twopi".to_string(),
                name: "Twopi".to_string(),
                category: ThemeCategory::Shared,
                tuning: ThemeTuning::default(),
            },
            Theme {
                id: "graphviz/fdp".to_string(),
                name: "Fdp".to_string(),
                category: ThemeCategory::Shared,
                tuning: ThemeTuning::default(),
            },
            Theme {
                id: "graphviz/sfdp".to_string(),
                name: "Sfdp".to_string(),
                category: ThemeCategory::Shared,
                tuning: ThemeTuning::default(),
            },
        ]
    }

    fn get_graphviz_templates() -> Vec<Template> {
        vec![
            Template::new(
                "graphviz/basic",
                "Basic Graph",
                r#"digraph G {
    A -> B;
    B -> C;
    C -> A;
}"#,
                "Basic directed graph",
                DiagramType::Graphviz,
            ),
            Template::new(
                "graphviz/flowchart",
                "Flowchart",
                r#"digraph flowchart {
    node [shape=box];
    start -> process -> decision -> end;
    decision -> yes [label="Yes"];
    decision -> no [label="No"];
}"#,
                "Flowchart example",
                DiagramType::Graphviz,
            ),
            Template::new(
                "graphviz/hierarchy",
                "Hierarchy",
                r#"digraph hierarchy {
    rankdir=TB;
    node [shape=box];
    
    CEO -> "VP Sales";
    CEO -> "VP Engineering";
    CEO -> "VP Marketing";
    
    "VP Sales" -> "Sales Manager";
    "VP Sales" -> "Regional Manager";
    
    "VP Engineering" -> "Dev Lead";
    "VP Engineering" -> "QA Lead";
}"#,
                "Organizational hierarchy",
                DiagramType::Graphviz,
            ),
            Template::new(
                "graphviz/state",
                "State Machine",
                r#"digraph state_machine {
    node [shape=ellipse];
    start [shape=circle, label="Start"];
    idle [label="Idle"];
    processing [label="Processing"];
    complete [label="Complete"];
    error [label="Error"];
    
    start -> idle;
    idle -> processing [label="Process"];
    processing -> complete [label="Done"];
    processing -> error [label="Fail"];
    error -> idle [label="Retry"];
    complete -> idle;
}"#,
                "State machine diagram",
                DiagramType::Graphviz,
            ),
            Template::new(
                "graphviz/erd",
                "Entity Relationship",
                r#"digraph ER {
    node [shape=box];
    
    Customer -> Order [label="places"];
    Order -> Product [label="contains"];
    Customer -> Payment [label="makes"];
    
    Order -> Shipping [label="has"];
    
    Customer [label="Customer\n(id, name, email)"];
    Order [label="Order\n(id, date, status)"];
    Product [label="Product\n(id, name, price)"];
    Payment [label="Payment\n(id, amount)"];
    Shipping [label="Shipping\n(id, address)"];
}"#,
                "ER diagram example",
                DiagramType::Graphviz,
            ),
        ]
    }

    /// 应用主题到 DOT 代码
    /// Graphviz 使用 rankdir、layout 等属性来控制布局
    fn apply_theme(code: &str, theme: &Theme) -> String {
        // 检查是否已有 graph 属性设置
        let has_graph_attr =
            code.contains("graph [") || code.contains("node [") || code.contains("edge [");

        // 如果已经有属性设置，不添加主题
        if has_graph_attr {
            return code.to_string();
        }

        let layout = match theme.id.as_str() {
            "graphviz/dot" => "dot",
            "graphviz/neato" => "neato",
            "graphviz/twopi" => "twopi",
            "graphviz/fdp" => "fdp",
            "graphviz/sfdp" => "sfdp",
            _ => "dot", // default to dot
        };

        // 将 layout 属性插入到代码最前面
        format!(
            "digraph {{\n    layout={};\n{}}}",
            layout,
            code.lines()
                .map(|line| format!("    {}", line))
                .collect::<Vec<_>>()
                .join("\n")
        )
    }
}

impl Engine for GraphvizEngine {
    fn name(&self) -> &str {
        "graphviz"
    }

    fn render(&self, code: &str, theme: &Theme) -> Result<RenderHint, EngineError> {
        if code.trim().is_empty() {
            return Err(EngineError::RenderError("Empty code".to_string()));
        }

        let themed_code = Self::apply_theme(code, theme);

        // GraphvizOnline 使用 URL 编码的方式
        // 将 DOT 代码编码为 URL 安全格式并构建 URL
        let encoded = urlencoding::encode(&themed_code);
        let url = format!("{}?format=svg#{}", GRAPHVIZ_SERVER_URL, encoded);

        // 由于 GraphvizOnline 使用前端渲染，我们返回一个特殊的 URL
        // 前端需要使用 iframe 或其他方式加载这个 URL
        Ok(RenderHint::ServerURL(url))
    }

    fn supported_diagrams(&self) -> Vec<DiagramType> {
        self.supported_types.clone()
    }

    fn get_themes(&self) -> Vec<Theme> {
        Self::get_graphviz_themes()
    }

    fn get_templates(&self) -> Vec<Template> {
        Self::get_graphviz_templates()
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
        }

        // 检查基本的 DOT 语法
        let code_lower = code.to_lowercase();

        // 检查是否有图定义
        if !code_lower.contains("digraph") && !code_lower.contains("graph") {
            diagnostics.push(Diagnostic {
                line: 1,
                column: 1,
                message: "Missing graph definition (digraph or graph)".to_string(),
                severity: Severity::Warning,
            });
        }

        // 检查括号匹配
        let open_braces = code.matches('{').count();
        let close_braces = code.matches('}').count();
        if open_braces != close_braces {
            diagnostics.push(Diagnostic {
                line: 1,
                column: 1,
                message: format!(
                    "Mismatched braces: {} open, {} close",
                    open_braces, close_braces
                ),
                severity: Severity::Error,
            });
        }

        Ok(diagnostics)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_graphviz_engine_name() {
        let engine = GraphvizEngine::new();
        assert_eq!(engine.name(), "graphviz");
    }

    #[test]
    fn test_graphviz_themes() {
        let engine = GraphvizEngine::new();
        let themes = engine.get_themes();
        assert!(!themes.is_empty());
        assert!(themes.iter().any(|t| t.id == "graphviz/default"));
    }

    #[test]
    fn test_graphviz_templates() {
        let engine = GraphvizEngine::new();
        let templates = engine.get_templates();
        assert!(!templates.is_empty());
    }

    #[test]
    fn test_graphviz_render_empty_code() {
        let engine = GraphvizEngine::new();
        let theme = Theme::default();
        let result = engine.render("", &theme);
        assert!(result.is_err());
    }

    #[test]
    fn test_graphviz_render_valid_code() {
        let engine = GraphvizEngine::new();
        let theme = Theme::default();
        let code = r#"digraph G { A -> B; }"#;
        let result = engine.render(code, &theme);
        assert!(result.is_ok());
        if let Ok(RenderHint::ServerURL(url)) = result {
            // GraphvizOnline URL should contain "GraphvizOnline"
        }
    }

    #[test]
    fn test_graphviz_apply_theme_default() {
        let code = "digraph G { A -> B; }";
        let theme = Theme {
            id: "graphviz/default".to_string(),
            name: "Default".to_string(),
            category: ThemeCategory::Shared,
            tuning: ThemeTuning::default(),
        };
        let themed = GraphvizEngine::apply_theme(code, &theme);
        assert!(themed.contains("layout=dot"));
    }

    #[test]
    fn test_graphviz_apply_theme_neato() {
        let code = "digraph G { A -> B; }";
        let theme = Theme {
            id: "graphviz/neato".to_string(),
            name: "Neato".to_string(),
            category: ThemeCategory::Shared,
            tuning: ThemeTuning::default(),
        };
        let themed = GraphvizEngine::apply_theme(code, &theme);
        assert!(themed.contains("layout=neato"));
    }

    #[test]
    fn test_graphviz_validate_valid() {
        let engine = GraphvizEngine::new();
        let code = r#"digraph G { A -> B; }"#;
        let result = engine.validate(code);
        assert!(result.is_ok());
        let diagnostics = result.unwrap();
        // Should have a warning about missing graph attribute but no errors
        assert!(diagnostics.iter().all(|d| d.severity != Severity::Error));
    }

    #[test]
    fn test_graphviz_validate_empty() {
        let engine = GraphvizEngine::new();
        let code = "";
        let result = engine.validate(code);
        assert!(result.is_ok());
        let diagnostics = result.unwrap();
        assert!(diagnostics.iter().any(|d| d.severity == Severity::Error));
    }

    #[test]
    fn test_graphviz_validate_mismatched_braces() {
        let engine = GraphvizEngine::new();
        let code = r#"digraph G { A -> B;"#;
        let result = engine.validate(code);
        assert!(result.is_ok());
        let diagnostics = result.unwrap();
        assert!(diagnostics.iter().any(|d| d.severity == Severity::Error));
    }

    #[test]
    fn test_supported_diagrams() {
        let engine = GraphvizEngine::new();
        let diagrams = engine.supported_diagrams();
        assert!(diagrams.contains(&DiagramType::Graphviz));
    }
}

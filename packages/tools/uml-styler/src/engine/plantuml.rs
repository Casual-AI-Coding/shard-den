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

    /// PlantUML 特殊 base64 编码
    /// 按照 PlantUML 标准流程：先进行字节翻转（每8字节块内反转），再进行自定义 base64 编码
    fn plantuml_base64_encode(data: &[u8]) -> String {
        // 1. 字节翻转：每 8 字节块内反转
        let mut flipped: Vec<u8> = Vec::with_capacity(data.len());
        for chunk in data.chunks(8) {
            for i in (0..chunk.len()).rev() {
                flipped.push(chunk[i]);
            }
        }

        // 2. 自定义 base64 编码
        let mut result = String::new();
        let data = &flipped;
        let len = data.len();

        let mut i = 0;
        while i < len {
            let c1: u32 = data[i] as u32;
            let c2: u32 = if i + 1 < len { data[i + 1] as u32 } else { 0 };
            let c3: u32 = if i + 2 < len { data[i + 2] as u32 } else { 0 };

            result.push(PLANTUML_CHARSET[((c1 >> 2) & 0x3F) as usize] as char);
            result.push(PLANTUML_CHARSET[(((c1 << 4) | (c2 >> 4)) & 0x3F) as usize] as char);

            // 只有在有足够字节时才添加第3、4个字符
            if i + 1 < len {
                result.push(PLANTUML_CHARSET[(((c2 << 2) | (c3 >> 6)) & 0x3F) as usize] as char);
            }
            if i + 2 < len {
                result.push(PLANTUML_CHARSET[(c3 & 0x3F) as usize] as char);
            }

            i += 3;
        }

        result
    }

    /// 应用主题到 PlantUML 代码
    /// 如果用户代码已包含 !theme 指令，则不覆盖
    fn apply_theme(code: &str, theme: &Theme) -> String {
        // P1 修复：检查是否已有 !theme 指令，如有则不覆盖
        if code.contains("!theme ") {
            return code.to_string();
        }

        let theme_directive = match theme.id.as_str() {
            "plantuml/cerulean" => "!theme cerulean\n",
            "plantuml/sketchy" => "!theme sketchy\n",
            "plantuml/toy" => "!theme toy\n",
            "plantuml/vibrant" => "!theme vibrant\n",
            _ => "",
        };

        // 非 PlantUML 特定主题，只应用 skinparam
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

        // 如果有主题指令或 skinparams，插入到 @startuml 之后
        if !theme_directive.is_empty() || !skinparams.is_empty() {
            if code.contains("@startuml\n") {
                return code.replace(
                    "@startuml\n",
                    &format!("@startuml\n{}{}", theme_directive, skinparams),
                );
            } else if code.contains("@startuml ") {
                return code.replace(
                    "@startuml ",
                    &format!("@startuml\n{}{}", theme_directive, skinparams),
                );
            }
        }

        // 如果没有 @startuml，添加完整的模板
        if !code.contains("@startuml") {
            return format!(
                "@startuml\n{}{}{}\n@enduml",
                theme_directive, skinparams, code
            );
        }

        code.to_string()
    }

    /// P2 修复：检测 PlantUML 图表类型，调整检测顺序避免重叠
    fn detect_diagram_type(code: &str) -> Option<DiagramType> {
        let code_lower = code.to_lowercase();

        // 按优先级检测：先检测更具体的类型，再检测通用类型
        if code_lower.contains("sequencediagram") || code_lower.contains("actor ") {
            return Some(DiagramType::Sequence);
        }
        if code_lower.contains("classdiagram") || code_lower.contains("class ") {
            return Some(DiagramType::Class);
        }
        if code_lower.contains("statediagram") || code_lower.contains("state ") {
            return Some(DiagramType::State);
        }
        if code_lower.contains("componentdiagram") || code_lower.contains("component ") {
            return Some(DiagramType::Component);
        }
        if code_lower.contains("usecase") {
            return Some(DiagramType::UseCase);
        }
        if code_lower.contains("deployment") {
            return Some(DiagramType::Deployment);
        }
        if code_lower.contains("entity") || code_lower.contains("erd") {
            return Some(DiagramType::ErDiagram);
        }
        if code_lower.contains("mindmap") {
            return Some(DiagramType::Mindmap);
        }
        if code_lower.contains("gantt") {
            return Some(DiagramType::Gantt);
        }
        // Activity 必须在 Flowchart 之前检测，因为 Activity 是更具体的类型
        if code_lower.contains("activity")
            || code_lower.contains("start\n")
            || code_lower.contains("stop\n")
        {
            return Some(DiagramType::Activity);
        }
        // Flowchart 应该是最后检测的默认类型
        if code_lower.contains("flowchart")
            || code_lower.contains("->>")
            || code_lower.contains("-->")
            || code_lower.contains("->")
        {
            return Some(DiagramType::Flowchart);
        }

        Some(DiagramType::Flowchart)
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

    // P2 修复：新增边界测试用例

    #[test]
    fn test_encode_plantuml_single_byte() {
        // 测试单字节输入
        let result = PlantUmlEngine::encode_plantuml("A");
        assert!(result.is_ok());
        let encoded = result.unwrap();
        assert!(!encoded.is_empty());
    }

    #[test]
    fn test_encode_plantuml_two_bytes() {
        // 测试 2 字节输入
        let result = PlantUmlEngine::encode_plantuml("AB");
        assert!(result.is_ok());
        let encoded = result.unwrap();
        assert!(!encoded.is_empty());
    }

    #[test]
    fn test_apply_theme_with_existing_theme() {
        // P1 修复：测试已有 !theme 指令时不重复添加
        let theme = Theme {
            id: "plantuml/cerulean".to_string(),
            name: "Cerulean".to_string(),
            category: ThemeCategory::PlantUMLSpecific,
            tuning: ThemeTuning::default(),
        };
        let code = "@startuml\n!theme cerulean\nA --> B\n@enduml";
        let result = PlantUmlEngine::apply_theme(code, &theme);
        // 应该只有 1 个 !theme 指令
        assert_eq!(result.matches("!theme cerulean").count(), 1);
    }

    #[test]
    fn test_apply_theme_invalid_theme_id() {
        // P2 修复：测试无效主题 ID 的处理
        let theme = Theme {
            id: "invalid/theme".to_string(),
            name: "Invalid".to_string(),
            category: ThemeCategory::Shared,
            tuning: ThemeTuning::default(),
        };
        let code = "@startuml\nA --> B\n@enduml";
        let result = PlantUmlEngine::apply_theme(code, &theme);
        // 应该正常返回，不崩溃
        assert!(result.contains("@startuml"));
    }

    #[test]
    fn test_detect_diagram_type_activity_before_flowchart() {
        // P2 修复：确保 Activity 在 Flowchart 之前被检测到
        // 包含 start 的代码应该被识别为 Activity，不是 Flowchart
        let code = "@startuml\nstart\n:Action;\nstop\n@enduml";
        let result = PlantUmlEngine::detect_diagram_type(code);
        assert_eq!(result, Some(DiagramType::Activity));
    }

    #[test]
    fn test_detect_diagram_type_flowchart() {
        // 测试普通 Flowchart
        let code = "@startuml\nA --> B\n@enduml";
        let result = PlantUmlEngine::detect_diagram_type(code);
        assert_eq!(result, Some(DiagramType::Flowchart));
    }

    #[test]
    fn test_detect_diagram_type_mindmap() {
        let code = "@startuml\nmindmap\nroot((Main))\n@enduml";
        let result = PlantUmlEngine::detect_diagram_type(code);
        assert_eq!(result, Some(DiagramType::Mindmap));
    }

    #[test]
    fn test_detect_diagram_type_gantt() {
        let code = "@startuml\ngantt\ntitle Test\n@enduml";
        let result = PlantUmlEngine::detect_diagram_type(code);
        assert_eq!(result, Some(DiagramType::Gantt));
    }

    #[test]
    fn test_apply_theme_with_skinparams() {
        // 测试带 skinparam 的主题应用
        let theme = Theme {
            id: "shared/custom".to_string(),
            name: "Custom".to_string(),
            category: ThemeCategory::Shared,
            tuning: ThemeTuning {
                primary_color: Some("#FF0000".to_string()),
                background_color: Some("#FFFFFF".to_string()),
                font_family: Some("Arial".to_string()),
                font_size: Some(14),
                line_width: None,
                text_color: None,
            },
        };
        let code = "@startuml\nA --> B\n@enduml";
        let result = PlantUmlEngine::apply_theme(code, &theme);
        assert!(result.contains("skinparam backgroundColor #FF0000"));
        assert!(result.contains("skinparam defaultFontName Arial"));
        assert!(result.contains("skinparam defaultFontSize 14"));
    }
}

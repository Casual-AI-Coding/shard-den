//! D2 Engine - D2 渲染引擎 (via Kroki)
//!
//! 使用 Kroki 服务进行 D2 渲染，返回 `ServerURL`

use crate::engine::interface::{DiagramType, Engine, RenderHint};
use crate::error::{Diagnostic, EngineError, Severity};
use crate::templates::Template;
use crate::theme::{Theme, ThemeCategory, ThemeTuning};
use base64::{engine::general_purpose, Engine as _};
use flate2::write::ZlibEncoder;
use flate2::Compression;
use std::fmt::Debug;
use std::io::Write;

/// Kroki 服务基础 URL (D2 SVG)
const KROKI_D2_SERVER: &str = "https://kroki.io/d2/svg";

/// D2 渲染引擎
#[derive(Debug)]
pub struct D2Engine {
    supported_types: Vec<DiagramType>,
}

impl Default for D2Engine {
    fn default() -> Self {
        Self::new()
    }
}

impl D2Engine {
    pub fn new() -> Self {
        Self {
            supported_types: vec![DiagramType::D2],
        }
    }

    fn get_d2_themes() -> Vec<Theme> {
        vec![
            Theme {
                id: "d2/neutral".to_string(),
                name: "Neutral".to_string(),
                category: ThemeCategory::Shared, // Maps to ID 100
                tuning: ThemeTuning::default(),
            },
            Theme {
                id: "d2/dark".to_string(),
                name: "Dark".to_string(),
                category: ThemeCategory::Shared, // Maps to ID 200
                tuning: ThemeTuning::default(),
            },
            Theme {
                id: "d2/cool".to_string(),
                name: "Cool".to_string(),
                category: ThemeCategory::Shared, // Maps to ID 300
                tuning: ThemeTuning::default(),
            },
        ]
    }

    fn get_d2_templates() -> Vec<Template> {
        vec![
            Template::new(
                "d2/basic",
                "Basic D2",
                r#"x -> y: hello world"#,
                "Basic connection",
                DiagramType::D2,
            ),
            Template::new(
                "d2/class",
                "Class Diagram",
                r#"shape: class
# key: value
field: string
method: (a string) string"#,
                "Class shape example",
                DiagramType::D2,
            ),
            Template::new(
                "d2/sql",
                "SQL Table",
                r#"users: {
  shape: sql_table
  id: int {constraint: primary_key}
  name: varchar(255)
  created_at: timestamp
}"#,
                "SQL table example",
                DiagramType::D2,
            ),
        ]
    }

    fn encode_d2(code: &str) -> Result<String, EngineError> {
        let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
        encoder
            .write_all(code.as_bytes())
            .map_err(|e| EngineError::RenderError(format!("Compression failed: {}", e)))?;
        let compressed = encoder
            .finish()
            .map_err(|e| EngineError::RenderError(format!("Compression finish failed: {}", e)))?;

        Ok(general_purpose::URL_SAFE.encode(compressed))
    }

    /// 应用主题到 D2 代码
    /// D2 使用 theme 关键字，如 `x -> y; theme: 100` (GLOBAL)
    /// 或者在文件头部添加 `direction: right; theme: 200`
    fn apply_theme(code: &str, theme: &Theme) -> String {
        // 检查是否已有 theme 设置
        if code.contains("theme:") {
            return code.to_string();
        }

        let theme_id = match theme.id.as_str() {
            "shared/default" | "d2/neutral" => "100", // Neutral Default
            "shared/dark" | "d2/dark" => "200",       // Dark
            "d2/cool" => "300",                       // Cool
            "shared/business" => "4", // 4: Grape (closest to business maybe? or just stick to 0)
            // 0: Classic
            _ => "0",
        };

        // 将 theme ID 插入到代码最前面
        // D2 允许在最外层设置 theme
        format!("theme: {}\n{}", theme_id, code)
    }
}

impl Engine for D2Engine {
    fn name(&self) -> &str {
        "d2"
    }

    fn render(&self, code: &str, theme: &Theme) -> Result<RenderHint, EngineError> {
        if code.trim().is_empty() {
            return Err(EngineError::RenderError("Empty code".to_string()));
        }

        let themed_code = Self::apply_theme(code, theme);
        let encoded = Self::encode_d2(&themed_code)?;
        let url = format!("{}/{}", KROKI_D2_SERVER, encoded);

        Ok(RenderHint::ServerURL(url))
    }

    fn supported_diagrams(&self) -> Vec<DiagramType> {
        self.supported_types.clone()
    }

    fn get_themes(&self) -> Vec<Theme> {
        Self::get_d2_themes()
    }

    fn get_templates(&self) -> Vec<Template> {
        Self::get_d2_templates()
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

        // D2 验证较难，除非有 parser。这里只做简单非空检查。

        Ok(diagnostics)
    }
}

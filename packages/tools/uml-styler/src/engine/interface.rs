//! Engine Interface - 引擎核心接口定义

use crate::engine::{
    D2Engine, GraphvizEngine, MermaidEngine, PlantUmlEngine, WaveDromEngine,
};
use crate::error::{Diagnostic, EngineError};
use crate::templates::Template;
use crate::theme::Theme;
use std::collections::HashMap;
use std::fmt::Debug;

/// 图表类型
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "wasm", derive(serde::Serialize, serde::Deserialize))]
pub enum DiagramType {
    Sequence,
    Flowchart,
    Class,
    State,
    Component,
    UseCase,
    Deployment,
    ErDiagram,
    Mindmap,
    Gantt,
    Activity,
    /// D2 Diagram
    D2,
    /// Graphviz/DOT Diagram
    Graphviz,
    /// WaveDrom Digital Timing Diagram
    WaveDrom,
}

/// 渲染提示 - 告诉前端如何渲染
#[derive(Debug, Clone)]
#[cfg_attr(feature = "wasm", derive(serde::Serialize, serde::Deserialize))]
pub enum RenderHint {
    /// 前端 JS 渲染（如 Mermaid）
    FrontendJS,
    /// 服务器渲染 URL（如 PlantUML）
    ServerURL(String),
    /// 未来：WASM 直接渲染
    WasmReady(Vec<u8>),
}

/// 引擎 trait - 所有渲染引擎必须实现此接口
pub trait Engine: Debug + Send + Sync {
    /// 引擎名称
    fn name(&self) -> &str;

    /// 渲染图表 - 返回 RenderHint 让前端决定渲染方式
    fn render(&self, code: &str, theme: &Theme) -> Result<RenderHint, EngineError>;

    /// 获取支持的图表类型
    fn supported_diagrams(&self) -> Vec<DiagramType>;

    /// 获取可用主题列表
    fn get_themes(&self) -> Vec<Theme>;

    /// 获取内置模板列表
    fn get_templates(&self) -> Vec<Template>;

    /// 验证语法
    fn validate(&self, code: &str) -> Result<Vec<Diagnostic>, EngineError>;
}

/// 引擎注册表
#[derive(Debug, Default)]
pub struct EngineRegistry {
    engines: HashMap<String, Box<dyn Engine>>,
}

impl EngineRegistry {
    pub fn new() -> Self {
        let mut registry = Self::default();
        // Register default engines
        registry.register(Box::new(MermaidEngine::new()));
        registry.register(Box::new(PlantUmlEngine::new()));
        registry.register(Box::new(D2Engine::new()));
        registry.register(Box::new(GraphvizEngine::new()));
        registry.register(Box::new(WaveDromEngine::new()));
        registry
    }

    pub fn register(&mut self, engine: Box<dyn Engine>) {
        self.engines.insert(engine.name().to_string(), engine);
    }

    pub fn get_engine(&self, name: &str) -> Option<&dyn Engine> {
        self.engines.get(name).map(|e| e.as_ref())
    }

    pub fn list_engines(&self) -> Vec<&str> {
        self.engines.keys().map(|k| k.as_str()).collect()
    }
}

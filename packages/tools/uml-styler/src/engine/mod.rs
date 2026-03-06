//! 渲染引擎模块

mod d2;
mod graphviz;
mod interface;
mod mermaid;
mod plantuml;
mod wavedrom;

pub use d2::D2Engine;
pub use graphviz::GraphvizEngine;
pub use interface::*;
pub use mermaid::MermaidEngine;
pub use plantuml::PlantUmlEngine;
pub use wavedrom::WaveDromEngine;

#[cfg(feature = "wasm")]
use crate::error::EngineError;

/// 创建引擎实例
pub fn create_engine(engine_type: &str) -> Option<Box<dyn Engine>> {
    match engine_type {
        "mermaid" => Some(Box::new(MermaidEngine::new())),
        "plantuml" => Some(Box::new(PlantUmlEngine::new())),
        "d2" => Some(Box::new(D2Engine::new())),
        "graphviz" => Some(Box::new(GraphvizEngine::new())),
        "wavedrom" => Some(Box::new(WaveDromEngine::new())),
        _ => None,
    }
}

/// 获取所有支持的引擎
pub fn get_all_engines() -> Vec<Box<dyn Engine>> {
    vec![
        Box::new(MermaidEngine::new()),
        Box::new(PlantUmlEngine::new()),
        Box::new(D2Engine::new()),
        Box::new(GraphvizEngine::new()),
        Box::new(WaveDromEngine::new()),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_mermaid_engine() {
        let engine = create_engine("mermaid");
        assert!(engine.is_some());
        assert_eq!(engine.unwrap().name(), "mermaid");
    }

    #[test]
    fn test_create_plantuml_engine() {
        let engine = create_engine("plantuml");
        assert!(engine.is_some());
        assert_eq!(engine.unwrap().name(), "plantuml");
    }

    #[test]
    fn test_create_d2_engine() {
        let engine = create_engine("d2");
        assert!(engine.is_some());
        assert_eq!(engine.unwrap().name(), "d2");
    }

    #[test]
    fn test_create_graphviz_engine() {
        let engine = create_engine("graphviz");
        assert!(engine.is_some());
        assert_eq!(engine.unwrap().name(), "graphviz");
    }

    #[test]
    fn test_create_wavedrom_engine() {
        let engine = create_engine("wavedrom");
        assert!(engine.is_some());
        assert_eq!(engine.unwrap().name(), "wavedrom");
    }

    #[test]
    fn test_create_unknown_engine() {
        let engine = create_engine("unknown");
        assert!(engine.is_none());
    }

    #[test]
    fn test_get_all_engines() {
        let engines = get_all_engines();
        assert_eq!(engines.len(), 5);
    }

    #[test]
    fn test_engine_registry() {
        let registry = EngineRegistry::new();
        assert!(registry.get_engine("mermaid").is_some());
        assert!(registry.get_engine("plantuml").is_some());
        assert!(registry.get_engine("d2").is_some());
        assert!(registry.get_engine("graphviz").is_some());
        assert!(registry.get_engine("wavedrom").is_some());

        let engines = registry.list_engines();
        assert_eq!(engines.len(), 5);
    }
}

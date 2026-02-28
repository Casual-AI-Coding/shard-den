//! Engine Interface 测试

use shard_den_uml_styler::engine::{DiagramType, RenderHint};

#[test]
fn test_diagram_type_equality() {
    assert_eq!(DiagramType::Sequence, DiagramType::Sequence);
    assert_ne!(DiagramType::Sequence, DiagramType::Flowchart);
}

#[test]
fn test_render_hint_variants() {
    let frontend = RenderHint::FrontendJS;
    let server = RenderHint::ServerURL("https://example.com".to_string());
    let wasm = RenderHint::WasmReady(vec![1, 2, 3]);

    match frontend {
        RenderHint::FrontendJS => (),
        _ => panic!("Expected FrontendJS"),
    }

    match server {
        RenderHint::ServerURL(url) => assert_eq!(url, "https://example.com"),
        _ => panic!("Expected ServerURL"),
    }

    match wasm {
        RenderHint::WasmReady(data) => assert_eq!(data, vec![1, 2, 3]),
        _ => panic!("Expected WasmReady"),
    }
}

#[test]
fn test_diagram_type_all_variants() {
    let types = [
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
    ];
    assert_eq!(types.len(), 11);
}

#[test]
fn test_engine_registry_new() {
    let registry = shard_den_uml_styler::engine::EngineRegistry::new();
    assert!(registry.list_engines().is_empty());
}

#[test]
fn test_engine_registry_register() {
    use shard_den_uml_styler::engine::Engine;
    use shard_den_uml_styler::engine::MermaidEngine;
    
    let mut registry = shard_den_uml_styler::engine::EngineRegistry::new();
    let engine = Box::new(MermaidEngine::new());
    registry.register(engine);
    
    let engines = registry.list_engines();
    assert_eq!(engines.len(), 1);
    assert_eq!(engines[0], "mermaid");
}

#[test]
fn test_engine_registry_get_engine() {
    use shard_den_uml_styler::engine::Engine;
    use shard_den_uml_styler::engine::MermaidEngine;
    
    let mut registry = shard_den_uml_styler::engine::EngineRegistry::new();
    let engine = Box::new(MermaidEngine::new());
    registry.register(engine);
    
    let found = registry.get_engine("mermaid");
    assert!(found.is_some());
    assert_eq!(found.unwrap().name(), "mermaid");
    
    let not_found = registry.get_engine("unknown");
    assert!(not_found.is_none());
}

#[test]
fn test_engine_registry_default() {
    let registry = shard_den_uml_styler::engine::EngineRegistry::default();
    assert!(registry.list_engines().is_empty());
}

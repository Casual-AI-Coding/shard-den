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

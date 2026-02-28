//! 模板模块

use std::fmt::Debug;

#[cfg(feature = "wasm")]
use serde::{Deserialize, Serialize};

use crate::engine::DiagramType;

/// 模板
#[derive(Debug, Clone)]
#[cfg_attr(feature = "wasm", derive(Serialize, Deserialize))]
pub struct Template {
    pub id: String,
    pub name: String,
    pub code: String,
    pub description: String,
    pub diagram_type: DiagramType,
}

impl Template {
    pub fn new(
        id: impl Into<String>, name: impl Into<String>, code: impl Into<String>,
        description: impl Into<String>, diagram_type: DiagramType,
    ) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            code: code.into(),
            description: description.into(),
            diagram_type,
        }
    }
}

/// 获取所有 Mermaid 模板
pub fn get_mermaid_templates() -> Vec<Template> {
    vec![
        Template::new(
            "mermaid/sequence",
            "Sequence Diagram",
            r#"sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello!
    B-->>A: Hi!"#,
            "Basic sequence diagram showing message flow",
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
            "Basic flowchart with decision node",
            DiagramType::Flowchart,
        ),
        Template::new(
            "mermaid/class",
            "Class Diagram",
            r#"classDiagram
    class Animal {
        +name: String
        +age: int
        +makeSound(): void
    }
    class Dog {
        +breed: String
        +bark(): void
    }
    Animal <|-- Dog"#,
            "Basic class diagram with inheritance",
            DiagramType::Class,
        ),
        Template::new(
            "mermaid/state",
            "State Diagram",
            r#"stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: Start
    Processing --> Success: Complete
    Processing --> Error: Fail
    Success --> [*]
    Error --> Idle: Retry"#,
            "Basic state diagram with transitions",
            DiagramType::State,
        ),
        Template::new(
            "mermaid/er",
            "ER Diagram",
            r#"erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER {
        string name
        string email
    }
    ORDER {
        int id
        string status
    }"#,
            "Basic entity-relationship diagram",
            DiagramType::ErDiagram,
        ),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_mermaid_templates_count() {
        let templates = get_mermaid_templates();
        assert!(templates.len() >= 5);
    }

    #[test]
    fn test_template_fields() {
        let templates = get_mermaid_templates();
        for template in templates {
            assert!(!template.id.is_empty());
            assert!(!template.name.is_empty());
            assert!(!template.code.is_empty());
            assert!(!template.description.is_empty());
        }
    }

    #[test]
    fn test_sequence_template() {
        let templates = get_mermaid_templates();
        let sequence = templates
            .iter()
            .find(|t| t.id == "mermaid/sequence")
            .unwrap();
        assert_eq!(sequence.name, "Sequence Diagram");
        assert!(sequence.code.contains("sequenceDiagram"));
    }

    #[test]
    fn test_flowchart_template() {
        let templates = get_mermaid_templates();
        let flowchart = templates
            .iter()
            .find(|t| t.id == "mermaid/flowchart")
            .unwrap();
        assert_eq!(flowchart.name, "Flowchart");
        assert!(flowchart.code.contains("flowchart"));
    }
}

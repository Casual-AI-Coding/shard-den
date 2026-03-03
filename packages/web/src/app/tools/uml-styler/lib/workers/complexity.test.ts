import { describe, it, expect } from 'vitest';
import { countNodes, analyzeComplexity, shouldUseWorker } from './complexity';

describe('complexity.ts', () => {
  describe('countNodes', () => {
    it('returns 0 for empty string', () => {
      expect(countNodes('')).toBe(0);
    });

    it('returns 0 for whitespace only', () => {
      expect(countNodes('   \n\t  ')).toBe(0);
    });

    it('counts flowchart nodes with square brackets', () => {
      const code = 'flowchart TD\nA[Start] --> B[End]';
      expect(countNodes(code)).toBeGreaterThan(0);
    });

    it('counts flowchart nodes with parentheses', () => {
      const code = 'flowchart TD\nA(Node1) --> B(Node2)';
      expect(countNodes(code)).toBeGreaterThan(0);
    });

    it('counts flowchart nodes with curly braces', () => {
      const code = 'flowchart TD\nA{Decision} --> B[Result]';
      expect(countNodes(code)).toBeGreaterThan(0);
    });

    it('counts flowchart nodes with angle brackets', () => {
      const code = 'flowchart TD\nA>Action] --> B[Result]';
      expect(countNodes(code)).toBeGreaterThan(0);
    });

    it('counts sequence diagram participants', () => {
      const code = 'sequenceDiagram\nparticipant A\nparticipant B\nA->B: Hello';
      expect(countNodes(code)).toBeGreaterThan(0);
    });

    it('counts sequence diagram actors', () => {
      const code = 'sequenceDiagram\nactor User\nactor System\nUser->System: Request';
      expect(countNodes(code)).toBeGreaterThan(0);
    });

    it('counts class diagram classes', () => {
      const code = 'classDiagram\nclass Animal\nclass Dog\nAnimal <|-- Dog';
      expect(countNodes(code)).toBeGreaterThan(0);
    });

    it('counts state diagram states', () => {
      const code = 'stateDiagram-v2\n[*] --> Idle\nIdle --> Processing\nProcessing --> [*]';
      expect(countNodes(code)).toBeGreaterThan(0);
    });

    it('counts ER diagram entities', () => {
      const code = 'erDiagram\nCUSTOMER ||--o{ ORDER : places\nORDER ||--|{ LINE-ITEM : contains';
      expect(countNodes(code)).toBeGreaterThan(0);
    });

    it('counts gantt sections', () => {
      const code = 'gantt\nsection Section1\nTask1: a1, 2023-01-01, 5d\nsection Section2\nTask2: a2, 2023-01-06, 3d';
      expect(countNodes(code)).toBeGreaterThan(0);
    });

    it('counts pie chart labels', () => {
      const code = 'pie title Pets\n"Dogs": 386\n"Cats": 85';
      expect(countNodes(code)).toBeGreaterThan(0);
    });

    it('counts mindmap nodes', () => {
      const code = 'mindmap\nroot((Main))\n  Branch1\n    - Node1\n    - Node2\n  Branch2';
      expect(countNodes(code)).toBeGreaterThan(0);
    });

    it('handles various arrow types', () => {
      const code = 'flowchart TD\nA --> B\nC --> D\nE ==> F\nG ..> H';
      const count = countNodes(code);
      expect(count).toBeGreaterThan(0);
    });

    it('handles loop/alt/opt/par in sequence diagrams', () => {
      const code = 'sequenceDiagram\nA->>B: Request\nalt success\nB-->>A: Response\nelse failure\nB-->>A: Error\nend';
      expect(countNodes(code)).toBeGreaterThan(0);
    });
  });

  describe('analyzeComplexity', () => {
    it('returns simple for empty code', () => {
      const result = analyzeComplexity('');
      expect(result.estimatedComplexity).toBe('simple');
      expect(result.nodeCount).toBe(0);
      expect(result.isComplex).toBe(false);
    });

    it('returns simple for small diagrams', () => {
      const code = 'flowchart TD\nA --> B';
      const result = analyzeComplexity(code);
      expect(result.estimatedComplexity).toBe('simple');
      expect(result.isComplex).toBe(false);
    });

    it('returns moderate for medium diagrams', () => {
      // Create a diagram with ~60 nodes (between 50 and 100 threshold)
      let code = 'flowchart TD\n';
      for (let i = 1; i <= 60; i++) {
        code += `Node${i}[Node ${i}] --> `;
      }
      code = code.slice(0, -4); // Remove last arrow
      
      const result = analyzeComplexity(code);
      expect(result.estimatedComplexity).toBe('moderate');
      expect(result.isComplex).toBe(false);
    });

    it('returns complex for large diagrams', () => {
      // Create a diagram with > 100 nodes
      let code = 'flowchart TD\n';
      for (let i = 1; i <= 150; i++) {
        code += `Node${i}[Node ${i}] --> `;
      }
      code = code.slice(0, -4); // Remove last arrow
      
      const result = analyzeComplexity(code);
      expect(result.estimatedComplexity).toBe('complex');
      expect(result.isComplex).toBe(true);
    });

    it('returns correct node count', () => {
      const code = 'flowchart TD\nA[Start] --> B[End]';
      const result = analyzeComplexity(code);
      expect(result.nodeCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('shouldUseWorker', () => {
    it('returns false for simple diagrams', () => {
      expect(shouldUseWorker('flowchart TD\nA --> B')).toBe(false);
    });

    it('returns true for complex diagrams', () => {
      // Create a large diagram
      let code = 'flowchart TD\n';
      for (let i = 1; i <= 150; i++) {
        code += `Node${i}[Node ${i}] --> `;
      }
      code = code.slice(0, -4);
      
      expect(shouldUseWorker(code)).toBe(true);
    });

    it('returns false for empty code', () => {
      expect(shouldUseWorker('')).toBe(false);
    });

    it('delegates to analyzeComplexity', () => {
      const code = 'flowchart TD\nA[Start] --> B[End] --> C[Finish]';
      const result = shouldUseWorker(code);
      const expected = analyzeComplexity(code).isComplex;
      expect(result).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it('handles code with special characters in node names', () => {
      const code = 'flowchart TD\nnode_1[Node 1] --> node-2[Node 2]';
      expect(countNodes(code)).toBeGreaterThan(0);
    });

    it('handles code with multiline arrows', () => {
      const code = 'flowchart TD\nA --> B\nC --> D';
      expect(countNodes(code)).toBeGreaterThan(0);
    });

    it('handles code with pipe characters in arrows', () => {
      const code = 'flowchart TD\nA -->|text| B';
      expect(countNodes(code)).toBeGreaterThan(0);
    });
  });
});

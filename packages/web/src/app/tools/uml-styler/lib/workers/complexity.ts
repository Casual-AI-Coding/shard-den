/**
 * Diagram Complexity Detector
 * 
 * Analyzes Mermaid code to estimate node count and complexity.
 * Used to determine whether to use Web Worker for rendering.
 */

export interface ComplexityResult {
  nodeCount: number;
  isComplex: boolean;
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
}

// Threshold for using Web Worker
const COMPLEXITY_THRESHOLD = 100;

/**
 * Count nodes in Mermaid diagram code
 * 
 * Supports common diagram types:
 * - flowchart TD/LR/RL/BT
 * - sequenceDiagram
 * - classDiagram
 * - stateDiagram-v2
 * - erDiagram
 * - gantt
 * - pie
 * - mindmap
 * - journey
 * - gitGraph
 */
export function countNodes(code: string): number {
  if (!code.trim()) return 0;

  let nodeCount = 0;
  
  // Common patterns for node definitions
  const patterns = [
    // Flowchart nodes: nodeId[text], nodeId(text), nodeId>text], nodeId{text]
    /([A-Za-z][A-Za-z0-9_-]*)\s*\[[^\]]+\]/g,
    /([A-Za-z][A-Za-z0-9_-]*)\s*\([^\)]+\)/g,
    /([A-Za-z][A-Za-z0-9_-]*)\s*\>[^\]]+\]/g,
    /([A-Za-z][A-Za-z0-9_-]*)\s*\{[^}]+\}/g,
    
    // Flowchart arrows: A --> B, A -->|text| B, etc.
    /(?:^|[\s,])[A-Za-z][A-Za-z0-9_-]*(?:\s*(?:\-\-|\->|==|\.\.|-->|==>|\.\.\.))(?:\s*\|[^|]*\|)?\s*[A-Za-z][A-Za-z0-9_-]*/gm,
    
    // Sequence diagram: participant A, actor A, A->B:
    /(?:participant|actor|loop|alt|else|opt|par|section)\s+([A-Za-z][A-Za-z0-9_-]*)/gi,
    
    // Class diagram: class A {, A -- B
    /class\s+([A-Za-z][A-Za-z0-9_-]*)/gi,
    
    // State diagram: state A {, A --> B
    /state\s+([A-Za-z][A-Za-z0-9_-]*)/gi,
    
    // ER diagram: A ||--|{ B
    /([A-Za-z][A-Za-z0-9_-]*)[\s|]*(?:\|\||\{|<>|\}|--\|\||\|\-\-)\s*[\s|]*[A-Za-z][A-Za-z0-9_-]*/gi,
    
    // Gantt: section SectionName
    /section\s+([A-Za-z][A-Za-z0-9_-]*)/gi,
    
    // Pie: "label": value
    /"([^"]+)"\s*:\s*\d+/g,
    
    // Mindmap: root, node (at root level)
    /(?:^|\n)\s*([A-Za-z][A-Za-z0-9_-]*)\s*[-:]/gm,
  ];

  // Use a Set to avoid counting the same node multiple times
  const uniqueNodes = new Set<string>();

  // Pattern 1: Flowchart node definitions
  let match;
  while ((match = patterns[0].exec(code)) !== null) {
    uniqueNodes.add(match[1]);
  }
  while ((match = patterns[1].exec(code)) !== null) {
    uniqueNodes.add(match[1]);
  }
  while ((match = patterns[2].exec(code)) !== null) {
    uniqueNodes.add(match[1]);
  }
  while ((match = patterns[3].exec(code)) !== null) {
    uniqueNodes.add(match[1]);
  }

  // Pattern 2: Flowchart arrows (count both endpoints)
  while ((match = patterns[4].exec(code)) !== null) {
    const parts = match[0].split(/[\s,]+/).filter(p => p.length > 0);
    parts.forEach(part => {
      if (!part.includes('-->') && !part.includes('->') && !part.includes('==') && !part.includes('..')) {
        if (/^[A-Za-z]/.test(part)) {
          uniqueNodes.add(part.replace(/[|{}()\[\]]/g, ''));
        }
      }
    });
  }

  // Pattern 3: Sequence diagram participants
  while ((match = patterns[5].exec(code)) !== null) {
    uniqueNodes.add(match[1].toUpperCase());
  }

  // Pattern 4: Class diagram
  while ((match = patterns[6].exec(code)) !== null) {
    uniqueNodes.add(match[1]);
  }

  // Pattern 5: State diagram
  while ((match = patterns[7].exec(code)) !== null) {
    uniqueNodes.add(match[1]);
  }

  // Pattern 6: ER diagram
  while ((match = patterns[8].exec(code)) !== null) {
    if (match[1]) uniqueNodes.add(match[1]);
  }

  // Pattern 7: Gantt sections
  while ((match = patterns[9].exec(code)) !== null) {
    uniqueNodes.add(match[1]);
  }

  // Pattern 8: Pie chart
  while ((match = patterns[10].exec(code)) !== null) {
    uniqueNodes.add(match[1]);
  }

  // Pattern 9: Mindmap
  while ((match = patterns[11].exec(code)) !== null) {
    uniqueNodes.add(match[1]);
  }

  // Estimate additional nodes from arrow counts (each arrow typically connects 2 nodes)
  const arrowMatches = code.match(/(?:-->|->|==|\.\.\.|\.\.>|<\.\.\.|<--|<==)/g);
  const arrowCount = arrowMatches ? arrowMatches.length : 0;
  
  // Add estimated connected nodes
  nodeCount = uniqueNodes.size + Math.floor(arrowCount * 0.5);
  
  return nodeCount;
}

/**
 * Determine if diagram is complex enough to warrant Web Worker
 */
export function analyzeComplexity(code: string): ComplexityResult {
  const nodeCount = countNodes(code);
  const isComplex = nodeCount > COMPLEXITY_THRESHOLD;
  
  let estimatedComplexity: 'simple' | 'moderate' | 'complex';
  if (nodeCount <= 50) {
    estimatedComplexity = 'simple';
  } else if (nodeCount <= COMPLEXITY_THRESHOLD) {
    estimatedComplexity = 'moderate';
  } else {
    estimatedComplexity = 'complex';
  }
  
  return {
    nodeCount,
    isComplex,
    estimatedComplexity,
  };
}

/**
 * Check if code should use Web Worker
 */
export function shouldUseWorker(code: string): boolean {
  return analyzeComplexity(code).isComplex;
}

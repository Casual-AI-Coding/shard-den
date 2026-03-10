'use client';

import React, { useCallback, useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';

// Import Prism languages
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';

interface EditorProps {
  code: string;
  onChange: (code: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  engine: 'mermaid' | 'plantuml' | 'd2' | 'graphviz' | 'wavedrom';
  onEngineChange: (engine: 'mermaid' | 'plantuml' | 'd2' | 'graphviz' | 'wavedrom') => void;
}

const engines = [
  { id: 'mermaid', name: 'Mermaid', icon: '📊' },
  { id: 'plantuml', name: 'PlantUML', icon: '🌿' },
  { id: 'd2', name: 'D2', icon: '🔷' },
  { id: 'graphviz', name: 'Graphviz', icon: '🕸️' },
  { id: 'wavedrom', name: 'WaveDrom', icon: '〰️' },
];

// Get Prism grammar based on engine
const getGrammar = (engine: string) => {
  switch (engine) {
    case 'mermaid':
    case 'plantuml':
    case 'd2':
    case 'graphviz':
    case 'wavedrom':
      return Prism.languages.markdown || Prism.languages.text;
    default:
      return Prism.languages.text;
  }
};

// Highlight function
const highlightCode = (code: string, engine: string) => {
  const grammar = getGrammar(engine);
  if (!grammar) return code;
  return Prism.highlight(code, grammar, engine);
};

export default function EditorPanel({ 
  code, 
  onChange, 
  onCursorChange,
  engine,
  onEngineChange,
}: EditorProps) {
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  const handleCursorChange = useCallback(() => {
    // Calculate cursor position from code
    if (!onCursorChange) return;
    const lines = code.split('\n');
    setCursorLine(lines.length);
    setCursorCol(lines[lines.length - 1].length + 1);
    onCursorChange(lines.length, lines[lines.length - 1].length + 1);
  }, [code, onCursorChange]);

  return (
    <div className="h-full flex flex-col bg-[var(--surface-primary)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-secondary)] border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">语法:</span>
          <select
            value={engine}
            onChange={(e) => onEngineChange(e.target.value as typeof engine)}
            className="px-3 py-1 bg-[var(--surface-primary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]"
          >
            {engines.map((eng) => (
              <option key={eng.id} value={eng.id}>
                {eng.icon} {eng.name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-[var(--text-secondary)]">
          行 {cursorLine}, 列 {cursorCol}
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 relative overflow-auto">
        <Editor
          value={code}
          onValueChange={onChange}
          highlight={(code) => highlightCode(code, engine)}
          padding={16}
          onKeyUp={handleCursorChange}
          onClick={handleCursorChange}
          className="font-mono text-sm"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: 14,
            backgroundColor: 'var(--surface-primary)',
            color: 'var(--text-primary)',
            minHeight: '100%',
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-secondary)] border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-4">
          <span>{code.split('\n').length} 行</span>
          <span>{code.length} 字符</span>
        </div>
        <div className="flex items-center gap-2">
          <span>UTF-8</span>
          <span>{engine.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

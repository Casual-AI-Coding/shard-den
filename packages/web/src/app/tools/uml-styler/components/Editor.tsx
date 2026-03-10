'use client';

import React, { useCallback, useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';

// Import Prism languages
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-css';
import 'prismjs/themes/prism-tomorrow.css';

// Editor constants
const EDITOR_FONT_FAMILY = 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';
const EDITOR_FONT_SIZE = 14;
const EDITOR_PADDING = 16;
const DEFAULT_CURSOR_LINE = 1;
const DEFAULT_CURSOR_COL = 1;

// Engine type definition
type EngineType = 'mermaid' | 'plantuml' | 'd2' | 'graphviz' | 'wavedrom';

// Engine configurations
const ENGINE_CONFIG: Record<EngineType, { id: EngineType; name: string; icon: string; grammar: string }> = {
  mermaid: { id: 'mermaid', name: 'Mermaid', icon: '📊', grammar: 'markdown' },
  plantuml: { id: 'plantuml', name: 'PlantUML', icon: '🌿', grammar: 'markdown' },
  d2: { id: 'd2', name: 'D2', icon: '🔷', grammar: 'markdown' },
  graphviz: { id: 'graphviz', name: 'Graphviz', icon: '🕸️', grammar: 'markdown' },
  wavedrom: { id: 'wavedrom', name: 'WaveDrom', icon: '〰️', grammar: 'javascript' },
};

const engines = Object.values(ENGINE_CONFIG);

interface EditorProps {
  code: string;
  onChange: (code: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  engine: EngineType;
  onEngineChange: (engine: EngineType) => void;
}

// Get Prism grammar based on engine with fallback
const getGrammar = (engine: EngineType): Prism.Grammar | { plain: true } => {
  const config = ENGINE_CONFIG[engine];
  if (!config) {
    return { plain: true };
  }

  switch (config.grammar) {
    case 'markdown':
      return Prism.languages.markdown || Prism.languages.text || { plain: true };
    case 'javascript':
      return Prism.languages.javascript || Prism.languages.text || { plain: true };
    default:
      return Prism.languages.text || { plain: true };
  }
};

// Highlight function with error handling
const highlightCode = (code: string, engine: EngineType) => {
  try {
    const grammar = getGrammar(engine);
    if (!grammar || 'plain' in grammar) {
      return code;
    }
    return Prism.highlight(code, grammar, engine) || code;
  } catch (error) {
    // Fallback to plain text on error
    console.warn('Syntax highlighting failed:', error);
    return code;
  }
};

export default function EditorPanel({ 
  code, 
  onChange, 
  onCursorChange,
  engine,
  onEngineChange,
}: EditorProps) {
  const [cursorLine, setCursorLine] = useState(DEFAULT_CURSOR_LINE);
  const [cursorCol, setCursorCol] = useState(DEFAULT_CURSOR_COL);

  // Calculate cursor position from editor's text selection
  const handleCursorChange = useCallback(() => {
    // react-simple-code-editor doesn't expose cursor position directly
    // Using document.activeElement as a workaround
    const activeElement = document.activeElement as HTMLTextAreaElement | null;
    if (!activeElement || !onCursorChange) return;
    
    const cursorPosition = activeElement.selectionStart || 0;
    const textBeforeCursor = code.slice(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    
    setCursorLine(line);
    setCursorCol(col);
    onCursorChange(line, col);
  }, [code, onCursorChange]);

  return (
    <div className="h-full flex flex-col bg-[var(--surface-primary)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-secondary)] border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">语法:</span>
          <select
            value={engine}
            onChange={(e) => onEngineChange(e.target.value as EngineType)}
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
          highlight={(value) => highlightCode(value, engine)}
          padding={EDITOR_PADDING}
          onKeyUp={handleCursorChange}
          onClick={handleCursorChange}
          className="font-mono text-sm"
          style={{
            fontFamily: EDITOR_FONT_FAMILY,
            fontSize: EDITOR_FONT_SIZE,
            backgroundColor: 'var(--surface-primary)',
            color: 'var(--text-primary)',
            minHeight: '100%',
          }}
          textareaClassName="focus:outline-none"
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

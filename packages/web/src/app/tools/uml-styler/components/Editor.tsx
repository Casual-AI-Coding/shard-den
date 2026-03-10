'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';

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

export default function EditorPanel({ 
  code, 
  onChange, 
  onCursorChange,
  engine,
  onEngineChange,
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    onChange(newCode);
  }, [onChange]);

  const handleCursorChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || !onCursorChange) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;

    setCursorLine(line);
    setCursorCol(col);
    onCursorChange(line, col);
  }, [onCursorChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      
      // Create a synthetic change event
      const event = {
        target: { value: newValue }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      
      handleChange(event);
      
      // Set cursor position after the inserted tabs
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  }, [handleChange]);

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
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleChange}
          onKeyUp={handleCursorChange}
          onClick={handleCursorChange}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-4 resize-none outline-none bg-[var(--surface-primary)] text-[var(--text-primary)] font-mono text-sm leading-6 border-none"
          style={{ 
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            tabSize: 2,
          }}
          spellCheck={false}
          placeholder="输入图表代码..."
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

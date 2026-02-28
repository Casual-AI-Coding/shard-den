'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface EditorProps {
  code: string;
  onChange: (code: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  engine: 'mermaid' | 'plantuml';
  onEngineChange: (engine: 'mermaid' | 'plantuml') => void;
}

// Mermaid syntax highlight config
const MERMAID_LANGUAGE_CONFIG = {
  comments: {
    lineComment: '%%',
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
  ],
};

const MERMAID_TOKEN_PROVIDER = {
  defaultToken: '',
  tokenPostfix: '.mermaid',

  keywords: [
    'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
    'erDiagram', 'gantt', 'pie', 'mindmap', 'journey', 'gitGraph',
    'TD', 'TB', 'BT', 'RL', 'LR', 'subgraph', 'end',
    'participant', 'actor', 'note', 'over', 'loop', 'alt', 'else', 'opt',
    'par', 'rect', 'autonumber', 'activate', 'deactivate',
    'class', 'namespace', 'direction', 'state', 'scale',
  ],

  operators: [
    '-->', '--', '->', '->>', '-.-', '-.->', ':::', '|',
    '{', '}', '(', ')', '[', ']', '<', '>',
  ],

  symbols: /[=><!~?:&|+\-*\/\^%]+/,

  tokenizer: {
    root: [
      [/\%\%.*$/, 'comment'],
      [/[{}()\[\]]/, '@brackets'],
      [/[a-zA-Z_]\w*/, {
        cases: {
          '@keywords': 'keyword',
          '@default': 'identifier',
        },
      }],
      [/["']([^"']*)["']/, 'string'],
      [/\d+/, 'number'],
    ],
  },
};

export default function CodeEditor({ 
  code, 
  onChange, 
  onCursorChange,
  engine, 
  onEngineChange 
}: EditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Register Mermaid language
    if (!monaco.languages.getLanguages().some((lang: { id: string }) => lang.id === 'mermaid')) {
      monaco.languages.register({ id: 'mermaid' });
      monaco.languages.setLanguageConfiguration('mermaid', MERMAID_LANGUAGE_CONFIG as any);
      monaco.languages.setMonarchTokensProvider('mermaid', MERMAID_TOKEN_PROVIDER as any);
    }

    // Set editor options
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      wordWrap: 'on',
      automaticLayout: true,
      scrollBeyondLastLine: false,
      padding: { top: 16, bottom: 16 },
    });

    // Listen to cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange(e.position.lineNumber, e.position.column);
      }
    });
  }, [onCursorChange]);

  const handleChange = (value: string | undefined) => {
    onChange(value || '');
  };

  const handleClear = () => {
    onChange('');
    editorRef.current?.focus();
  };

  const handleFormat = () => {
    // Simple formatting: trim trailing whitespace from each line
    const formatted = code.split('\n').map(line => line.trimEnd()).join('\n');
    onChange(formatted);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-12 px-4 bg-[var(--bg)] border-b border-[var(--border)] flex items-center gap-2 shrink-0">
        {/* Engine Selector */}
        <select
          value={engine}
          onChange={(e) => onEngineChange(e.target.value as 'mermaid' | 'plantuml')}
          className="px-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded hover:border-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <option value="mermaid">Mermaid</option>
          <option value="plantuml" disabled>PlantUML (Coming Soon)</option>
        </select>

        {/* Format Button */}
        <button
          onClick={handleFormat}
          className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded transition-colors"
          title="Format code"
        >
          格式化
        </button>

        {/* Clear Button */}
        <button
          onClick={handleClear}
          className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
          title="Clear editor"
        >
          清空
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={engine === 'mermaid' ? 'mermaid' : 'markdown'}
          value={code}
          onChange={handleChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
}

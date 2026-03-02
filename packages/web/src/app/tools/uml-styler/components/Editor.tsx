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

// PlantUML syntax highlight config
const PLANTUML_LANGUAGE_CONFIG = {
  comments: {
    lineComment: "'",
    blockComment: ['/*', '*/'],
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
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
  ],
};

const PLANTUML_TOKEN_PROVIDER = {
  defaultToken: '',
  tokenPostfix: '.plantuml',

  keywords: [
    '@startuml', '@enduml', 'actor', 'participant',
    'class', 'interface', 'abstract', 'enum', 'annotation', 'component', 'node',
    'folder', 'file', 'package', 'frame', 'rectangle', 'cloud', 'database',
    'stack', 'queue', 'storage', 'artifact', 'boundary', 'control', 'entity',
    'agent', 'collections', 'usecase', 'object', 'card',
    'note', 'title', 'skinparam', '!theme', '!include', '!definelong', '!define',
    '!unquoted', 'as', 'extends', 'implements',
    'if', 'else', 'elseif', 'endif', 'while', 'endwhile', 'repeat', 'again',
    'fork', 'endfork', 'merge', 'split', 'endsplit', 'partition', 'endpartition',
    'state', 'entry', 'exit', 'end', 'choice', 'join', 'junction',
    'start', 'stop', 'kill', 'detach', 'return', 'wait', 'read', 'write',
    'activate', 'deactivate', 'destroy', 'create', 'new', 'order', 'hide', 'show',
    'left', 'right', 'up', 'down', 'also', 'endlink', 'over', 'of', 'is',
    'on', 'off', 'strict', 'lazy', 'gray', 'white', 'hidden', 'plain',
    'stereotype', 'top', 'bottom', 'header', 'footer',
    'legend', 'endlegend', 'caption', 'center', 'rotate', 'ref',
  ],

  operators: [
    '->', '-->', '<-', '<--', '->>', '<<-', '<->', '<-->', '->x', 'x->',
    '--', '==', '::', '..', '//', '==>', '<==', '..>', '<..', '/>', '<\\',
  ],

  symbols: /[=><!~?:&|+\-*\/\^%]+/,

  tokenizer: {
    root: [
      [/'[^\n]*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],
      [/[{}()\[\]]/, '@brackets'],
      [/[a-zA-Z_]\w*/, {
        cases: {
          '@keywords': 'keyword',
          '@default': 'identifier',
        },
      }],
      [/[<][>-]/, 'type.identifier'],
      [/`[^`]*`/, 'string'],
      [/\d+/, 'number'],
      [/[;,.]/, 'delimiter'],
      [/[=><!~?:&|+\-*\/\^%]+/, {
        cases: {
          '@operators': 'operator',
          '@default': '',
        },
      }],
    ],
    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment'],
    ],
    string: [
      [/[^'\\]+/, 'string'],
      [/\\./, 'string.escape'],
      [/'/, 'string', '@pop'],
    ],
  },
};

// PlantUML Completion Provider
const PLANTUML_COMPLETIONS = [
  { label: '@startuml', kind: 14, insertText: '@startuml\\n$0\\n@enduml', insertTextRules: 4, documentation: 'Start a PlantUML diagram' },
  { label: 'actor', kind: 14, insertText: 'actor ${1:Name} as ${2:alias}', insertTextRules: 4, documentation: 'Define an actor' },
  { label: 'participant', kind: 14, insertText: 'participant ${1:Name} as ${2:alias}', insertTextRules: 4, documentation: 'Define a participant' },
  { label: 'class', kind: 14, insertText: 'class ${1:ClassName} {\\n\\t${2:attributes}\\n}', insertTextRules: 4, documentation: 'Define a class' },
  { label: 'interface', kind: 14, insertText: 'interface ${1:InterfaceName} {\\n\\t${2:methods}\\n}', insertTextRules: 4, documentation: 'Define an interface' },
  { label: 'package', kind: 14, insertText: 'package ${1:PackageName} {\\n\\t${2:contents}\\n}', insertTextRules: 4, documentation: 'Define a package' },
  { label: 'note', kind: 14, insertText: 'note ${1:left|right|over} of ${2:element}\\n\\t${3:content}\\nend note', insertTextRules: 4, documentation: 'Add a note' },
  { label: 'title', kind: 14, insertText: 'title ${1:Diagram Title}', insertTextRules: 4, documentation: 'Set diagram title' },
  { label: 'skinparam', kind: 14, insertText: 'skinparam ${1:parameter} ${2:value}', insertTextRules: 4, documentation: 'Set skin parameter' },
  { label: '!theme', kind: 14, insertText: '!theme ${1:theme-name}', insertTextRules: 4, documentation: 'Apply a theme' },
  { label: 'sequence-arrow', kind: 27, insertText: '${1:A} -> ${2:B} : ${3:message}', insertTextRules: 4, documentation: 'Sequence arrow' },
  { label: 'class-inheritance', kind: 27, insertText: '${1:Child} --|> ${2:Parent}', insertTextRules: 4, documentation: 'Class inheritance' },
  { label: 'class-composition', kind: 27, insertText: '${1:A} *-- ${2:B}', insertTextRules: 4, documentation: 'Class composition' },
  { label: 'if-endif', kind: 27, insertText: 'if ${1:condition} then\\n\\t${2:action}\\nendif', insertTextRules: 4, documentation: 'If statement' },
  { label: 'while-endwhile', kind: 27, insertText: 'while ${1:condition}\\n\\t${2:action}\\nendwhile', insertTextRules: 4, documentation: 'While loop' },
];

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

    // Register PlantUML language
    if (!monaco.languages.getLanguages().some((lang: { id: string }) => lang.id === 'plantuml')) {
      monaco.languages.register({ id: 'plantuml' });
      monaco.languages.setLanguageConfiguration('plantuml', PLANTUML_LANGUAGE_CONFIG as any);
      monaco.languages.setMonarchTokensProvider('plantuml', PLANTUML_TOKEN_PROVIDER as any);
    }

    // Register PlantUML completion provider
    monaco.languages.registerCompletionItemProvider('plantuml', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        return {
          suggestions: PLANTUML_COMPLETIONS.map((item) => ({
            ...item,
            range,
          })),
        };
      },
    });


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
          <option value="plantuml">PlantUML</option>
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
          language={engine === 'plantuml' ? 'plantuml' : 'mermaid'}
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

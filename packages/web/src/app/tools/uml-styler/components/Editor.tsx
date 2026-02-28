'use client';

import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface EditorProps {
  code: string;
  onChange: (code: string) => void;
  engine: 'mermaid' | 'plantuml';
}

// Mermaid 语法高亮配置
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
      [/[\"']([^\"']*)[\"']/, 'string'],
      [/\d+/, 'number'],
    ],
  },
};

export default function CodeEditor({ code, onChange, engine }: EditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // 注册 Mermaid 语言
    if (!monaco.languages.getLanguages().some((lang: { id: string }) => lang.id === 'mermaid')) {
      monaco.languages.register({ id: 'mermaid' });
      monaco.languages.setLanguageConfiguration('mermaid', MERMAID_LANGUAGE_CONFIG as any);
      monaco.languages.setMonarchTokensProvider('mermaid', MERMAID_TOKEN_PROVIDER as any);
    }

    // 设置编辑器选项
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      wordWrap: 'on',
      automaticLayout: true,
      scrollBeyondLastLine: false,
    });
  };

  const handleChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b bg-gray-50 text-sm font-medium">
        {engine === 'mermaid' ? 'Mermaid' : 'PlantUML'} Editor
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          language={engine === 'mermaid' ? 'mermaid' : 'markdown'}
          value={code}
          onChange={handleChange}
          onMount={handleEditorMount}
          theme="vs"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}
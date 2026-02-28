'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import ThemeSelector from './components/ThemeSelector';
import ExportPanel from './components/ExportPanel';
import TemplateLibrary from './components/TemplateLibrary';

export default function UMLStylerPage() {
  const [code, setCode] = useState<string>('flowchart TD\n    A[Start] --> B[End]');
  const [theme, setTheme] = useState<string>('default');
  const [engine, setEngine] = useState<'mermaid' | 'plantuml'>('mermaid');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });

  useEffect(() => {
    import('mermaid').then((mermaid) => {
      mermaid.default.initialize({ 
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
      });
      setIsLoading(false);
    });
  }, []);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const handleCursorChange = useCallback((line: number, col: number) => {
    setCursorPosition({ line, col });
  }, []);

  const handleThemeChange = useCallback((newTheme: string) => {
    setTheme(newTheme);
  }, []);

  const handleEngineChange = useCallback((newEngine: 'mermaid' | 'plantuml') => {
    setEngine(newEngine);
  }, []);

  const handleError = useCallback((err: string | null) => {
    setError(err);
  }, []);

  const handleShare = useCallback(() => {
    // Generate shareable URL with code encoded
    const encoded = btoa(encodeURIComponent(code));
    const url = `${window.location.origin}${window.location.pathname}?code=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Share link copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy link');
    });
  }, [code]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">正在初始化...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <path d="M8 7h8M8 11h8M8 15h4" />
          </svg>
          <span className="text-xl font-bold text-slate-900">UML Styler</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSelector theme={theme} onThemeChange={handleThemeChange} />
          <button 
            onClick={handleShare}
            className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
          >
            分享
          </button>
          <ExportPanel code={code} theme={theme} engine={engine} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Editor (40%) */}
        <div className="w-2/5 min-w-[400px] flex flex-col border-r border-slate-200 bg-white">
          <Editor 
            code={code} 
            onChange={handleCodeChange}
            onCursorChange={handleCursorChange}
            engine={engine}
            onEngineChange={handleEngineChange}
          />
          {/* Editor Toolbar */}
          <div className="h-12 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <TemplateLibrary onSelect={setCode} />
            <div className="text-xs text-slate-500">
              Ln {cursorPosition.line}, Col {cursorPosition.col}
            </div>
          </div>
        </div>

        {/* Right: Preview (60%) */}
        <div className="flex-1 min-w-[500px] flex flex-col bg-white">
          <Preview 
            code={code} 
            theme={theme}
            engine={engine}
            onError={handleError}
          />
        </div>
      </main>

      {/* Error Panel */}
      {error && (
        <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-lg">⚠️</span>
            <div>
              <h4 className="font-medium text-red-800">渲染错误</h4>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

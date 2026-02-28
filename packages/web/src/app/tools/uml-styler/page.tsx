'use client';

import { useState, useEffect, useCallback } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import ThemeSelector from './components/ThemeSelector';
import ExportPanel from './components/ExportPanel';
import TemplateLibrary from './components/TemplateLibrary';
import { Header } from '@/components/Header';

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
    const encoded = btoa(encodeURIComponent(code));
    const url = `${window.location.origin}${window.location.pathname}?code=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('分享链接已复制到剪贴板！');
    }).catch(() => {
      alert('复制失败');
    });
  }, [code]);

  return (
    <>
      <Header title="UML Styler" />
      <main className="flex-1 flex overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center bg-[var(--bg)]">
            <div className="flex items-center gap-3 text-[var(--text-secondary)]">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>正在初始化...</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex">
            {/* Left: Editor (40%) */}
            <div className="w-2/5 min-w-[400px] flex flex-col border-r border-[var(--border)] bg-[var(--surface)]">
              <Editor 
                code={code} 
                onChange={handleCodeChange}
                onCursorChange={handleCursorChange}
                engine={engine}
                onEngineChange={handleEngineChange}
              />
              {/* Editor Toolbar */}
              <div className="h-12 px-4 bg-[var(--bg)] border-t border-[var(--border)] flex items-center justify-between shrink-0">
                <TemplateLibrary onSelect={setCode} />
                <div className="text-xs text-[var(--text-secondary)]">
                  Ln {cursorPosition.line}, Col {cursorPosition.col}
                </div>
              </div>
            </div>

            {/* Right: Preview (60%) */}
            <div className="flex-1 min-w-[500px] flex flex-col bg-[var(--surface)]">
              <Preview 
                code={code} 
                theme={theme}
                engine={engine}
                onError={handleError}
                onThemeChange={handleThemeChange}
                onShare={handleShare}
              />
            <div className="flex-1 min-w-[500px] flex flex-col bg-[var(--surface)]">
              {/* Preview Toolbar - 功能按钮移到这里 */}
              <div className="h-12 px-4 bg-[var(--bg)] border-b border-[var(--border)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <ThemeSelector theme={theme} onThemeChange={handleThemeChange} />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleShare}
                    className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded transition-colors"
                  >
                    分享
                  </button>
                  <ExportPanel code={code} theme={theme} engine={engine} />
                </div>
              </div>
            </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
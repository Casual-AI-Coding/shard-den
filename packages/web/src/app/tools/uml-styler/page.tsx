'use client';

import type { ThemeTuning } from './types';
import { useState, useEffect, useCallback } from 'react';


export default function UMLStylerPage() {
  const [code, setCode] = useState<string>('flowchart TD\n    A[Start] --> B[End]');
  const [theme, setTheme] = useState<string>('default');
  const [engine, setEngine] = useState<'mermaid' | 'plantuml'>('mermaid');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [tuning, setTuning] = useState<ThemeTuning>({});

  const handleTuningChange = useCallback((newTuning: ThemeTuning) => {
    setTuning(newTuning);
  }, []);

  useEffect(() => {
    // 解析分享链接
    const state = parseShareUrl();
    if (state) {
      setCode(state.code);
      setEngine(state.engine);
      setTheme(state.theme);
      if (state.tuning) {
        setTuning({
          primaryColor: state.tuning.primaryColor,
          fontFamily: state.tuning.fontFamily,
          fontSize: state.tuning.fontSize,
          lineWidth: state.tuning.lineWidth,
          backgroundColor: state.tuning.backgroundColor,
        });
      }
    }
  }, []); // 只在组件挂载时执行一次

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

  const getState = useCallback(() => ({
    code,
    engine,
    theme,
    tuning,
  }), [code, engine, theme, tuning]);

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
                <div className="flex items-center gap-3">
                  <TemplateLibrary onSelect={setCode} />
                  <ShareButton getState={getState} />
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  Ln {cursorPosition.line}, Col {cursorPosition.col}
                </div>
              </div>
            </div>

            {/* Middle: Theme Tuner (sidebar) */}
            <div className="w-64 shrink-0 border-r border-[var(--border)] bg-[var(--bg)] overflow-y-auto p-4">
              <ThemeTuner tuning={tuning} onTuningChange={handleTuningChange} />
            </div>

            {/* Right: Preview */}
            <div className="flex-1 min-w-[500px] flex flex-col bg-[var(--surface)]">
              <Preview 
                code={code} 
                theme={theme}
                engine={engine}
                tuning={tuning}
                onError={handleError}
                onThemeChange={handleThemeChange}
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}

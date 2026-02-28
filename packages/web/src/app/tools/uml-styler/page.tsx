'use client';

import { useState, useEffect, useCallback } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import ThemeSelector from './components/ThemeSelector';
import ExportPanel from './components/ExportPanel';

export default function UMLStylerPage() {
  const [code, setCode] = useState<string>('flowchart TD\n    A[Start] --> B[End]');
  const [theme, setTheme] = useState<string>('default');
  const [engine, setEngine] = useState<'mermaid' | 'plantuml'>('mermaid');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 初始化 mermaid
    import('mermaid').then((mermaid) => {
      mermaid.default.initialize({ 
        startOnLoad: false,
        theme: 'default'
      });
      setIsLoading(false);
    });
  }, []);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const handleThemeChange = useCallback((newTheme: string) => {
    setTheme(newTheme);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b px-4 py-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">UML Styler</h1>
        <div className="flex items-center gap-4">
          <ThemeSelector 
            theme={theme} 
            onThemeChange={handleThemeChange} 
          />
          <ExportPanel 
            code={code} 
            theme={theme} 
            engine={engine}
          />
        </div>
      </header>

      {/* Main Content - Split View */}
      <main className="flex-1 grid grid-cols-2 divide-x overflow-hidden">
        {/* Left: Editor */}
        <div className="h-full overflow-hidden">
          <Editor 
            code={code} 
            onChange={handleCodeChange}
            engine={engine}
          />
        </div>

        {/* Right: Preview */}
        <div className="h-full overflow-hidden">
          <Preview 
            code={code} 
            theme={theme}
            engine={engine}
          />
        </div>
      </main>
    </div>
  );
}
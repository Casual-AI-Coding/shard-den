'use client';

import { useState, useEffect, useCallback } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import ThemeSelector from './components/ThemeSelector';
import ExportPanel from './components/ExportPanel';
import TemplateLibrary from './components/TemplateLibrary';
import HistoryPanel from './components/HistoryPanel';
import { SaveTemplateModal } from './components/SaveTemplateModal';
import { Header } from '@/components/Header';
import type { ThemeTuning } from './types';
import { 
  isTauri, 
  loadUmlTemplates, 
  saveUmlTemplate, 
  deleteUmlTemplate,
  type UmlTemplate 
} from '@/lib/tauri';
import { Save } from 'lucide-react';

export default function UMLStylerPage() {
  const [code, setCode] = useState<string>('flowchart TD\n    A[Start] --> B[End]');
  const [theme, setTheme] = useState<string>('default');
  const [engine, setEngine] = useState<'mermaid' | 'plantuml'>('mermaid');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [tuning, setTuning] = useState<ThemeTuning>({});
  const [showHistory, setShowHistory] = useState(false);
  
  // Custom templates state
  const [customTemplates, setCustomTemplates] = useState<UmlTemplate[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Initialize Mermaid and check platform
  useEffect(() => {
    import('mermaid').then((mermaid) => {
      mermaid.default.initialize({ 
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
      });
      setIsLoading(false);
    });
    
    // Check if running in Tauri
    setIsDesktop(isTauri());
  }, []);

  // Load custom templates on mount (Desktop only)
  useEffect(() => {
    if (!isDesktop) return;
    
    loadUmlTemplates()
      .then((templates) => {
        // Filter custom templates (is_custom: true)
        const custom = templates.filter(t => (t as unknown as { is_custom?: boolean }).is_custom !== false);
        setCustomTemplates(custom);
      })
      .catch(console.error);
  }, [isDesktop]);

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

  const handleTuningChange = useCallback((newTuning: ThemeTuning) => {
    setTuning(newTuning);
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

  const handleLoadHistory = useCallback((loadedCode: string, loadedEngine: string, loadedTheme: string) => {
    setError(null);
    setCode(loadedCode);
    setEngine(loadedEngine as 'mermaid' | 'plantuml');
    setTheme(loadedTheme);
  }, []);

  // Save as template handler
  const handleSaveAsTemplate = useCallback(async (name: string, description: string) => {
    const newTemplate: UmlTemplate = {
      id: crypto.randomUUID(),
      name,
      description,
      code,
      engine,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    try {
      await saveUmlTemplate(newTemplate);
      setCustomTemplates(prev => [...prev, newTemplate]);
    } catch (err) {
      console.error('Failed to save template:', err);
      alert('保存模板失败');
    }
  }, [code, engine]);

  // Delete custom template handler
  const handleDeleteCustomTemplate = useCallback(async (id: string) => {
    try {
      await deleteUmlTemplate(id);
      setCustomTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete template:', err);
      alert('删除模板失败');
    }
  }, []);

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
                <div className="flex items-center gap-2">
                  <TemplateLibrary 
                    onSelect={setCode} 
                    customTemplates={customTemplates}
                    onDeleteCustomTemplate={handleDeleteCustomTemplate}
                  />
                  <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded transition-colors"
                    title="历史记录"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>历史</span>
                  </button>
                </div>
                
                {/* Save as Template button - Desktop only */}
                {isDesktop && (
                  <button
                    onClick={() => setShowSaveTemplateModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded transition-colors"
                    title="保存为模板"
                  >
                    <Save className="w-4 h-4" />
                    <span>保存模板</span>
                  </button>
                )}
                
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
                tuning={tuning}
                onTuningChange={handleTuningChange}
                onError={handleError}
                onThemeChange={handleThemeChange}
                onShare={handleShare}
              />
            </div>
          </div>
        )}
      </main>

      {/* History Panel */}
      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onLoadEntry={handleLoadHistory}
        currentCode={code}
        currentEngine={engine}
        currentTheme={theme}
      />

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveTemplateModal}
        onClose={() => setShowSaveTemplateModal(false)}
        onSave={handleSaveAsTemplate}
        currentCode={code}
        currentEngine={engine}
      />
    </>
  );
}

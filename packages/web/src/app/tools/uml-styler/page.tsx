'use client';

import { useState, useEffect, useCallback } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import ThemeSelector from './components/ThemeSelector';
import ExportPanel from './components/ExportPanel';
import TemplateLibrary from './components/TemplateLibrary';
import HistoryPanel from './components/HistoryPanel';
import { SaveThemeModal } from './components/SaveThemeModal';
import { SaveTemplateModal } from './components/SaveTemplateModal';
import { SettingsModal } from './components/SettingsModal';
import { useToast, ToastContainer } from './components/Toast';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Header } from '@/components/Header';
import type { ThemeTuning } from './types';
import { 
  isTauri, 
  loadUmlTemplates, 
  saveUmlTemplate, 
  deleteUmlTemplate,
  loadUmlThemes,
  saveUmlTheme,
  deleteUmlTheme,
  loadUmlConfig,
  saveUmlConfig,
  getDefaultUmlConfig,
  type UmlStylerConfig,
  type UmlTemplate,
  type UmlTheme
} from '@/lib/tauri';
import { Save, Settings } from 'lucide-react';

export default function UMLStylerPage() {
  const [code, setCode] = useState<string>('flowchart TD\n    A[Start] --> B[End]');
  const [theme, setTheme] = useState<string>('default');
  const [engine, setEngine] = useState<'mermaid' | 'plantuml' | 'd2' | 'graphviz' | 'wavedrom'>('mermaid');
  const [code, setCode] = useState<string>('flowchart TD\n    A[Start] --> B[End]');
  const [theme, setTheme] = useState<string>('default');
  const [engine, setEngine] = useState<'mermaid' | 'plantuml' | 'd2' | 'graphviz'>('mermaid');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [tuning, setTuning] = useState<ThemeTuning>({});
  const [showHistory, setShowHistory] = useState(false);
  
  // Custom templates and themes state
  const [customTemplates, setCustomTemplates] = useState<UmlTemplate[]>([]);
  const [customThemes, setCustomThemes] = useState<UmlTheme[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showSaveThemeModal, setShowSaveThemeModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [config, setConfig] = useState<UmlStylerConfig>(getDefaultUmlConfig());
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const { toasts, dismissToast, success, error: toastError } = useToast();

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

  // Load custom templates and themes on mount (Desktop only)
  useEffect(() => {
    if (!isDesktop) return;
    
    // Load config
    // Load config
    loadUmlConfig()
      .then((cfg) => {
        setConfig(cfg);
        setTheme(cfg.default_theme);
        setEngine(cfg.default_engine.toLowerCase() as 'mermaid' | 'plantuml' | 'd2' | 'graphviz' | 'wavedrom');
      })
      .then((cfg) => {
        setConfig(cfg);
        setTheme(cfg.default_theme);
        setEngine(cfg.default_engine.toLowerCase() as 'mermaid' | 'plantuml' | 'd2' | 'graphviz');
      })
      .catch((err) => {
        console.error('Failed to load config:', err);
      });
    loadUmlTemplates()
      .then((templates) => {
        setCustomTemplates(templates);
      })
      .catch((err) => {
        console.error('Failed to load templates:', err);
        toastError('加载模板失败');
      });

    // Load themes
    loadUmlThemes()
      .then((themes) => {
        setCustomThemes(themes);
      })
      .catch((err) => {
        console.error('Failed to load themes:', err);
        toastError('加载主题失败');
      });
  }, [isDesktop, toastError]);
    // Debounced config save
    useEffect(() => {
      if (!isDesktop) return;
      const timer = setTimeout(() => {
        saveUmlConfig(config).catch(console.error);
      }, 1000);
      return () => clearTimeout(timer);
    }, [config, isDesktop]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const handleCursorChange = useCallback((line: number, col: number) => {
    setCursorPosition({ line, col });
  }, []);

  const handleThemeChange = useCallback((newTheme: string) => {
    setTheme(newTheme);
    
    // Check if it's a custom theme and apply its tuning
    const customTheme = customThemes.find(t => t.id === newTheme);
    if (customTheme && customTheme.config) {
      setTuning(customTheme.config as ThemeTuning);
    }
    // Update config
    if (isDesktop) {
      setConfig(prev => ({ ...prev, default_theme: newTheme }));
    }
  }, [customThemes, isDesktop]);

  const handleEngineChange = useCallback((newEngine: 'mermaid' | 'plantuml' | 'd2' | 'graphviz' | 'wavedrom') => {
    setEngine(newEngine);
    // Update config
    if (isDesktop) {
      setConfig(prev => ({ 
        ...prev, 
        default_engine: (
          newEngine === 'mermaid' ? 'Mermaid' : 
          newEngine === 'plantuml' ? 'PlantUML' : 
          newEngine === 'd2' ? 'D2' :
          newEngine === 'wavedrom' ? 'WaveDrom' :
          'Graphviz'
        ) as 'Mermaid' | 'PlantUML' | 'D2' | 'Graphviz' | 'WaveDrom' 
      }));
    }
  }, [isDesktop]);
    setEngine(newEngine);
    // Update config
    if (isDesktop) {
      setConfig(prev => ({ 
        ...prev, 
        default_engine: (
          newEngine === 'mermaid' ? 'Mermaid' : 
          newEngine === 'plantuml' ? 'PlantUML' : 
          newEngine === 'd2' ? 'D2' :
          'Graphviz'
        ) as 'Mermaid' | 'PlantUML' | 'D2' | 'Graphviz' 
      }));
    }
  }, [isDesktop]);
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
      success('分享链接已复制到剪贴板！');
    }).catch(() => {
      toastError('复制失败');
    });
  }, [code, success, toastError]);

  const handleLoadHistory = useCallback((loadedCode: string, loadedEngine: string, loadedTheme: string) => {
    setError(null);
    setCode(loadedCode);
    setEngine(loadedEngine as 'mermaid' | 'plantuml' | 'd2' | 'graphviz' | 'wavedrom');
    setTheme(loadedTheme);
  }, []);
    setError(null);
    setCode(loadedCode);
    setEngine(loadedEngine as 'mermaid' | 'plantuml' | 'd2' | 'graphviz');
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
      success('模板保存成功');
    } catch (err) {
      console.error('Failed to save template:', err);
      toastError('保存模板失败');
    }
  }, [code, engine, success, toastError]);

  // Delete custom template handler
  const handleDeleteCustomTemplate = useCallback(async (id: string) => {
    try {
      await deleteUmlTemplate(id);
      setCustomTemplates(prev => prev.filter(t => t.id !== id));
      success('模板删除成功');
    } catch (err) {
      console.error('Failed to delete template:', err);
      toastError('删除模板失败');
    }
  }, [success, toastError]);

  // Save as theme handler
  const handleSaveAsTheme = useCallback(async (name: string, description: string) => {
    const newTheme: UmlTheme = {
      id: crypto.randomUUID(),
      name,
      description,
      theme_type: 'custom',
      config: (tuning || {}) as Record<string, unknown>,

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    try {
      await saveUmlTheme(newTheme);
      setCustomThemes(prev => [...prev, newTheme]);
      success('主题保存成功');
    } catch (err) {
      console.error('Failed to save theme:', err);
      toastError('保存主题失败');
    }
  }, [tuning, success, toastError]);

  // Delete custom theme handler
  const handleDeleteCustomTheme = useCallback(async (id: string) => {
    try {
      await deleteUmlTheme(id);
      setCustomThemes(prev => prev.filter(t => t.id !== id));
      
      // Reset to default theme if the deleted one was active
      if (theme === id) {
        setTheme('default');
        // Also reset tuning to default or empty
        setTuning({});
      }
      success('主题删除成功');
    } catch (err) {
      console.error('Failed to delete theme:', err);
      toastError('删除主题失败');
    }
  }, [theme, success, toastError]);

  const handleScaleChange = useCallback((newScale: 1 | 2 | 3 | 4) => {
    let res: UmlStylerConfig['export_resolution'] = 'Default';
    if (newScale === 2) res = 'X2';
    if (newScale === 3) res = 'X3';
    if (newScale === 4) res = 'X4';
    
    if (isDesktop) {
      setConfig(prev => ({ ...prev, export_resolution: res }));
    }
  }, [isDesktop]);

  const handleConfigSave = useCallback((newConfig: UmlStylerConfig) => {
    setConfig(newConfig);
    success('配置保存成功');
  }, [success]);
  return (
    <>
      <Header title="UML Styler" />
      <OfflineIndicator engine={engine} />
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
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded transition-colors"
                    title="设置"
                  >
                    <Settings className="w-4 h-4" />
                    <span>设置</span>
                  </button>
                
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
                scale={
                  config.export_resolution === 'Default' ? 1 :
                  config.export_resolution === 'X2' ? 2 :
                  config.export_resolution === 'X3' ? 3 :
                  config.export_resolution === 'X4' ? 4 : 2
                }
                onScaleChange={handleScaleChange}
                tuning={tuning}
                onTuningChange={handleTuningChange}
                onError={handleError}
                onThemeChange={handleThemeChange}
                customThemes={customThemes}
                onDeleteCustomTheme={handleDeleteCustomTheme}
                onSaveTheme={() => setShowSaveThemeModal(true)}
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
      
      {/* Save Theme Modal */}
      <SaveThemeModal
        isOpen={showSaveThemeModal}
        onClose={() => setShowSaveThemeModal(false)}
        onSave={handleSaveAsTheme}
        currentTuning={tuning}
        currentEngine={engine}
      />
      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        config={config}
        onSave={handleConfigSave}
      />
      
      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

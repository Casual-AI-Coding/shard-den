'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { analyzeComplexity } from '../lib/workers/complexity';
import ThemeSelector from './ThemeSelector';
import ThemeTuner from './ThemeTuner';
import ExportPanel from './ExportPanel';
import type { ThemeTuning } from '../types';
import { Save } from 'lucide-react';
import type { UmlTheme } from '@/lib/tauri';

// Worker message types
interface WorkerRequest {
  type: 'render';
  id: string;
  code: string;
  theme: string;
}

interface WorkerResponse {
  type: 'success' | 'error' | 'timeout';
  id: string;
  svg?: string;
  error?: string;
  simplified?: boolean;
}

interface PreviewProps {
  code: string;
  theme: string;
  engine: 'mermaid' | 'plantuml';
  tuning?: ThemeTuning;
  onTuningChange?: (tuning: ThemeTuning) => void;
  onError?: (error: string | null) => void;
  onThemeChange?: (theme: string) => void;
  onShare?: () => void;
  customThemes?: UmlTheme[];
  onDeleteCustomTheme?: (id: string) => void;
  onSaveTheme?: () => void;
}

// Mermaid theme mapping
const MERMAID_THEMES: Record<string, string> = {
  'default': 'default',
  'dark': 'dark',
  'forest': 'forest',
  'neutral': 'neutral',
};

export default function Preview({ code, theme, engine, tuning, onTuningChange, onError, onThemeChange, onShare, customThemes, onDeleteCustomTheme, onSaveTheme }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [scale, setScale] = useState<1 | 2 | 3 | 4>(2);
  const [showTuner, setShowTuner] = useState(false);
  const [complexity, setComplexity] = useState<{ nodeCount: number; isComplex: boolean } | null>(null);
  const [isSimplified, setIsSimplified] = useState(false);
  const [renderMethod, setRenderMethod] = useState<'main' | 'worker'>('main');

  const renderCountRef = useRef(0);
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Render on main thread (for simple diagrams)
  const renderOnMainThread = async (diagramCode: string) => {
    const mermaidTheme = MERMAID_THEMES[theme] || 'default';
    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme as any,
      securityLevel: 'loose',
    });

    const id = `mermaid-${Date.now()}-${++renderCountRef.current}`;
    const { svg: renderedSvg } = await mermaid.render(id, diagramCode);
    setSvg(renderedSvg);
  };

  // Render with Web Worker (for complex diagrams)
  const renderWithWorker = async (diagramCode: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Create worker using public path
      const worker = new Worker('/workers/mermaid.worker.js');
      workerRef.current = worker;

      const renderId = `mermaid-${Date.now()}-${++renderCountRef.current}`;
      const requestId = `${renderId}-${Math.random().toString(36).substr(2, 9)}`;

      // Set timeout for 5 seconds
      timeoutRef.current = setTimeout(() => {
        worker.terminate();
        workerRef.current = null;
        
        // Show simplified version
        setIsSimplified(true);
        setError('图表较大，渲染时间较长，已显示简化版');
        onError?.('图表较大，已简化显示');
        
        // Try to render on main thread
        renderOnMainThread(diagramCode).then(resolve).catch(reject);
      }, 5000);

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        worker.terminate();
        workerRef.current = null;

        if (event.data.type === 'success') {
          setSvg(event.data.svg || '');
          resolve();
        } else {
          reject(new Error(event.data.error));
        }
      };

      worker.onerror = (err) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        worker.terminate();
        workerRef.current = null;
        reject(err);
      };

      const request: WorkerRequest = {
        type: 'render',
        id: requestId,
        code: diagramCode,
        theme,
      };

      worker.postMessage(request);
    });
  };

  const renderDiagram = useCallback(async () => {
    if (!code.trim()) {
      setSvg('');
      setError(null);
      onError?.(null);
      setComplexity(null);
      setIsSimplified(false);
      return;
    }

    // Analyze complexity
    const complexityResult = analyzeComplexity(code);
    setComplexity({ nodeCount: complexityResult.nodeCount, isComplex: complexityResult.isComplex });
    setIsSimplified(false);
    setRenderMethod(complexityResult.isComplex ? 'worker' : 'main');

    setIsRendering(true);
    setError(null);
    onError?.(null);

    // Cleanup previous worker and timeout
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      if (engine === 'mermaid') {
        // Use Web Worker for complex diagrams
        if (complexityResult.isComplex) {
          await renderWithWorker(code);
        } else {
          // Use main thread for simple diagrams
          await renderOnMainThread(code);
        }
      } else {
        const errMsg = 'PlantUML rendering will be implemented in Phase 2';
        setError(errMsg);
        onError?.(errMsg);
      }
    } catch (err: any) {
      console.error('Mermaid render error:', err);
      const errMsg = err.message || 'Failed to render diagram';
      setError(errMsg);
      onError?.(errMsg);
      setSvg('');
    } finally {
      setIsRendering(false);
    }
  }, [code, theme, engine, onError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      renderDiagram();
    }, 300);

    return () => clearTimeout(timer);
  }, [renderDiagram]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleZoomIn = () => setZoom(z => Math.min(z + 25, 300));
  const handleZoomOut = () => setZoom(z => Math.max(z - 25, 25));
  const handleZoomFit = () => setZoom(100);
  
  const handleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.parentElement?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-[var(--surface)]">
      {/* Header Toolbar - 主题 + 缩放控制 */}
      <div className="h-12 px-4 bg-[var(--bg)] border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[var(--text)]">预览</span>
          {isRendering && (
            <span className="text-xs text-blue-400 animate-pulse">
              {renderMethod === 'worker' ? '大图渲染中...' : '渲染中...'}
            </span>
          )}
          {isSimplified && (
            <span className="text-xs text-amber-500">简化版</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ThemeSelector 
            theme={theme} 
            onThemeChange={onThemeChange || (() => {})} 
            engine={engine}
            customThemes={customThemes}
            onDeleteCustomTheme={onDeleteCustomTheme}
          />
          
          {/* Theme tuner popup */}
          <div className="relative">
            <button
              onClick={() => setShowTuner(!showTuner)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded transition-colors ${
                showTuner 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
              }`}
              title="微调"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>微调</span>
            </button>
            {showTuner && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowTuner(false)}
                />
                <div className="absolute right-0 bottom-full mb-1 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-50 p-4">
                  <ThemeTuner 
                    tuning={tuning || {}} 
                    onTuningChange={onTuningChange || (() => {})} 
                  />
                  {onSaveTheme && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)]">
                      <button
                        onClick={() => {
                          onSaveTheme();
                          setShowTuner(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>保存为新主题</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border-l border-[var(--border)] pl-3">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded transition-colors cursor-pointer"
              title="缩小"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-sm text-[var(--text-secondary)] w-12 text-center">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded transition-colors cursor-pointer"
              title="放大"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={handleZoomFit}
              className="px-2 py-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded transition-colors cursor-pointer"
              title="适应窗口"
            >
              适应
            </button>
            <button
              onClick={handleFullscreen}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded transition-colors cursor-pointer"
              title="全屏"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto relative">
        {isRendering && (
          <div className="absolute inset-0 bg-[var(--surface)]/80 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-[var(--text-secondary)] text-sm">正在渲染...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center bg-red-500/10 p-6 rounded-lg border border-red-500/30 max-w-md">
              <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-medium text-red-800 mb-2">渲染错误</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* SVG Container */}
        {!error && svg && (
          <div 
            className="mermaid-preview p-4 flex items-center justify-center min-h-full"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
          >
            <div 
              dangerouslySetInnerHTML={{ __html: svg }}
              className="transition-transform duration-200"
            />
          </div>
        )}

        {/* Empty State */}
        {!error && !svg && !isRendering && (
          <div className="h-full flex items-center justify-center text-[var(--text-secondary)]">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <p className="text-lg">无图表显示</p>
              <p className="text-sm mt-1">在编辑器中输入代码以查看预览</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Toolbar - 分享 + 导出 + 分辨率 */}
      <div className="h-12 px-4 bg-[var(--bg)] border-t border-[var(--border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={onShare}
            className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded transition-colors cursor-pointer"
          >
            分享
          </button>
        </div>
        <div className="flex items-center gap-3">
          {/* Resolution selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">分辨率:</span>
            <select
              value={scale}
              onChange={(e) => setScale(Number(e.target.value) as 1 | 2 | 3 | 4)}
              className="px-2 py-1 text-sm bg-[var(--surface)] border border-[var(--border)] rounded hover:border-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={3}>3x</option>
              <option value={4}>4x</option>
            </select>
          </div>
          {/* Export */}
          <ExportPanel code={code} theme={theme} engine={engine} scale={scale} />
        </div>
      </div>
    </div>
  );
}

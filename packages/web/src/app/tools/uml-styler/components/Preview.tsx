'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import ThemeSelector from './ThemeSelector';
import ExportPanel from './ExportPanel';

interface PreviewProps {
  code: string;
  theme: string;
  engine: 'mermaid' | 'plantuml';
  onError?: (error: string | null) => void;
  onThemeChange?: (theme: string) => void;
  onShare?: () => void;
}

// Mermaid theme mapping
const MERMAID_THEMES: Record<string, string> = {
  'default': 'default',
  'dark': 'dark',
  'forest': 'forest',
  'neutral': 'neutral',
};

export default function Preview({ code, theme, engine, onError, onThemeChange, onShare }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [scale, setScale] = useState<1 | 2 | 3 | 4>(2);
  const renderCountRef = useRef(0);

  const renderDiagram = useCallback(async () => {
    if (!code.trim()) {
      setSvg('');
      setError(null);
      onError?.(null);
      return;
    }

    setIsRendering(true);
    setError(null);
    onError?.(null);

    try {
      if (engine === 'mermaid') {
        const mermaidTheme = MERMAID_THEMES[theme] || 'default';
        mermaid.initialize({
          startOnLoad: false,
          theme: mermaidTheme as any,
          securityLevel: 'loose',
        });

        const id = `mermaid-${Date.now()}-${++renderCountRef.current}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        setSvg(renderedSvg);
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
    <div ref={containerRef} className="h-full flex flex-col bg-white">
      {/* Header Toolbar - 主题 + 缩放控制 */}
      <div className="h-12 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-700">预览</span>
          {isRendering && (
            <span className="text-xs text-blue-500 animate-pulse">渲染中...</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Theme selector */}
          <ThemeSelector theme={theme} onThemeChange={onThemeChange || (() => {})} />
          
          {/* Zoom controls */}
          <div className="flex items-center gap-1 border-l border-slate-300 pl-3">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors cursor-pointer"
              title="缩小"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-sm text-slate-600 w-12 text-center">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors cursor-pointer"
              title="放大"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={handleZoomFit}
              className="px-2 py-1 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors cursor-pointer"
              title="适应窗口"
            >
              适应
            </button>
            <button
              onClick={handleFullscreen}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors cursor-pointer"
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
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-slate-500 text-sm">正在渲染...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center bg-red-50 p-6 rounded-lg border border-red-200 max-w-md">
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
          <div className="h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <p className="text-lg">无图表显示</p>
              <p className="text-sm mt-1">在编辑器中输入代码以查看预览</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Toolbar - 分享 + 导出 + 分辨率 */}
      <div className="h-12 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={onShare}
            className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors cursor-pointer"
          >
            分享
          </button>
        </div>
        <div className="flex items-center gap-3">
          {/* Resolution selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">分辨率:</span>
            <select
              value={scale}
              onChange={(e) => setScale(Number(e.target.value) as 1 | 2 | 3 | 4)}
              className="px-2 py-1 text-sm bg-white border border-slate-300 rounded hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
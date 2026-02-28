'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';

interface PreviewProps {
  code: string;
  theme: string;
  engine: 'mermaid' | 'plantuml';
}

// Mermaid 主题映射
const MERMAID_THEMES: Record<string, string> = {
  'default': 'default',
  'dark': 'dark',
  'forest': 'forest',
  'neutral': 'neutral',
};

export default function Preview({ code, theme, engine }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const renderCountRef = useRef(0);

  const renderDiagram = useCallback(async () => {
    if (!code.trim()) {
      setSvg('');
      setError(null);
      return;
    }

    setIsRendering(true);
    setError(null);

    try {
      if (engine === 'mermaid') {
        // 更新 mermaid 主题
        const mermaidTheme = MERMAID_THEMES[theme] || 'default';
        mermaid.initialize({
          startOnLoad: false,
          theme: mermaidTheme as any,
          securityLevel: 'loose',
        });

        // 生成唯一 ID 避免缓存问题
        const id = `mermaid-${Date.now()}-${++renderCountRef.current}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        setSvg(renderedSvg);
      } else {
        // PlantUML - Phase 2 实现
        setError('PlantUML rendering will be implemented in Phase 2');
      }
    } catch (err: any) {
      console.error('Mermaid render error:', err);
      setError(err.message || 'Failed to render diagram');
      setSvg('');
    } finally {
      setIsRendering(false);
    }
  }, [code, theme, engine]);

  // 防抖渲染
  useEffect(() => {
    const timer = setTimeout(() => {
      renderDiagram();
    }, 300);

    return () => clearTimeout(timer);
  }, [renderDiagram]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 border-b bg-gray-50 text-sm font-medium flex items-center justify-between">
        <span>Preview</span>
        {isRendering && (
          <span className="text-blue-500">Rendering...</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto relative">
        {/* Loading overlay */}
        {isRendering && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <div className="text-gray-500">Rendering...</div>
          </div>
        )}

        {/* Error Panel */}
        {error && (
          <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-red-500 text-lg">⚠️</span>
              <div>
                <h4 className="font-medium text-red-800">Render Error</h4>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* SVG Container */}
        {!error && svg && (
          <div 
            ref={containerRef}
            className="p-4 flex items-center justify-center min-h-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}

        {/* Empty State */}
        {!error && !svg && !isRendering && (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-lg">No diagram to display</p>
              <p className="text-sm mt-1">Enter code in the editor to see the preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

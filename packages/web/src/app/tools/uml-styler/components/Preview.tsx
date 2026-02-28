'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';

interface PreviewProps {
  code: string;
  theme: string;
  engine: 'mermaid' | 'plantuml';
  onError?: (error: string | null) => void;
}

// Mermaid theme mapping
const MERMAID_THEMES: Record<string, string> = {
  'default': 'default',
  'dark': 'dark',
  'forest': 'forest',
  'neutral': 'neutral',
};

export default function Preview({ code, theme, engine, onError }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
        // Update mermaid theme
        const mermaidTheme = MERMAID_THEMES[theme] || 'default';
        mermaid.initialize({
          startOnLoad: false,
          theme: mermaidTheme as any,
          securityLevel: 'loose',
        });

        // Generate unique ID to avoid cache issues
        const id = `mermaid-${Date.now()}-${++renderCountRef.current}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        setSvg(renderedSvg);
      } else {
        // PlantUML - Phase 2
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

  // Debounced render
  useEffect(() => {
    const timer = setTimeout(() => {
      renderDiagram();
    }, 300);

    return () => clearTimeout(timer);
  }, [renderDiagram]);

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(z + 25, 300));
  const handleZoomOut = () => setZoom(z => Math.max(z - 25, 25));
  const handleZoomFit = () => setZoom(100);
  
  // Fullscreen handler
  const handleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Export handlers
  const handleExport = async (format: 'png' | 'svg' | 'pdf') => {
    const svgElement = document.querySelector('.mermaid-preview svg') as SVGSVGElement;
    if (!svgElement) {
      alert('No diagram to export');
      return;
    }

    try {
      if (format === 'svg') {
        const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
        const bbox = svgElement.getBBox();
        const width = bbox.width + bbox.x;
        const height = bbox.height + bbox.y;
        
        clonedSvg.setAttribute('width', String(width));
        clonedSvg.setAttribute('height', String(height));
        clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `diagram-${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === 'png') {
        const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
        const bbox = svgElement.getBBox();
        const width = bbox.width + bbox.x;
        const height = bbox.height + bbox.y;
        
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        
        clonedSvg.setAttribute('width', String(width));
        clonedSvg.setAttribute('height', String(height));
        clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        // Add background
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', 'white');
        clonedSvg.insertBefore(background, clonedSvg.firstChild);
        
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);
        
        const canvas = document.createElement('canvas');
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          alert('Failed to create canvas context');
          return;
        }
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, scaledWidth, scaledHeight);
        
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
            URL.revokeObjectURL(url);
            
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }
              
              const pngUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = pngUrl;
              link.download = `diagram-${Date.now()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(pngUrl);
              resolve();
            }, 'image/png');
          };
          
          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load SVG'));
          };
          
          img.src = url;
        });
      } else if (format === 'pdf') {
        alert('PDF export will be available in Phase 2');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert(`Export failed: ${err}`);
    }
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-white">
      {/* Zoom Controls */}
      <div className="h-12 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">预览</span>
          {isRendering && (
            <span className="text-xs text-blue-500 animate-pulse">渲染中...</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
            title="Zoom out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-sm text-slate-600 w-12 text-center">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
            title="Zoom in"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={handleZoomFit}
            className="px-2 py-1 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors ml-1"
            title="Fit to window"
          >
            适应
          </button>
          <button
            onClick={handleFullscreen}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors ml-1"
            title="Fullscreen"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto relative">
        {/* Loading overlay */}
        {isRendering && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-slate-500 text-sm">正在渲染...</p>
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

      {/* Export Toolbar */}
      <div className="h-12 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('png')}
            disabled={!svg}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            PNG
          </button>
          <button
            onClick={() => handleExport('svg')}
            disabled={!svg}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            SVG
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!svg}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            PDF
          </button>
        </div>
        
        {/* Resolution selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">分辨率:</span>
          <select
            value={scale}
            onChange={(e) => setScale(Number(e.target.value) as 1 | 2 | 3 | 4)}
            className="px-2 py-1 text-sm bg-white border border-slate-300 rounded hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={3}>3x</option>
            <option value={4}>4x</option>
          </select>
        </div>
      </div>
    </div>
  );
}

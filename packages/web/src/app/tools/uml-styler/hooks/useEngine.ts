'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import mermaid from 'mermaid';
import { UmlStyler } from '@/lib/core';
import { analyzeComplexity } from '../lib/workers/complexity';

export type EngineType = 'mermaid' | 'plantuml' | 'd2' | 'graphviz' | 'wavedrom';

// Mermaid theme mapping
const MERMAID_THEMES: Record<string, string> = {
  'default': 'default',
  'dark': 'dark',
  'forest': 'forest',
  'neutral': 'neutral',
};

interface RenderResult {
  svg: string;
  error: string | null;
  isSimplified: boolean;
  complexity: { nodeCount: number; isComplex: boolean } | null;
}

interface WorkerResponse {
  type: 'success' | 'error' | 'timeout';
  id: string;
  svg?: string;
  error?: string;
}

export function useDiagramRenderer() {
  const [isRendering, setIsRendering] = useState(false);
  const [renderResult, setRenderResult] = useState<RenderResult>({
    svg: '',
    error: null,
    isSimplified: false,
    complexity: null,
  });
  
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const renderCountRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) workerRef.current.terminate();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const renderOnMainThread = async (code: string, theme: string) => {
    const mermaidTheme = MERMAID_THEMES[theme] || 'default';
    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme as any,
      securityLevel: 'loose',
    });
    const id = `mermaid-${Date.now()}-${++renderCountRef.current}`;
    const { svg } = await mermaid.render(id, code);
    return svg;
  };

  const renderWithWorker = async (code: string, theme: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Use the public path to the worker
      const worker = new Worker('/workers/mermaid.worker.js');
      workerRef.current = worker;

      const renderId = `mermaid-${Date.now()}-${++renderCountRef.current}`;
      const requestId = `${renderId}-${Math.random().toString(36).substr(2, 9)}`;

      timeoutRef.current = setTimeout(() => {
        worker.terminate();
        workerRef.current = null;
        reject(new Error('TIMEOUT'));
      }, 5000);

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        worker.terminate();
        workerRef.current = null;

        if (event.data.type === 'success') {
          resolve(event.data.svg || '');
        } else {
          reject(new Error(event.data.error));
        }
      };

      worker.onerror = (err) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        worker.terminate();
        workerRef.current = null;
        reject(err);
      };

      worker.postMessage({
        type: 'render',
        id: requestId,
        code,
        theme,
      });
    });
  };

  const render = useCallback(async (code: string, theme: string, engine: string) => {
    if (!code.trim()) {
      setRenderResult(prev => ({ ...prev, svg: '', error: null, isSimplified: false }));
      return;
    }

    setIsRendering(true);
    setRenderResult(prev => ({ ...prev, error: null }));

    // Cleanup previous worker/timeout
    if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
    }
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }

    try {
      // Analyze complexity
      const complexityResult = analyzeComplexity(code);
      setRenderResult(prev => ({ ...prev, complexity: complexityResult, isSimplified: false }));

      // Get hint from WASM backend
      // Note: UmlStyler.render returns the RenderHint object or string
      const hint = await UmlStyler.render(engine, code, theme);

      let svg = '';
      if (hint === 'FrontendJS') {
        if (complexityResult.isComplex) {
          try {
            svg = await renderWithWorker(code, theme);
          } catch (err: any) {
            if (err.message === 'TIMEOUT') {
               // Fallback to main thread with simplified flag
               setRenderResult(prev => ({ ...prev, isSimplified: true, error: '图表较大，渲染时间较长，已显示简化版' }));
               // Try to render on main thread anyway, it might freeze UI briefly but better than nothing?
               // Or maybe we don't render on main thread if worker timed out?
               // Preview.tsx logic was: setIsSimplified(true) -> renderOnMainThread().
               svg = await renderOnMainThread(code, theme);
            } else {
               throw err;
            }
          }
        } else {
          svg = await renderOnMainThread(code, theme);
        }
      } else if (typeof hint === 'object' && 'ServerURL' in hint) {
         const url = (hint as any).ServerURL;
         const response = await fetch(url);
         if (!response.ok) throw new Error(`Server rendering failed: ${response.statusText}`);
         svg = await response.text();
         if (!svg.includes('<svg')) throw new Error('Invalid SVG response from server');
      } else {
         throw new Error(`Unsupported render mode: ${JSON.stringify(hint)}`);
      }
      
      setRenderResult(prev => ({ ...prev, svg, error: null }));
    } catch (err: any) {
      console.error('Render error:', err);
      const errMsg = err.message || 'Render failed';
      setRenderResult(prev => ({ ...prev, error: errMsg, svg: '' }));
    } finally {
      setIsRendering(false);
    }
  }, []);

  return {
    render,
    isRendering,
    ...renderResult
  };
}

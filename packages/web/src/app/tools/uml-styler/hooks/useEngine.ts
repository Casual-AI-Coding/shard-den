'use client';

import { useState, useCallback } from 'react';
import { UmlStyler } from '@/lib/core';

export type EngineType = 'mermaid' | 'plantuml' | 'd2';

export interface UseEngineReturn {
  engine: EngineType;
  setEngine: (engine: EngineType) => void;
  handleEngineChange: (engine: EngineType) => void;
  isEngineReady: boolean;
  initializeEngine: () => Promise<void>;
  renderDiagram: (code: string, theme: string) => Promise<string>;
}

export function useEngine(initialEngine: EngineType = 'mermaid'): UseEngineReturn {
  const [engine, setEngine] = useState<EngineType>(initialEngine);
  const [isEngineReady, setIsEngineReady] = useState(false);

  const handleEngineChange = useCallback((newEngine: EngineType) => {
    setEngine(newEngine);
  }, []);

  const initializeEngine = useCallback(async () => {
    try {
      const mermaid = await import('mermaid');
      mermaid.default.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
      });
      setIsEngineReady(true);
    } catch (error) {
      console.error('Failed to initialize mermaid:', error);
      throw error;
    }
  }, []);

  const renderDiagram = useCallback(async (code: string, theme: string): Promise<string> => {
    if (!code.trim()) {
      return '';
    }

    try {
      // Call Rust Core via WASM to get rendering hint
      // Note: Rust returns serialized RenderHint
      const hint = await UmlStyler.render(engine, code, theme);

      if (hint === 'FrontendJS') {
        // Frontend rendering (Mermaid)
        const mermaid = await import('mermaid');
        
        // Map theme to Mermaid theme
        const mermaidTheme = theme === 'dark' ? 'dark' 
          : theme === 'forest' ? 'forest' 
          : theme === 'neutral' ? 'neutral' 
          : 'default';

        mermaid.default.initialize({
          startOnLoad: false,
          theme: mermaidTheme as any,
          securityLevel: 'loose',
        });

        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.default.render(id, code);
        return svg;
      } 
      else if (typeof hint === 'object' && 'ServerURL' in hint) {
        // Server-side rendering (PlantUML, D2)
        const url = hint.ServerURL;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Server rendering failed: ${response.statusText}`);
        }
        const svg = await response.text();
        // Check if response is valid SVG
        if (!svg.includes('<svg')) {
            throw new Error('Invalid SVG response from server');
        }
        return svg;
      }
      else {
        throw new Error(`Unsupported render hint: ${JSON.stringify(hint)}`);
      }
    } catch (err: any) {
      console.error(`${engine} render error:`, err);
      // Fallback for offline or WASM failure?
      // For now, rethrow
      throw err;
    }
  }, [engine]);

  return {
    engine,
    setEngine,
    handleEngineChange,
    isEngineReady,
    initializeEngine,
    renderDiagram,
  };
}

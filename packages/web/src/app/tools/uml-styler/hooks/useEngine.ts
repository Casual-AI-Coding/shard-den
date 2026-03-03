'use client';

import { useState, useCallback } from 'react';

export type EngineType = 'mermaid' | 'plantuml';

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

    if (engine === 'mermaid') {
      const mermaid = await import('mermaid');
      
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
    } else {
      // PlantUML placeholder
      throw new Error('PlantUML rendering will be implemented in Phase 2');
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

/**
 * Mermaid Web Worker - Offload heavy rendering to background thread
 * 
 * Handles large diagram rendering (>100 nodes) to avoid blocking main thread
 */

import mermaid from 'mermaid';

// Initialize mermaid in worker context
const initializeMermaid = (theme) => {
  const MERMAID_THEMES = {
    'default': 'default',
    'dark': 'dark',
    'forest': 'forest',
    'neutral': 'neutral',
  };

  const mermaidTheme = MERMAID_THEMES[theme] || 'default';
  
  mermaid.initialize({
    startOnLoad: false,
    theme: mermaidTheme,
    securityLevel: 'loose',
  });
};

// Handle messages from main thread
self.onmessage = async (event) => {
  const { type, id, code, theme } = event.data;

  if (type === 'render') {
    try {
      initializeMermaid(theme);
      
      const renderId = `mermaid-worker-${id}`;
      const { svg } = await mermaid.render(renderId, code);
      
      const response = {
        type: 'success',
        id,
        svg,
      };
      
      self.postMessage(response);
    } catch (error) {
      const response = {
        type: 'error',
        id,
        error: error.message || 'Failed to render diagram',
      };
      
      self.postMessage(response);
    }
  }
};

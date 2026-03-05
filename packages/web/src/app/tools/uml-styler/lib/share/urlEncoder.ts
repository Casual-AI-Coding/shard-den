import type { ThemeTuning } from '../../types';

export interface ShareState {
  code: string;
  engine: 'mermaid' | 'plantuml';
  theme: string;
  tuning?: ThemeTuning;
}

/**
 * Generate a shareable URL from state
 */
export function generateShareUrl(state: ShareState): string {
  const { code, engine, theme, tuning } = state;
  
  // Create a minimal state object
  const shareState: Record<string, string> = {
    code: btoa(encodeURIComponent(code)),
    engine,
    theme,
  };
  
  // Add tuning if present
  if (tuning && Object.keys(tuning).length > 0) {
    shareState.tuning = btoa(encodeURIComponent(JSON.stringify(tuning)));
  }
  
  // Build URL
  const params = new URLSearchParams(shareState);
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}`
    : '/tools/uml-styler';
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Parse a share URL back to state
 */
export function parseShareUrl(url: string): ShareState | null {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    const code = params.get('code');
    const engine = params.get('engine') as 'mermaid' | 'plantuml' | null;
    const theme = params.get('theme');
    const tuningStr = params.get('tuning');
    
    if (!code || !engine || !theme) {
      return null;
    }
    
    const tuning = tuningStr ? JSON.parse(decodeURIComponent(atob(tuningStr))) : undefined;
    
    return {
      code: decodeURIComponent(atob(code)),
      engine,
      theme,
      tuning,
    };
  } catch {
    return null;
  }
}

/**
 * Platform detection utilities
 * Web is stateless, Desktop has local storage via Tauri
 */

// Check if running in Tauri (Desktop)
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI__' in window;
}

// Check if running in browser
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// Get platform info
export function getPlatform(): 'web' | 'desktop' {
  return isDesktop() ? 'desktop' : 'web';
}

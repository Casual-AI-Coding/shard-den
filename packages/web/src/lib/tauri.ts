/**
 * Tauri API bindings for Desktop features
 * These functions only work in Tauri (Desktop) environment
 */

import { isDesktop } from './platform';

export interface HistoryEntry {
  id: string;
  tool: string;
  input: string;
  output: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export interface Config {
  theme: 'light' | 'dark' | 'system';
  history: {
    max_entries: number;
    auto_save: boolean;
  };
  [key: string]: unknown;
}

/**
 * Dynamically import Tauri invoke to avoid build errors in web mode
 */
async function getInvoke() {
  if (!isDesktop()) {
    return null;
  }
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke;
  } catch {
    return null;
  }
}

/**
 * Check if running in Tauri environment
 */
export function isTauri(): boolean {
  return isDesktop();
}

/**
 * Get app version from Tauri
 */
export async function getVersion(): Promise<string> {
  const invoke = await getInvoke();
  if (!invoke) {
    throw new Error('Not running in Tauri environment');
  }
  return invoke<string>('get_version');
}

/**
 * Save configuration (Desktop only)
 */
export async function saveConfig(config: Config): Promise<void> {
  const invoke = await getInvoke();
  if (!invoke) {
    console.warn('saveConfig: Not in Tauri environment, skipping');
    return;
  }
  return invoke('save_config', { config });
}

/**
 * Load configuration (Desktop only)
 */
export async function loadConfig(): Promise<Config> {
  const invoke = await getInvoke();
  if (!invoke) {
    console.warn('loadConfig: Not in Tauri environment, skipping');
    return getDefaultConfig();
  }
  return invoke<Config>('load_config');
}

/**
 * Save history entry (Desktop only)
 */
export async function saveHistory(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): Promise<void> {
  const invoke = await getInvoke();
  if (!invoke) {
    console.warn('saveHistory: Not in Tauri environment, skipping');
    return;
  }
  
  const fullEntry: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  
  return invoke('save_history', { entry: fullEntry });
}

/**
 * Load history entries (Desktop only)
 */
export async function loadHistory(tool?: string, limit: number = 100): Promise<HistoryEntry[]> {
  const invoke = await getInvoke();
  if (!invoke) {
    console.warn('loadHistory: Not in Tauri environment, skipping');
    return [];
  }
  
  return invoke<HistoryEntry[]>('load_history', { tool, limit });
}

/**
 * Clear all history (Desktop only)
 */
export async function clearHistory(): Promise<void> {
  const invoke = await getInvoke();
  if (!invoke) {
    console.warn('clearHistory: Not in Tauri environment, skipping');
    return;
  }
  
  return invoke('clear_history');
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): Config {
  return {
    theme: 'dark',
    history: {
      max_entries: 1000,
      auto_save: true,
    },
  };
}

/**
 * Save extraction to history (convenience function)
 * Call this after successful extraction in Desktop mode
 */
export async function saveExtractionHistory(
  jsonInput: string,
  paths: string,
  output: string,
  format: string
): Promise<void> {
  return saveHistory({
    tool: 'json-extractor',
    input: jsonInput,
    output,
    metadata: { paths, format },
  });
}

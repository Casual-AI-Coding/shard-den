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
 * Clear history entries (Desktop only)
 * @param tool - Optional tool name to clear only history for that tool
 */
export async function clearHistory(tool?: string): Promise<void> {
  const invoke = await getInvoke();
  if (!invoke) {
    console.warn('clearHistory: Not in Tauri environment, skipping');
    return;
  }
  
  return invoke('clear_history', { tool: tool || null });
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


/**
 * Save UML Styler to history (convenience function)
 * Call this after successful rendering in Desktop mode
 */
export async function saveUmlHistory(
  code: string,
  engine: string,
  theme: string,
  output?: string
): Promise<void> {
  return saveHistory({
    tool: 'uml-styler',
    input: code,
    output: output || '',
    metadata: { engine, theme },
  });
}

// ==================== UML Styler Types ====================

export interface UmlTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
  engine: string;
  created_at: string;
  updated_at: string;
}

export interface UmlTheme {
  id: string;
  name: string;
  description: string;
  theme_type: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UmlStylerConfig {
  default_theme: string;
  default_engine: 'Mermaid' | 'PlantUML' | 'D2' | 'Graphviz' | 'WaveDrom';
  export_resolution: 'Default' | 'X2' | 'X3' | 'X4' | { Custom: number };
  auto_save: boolean;
  auto_save_interval_secs: number;
}

// ==================== UML Styler Storage Functions ====================

/**
 * Save a UML template (Desktop only)
 */
export async function saveUmlTemplate(template: UmlTemplate): Promise<void> {
  const invoke = await getInvoke();
  if (!invoke) {
    console.warn('saveUmlTemplate: Not in Tauri environment, skipping');
    return;
  }
  return invoke('save_uml_template', { template });
}

/**
 * Load all UML templates (Desktop only)
 */
export async function loadUmlTemplates(): Promise<UmlTemplate[]> {
  const invoke = await getInvoke();
  if (!invoke) {
    console.warn('loadUmlTemplates: Not in Tauri environment, skipping');
    return [];
  }
  return invoke<UmlTemplate[]>('load_uml_templates');
}

/**
 * Delete a UML template by ID (Desktop only)
 */
export async function deleteUmlTemplate(id: string): Promise<void> {
  const invoke = await getInvoke();
  if (!invoke) {
    console.warn('deleteUmlTemplate: Not in Tauri environment, skipping');
    return;
  }
  return invoke('delete_uml_template', { id });
}

/**
 * Save a custom UML theme (Desktop only)
 */
export async function saveUmlTheme(theme: UmlTheme): Promise<void> {
  const invoke = await getInvoke();
  if (!invoke) {
    console.warn('saveUmlTheme: Not in Tauri environment, skipping');
    return;
  }
  return invoke('save_uml_theme', { theme });
}

/**
 * Load all custom UML themes (Desktop only)
 */
export async function loadUmlThemes(): Promise<UmlTheme[]> {
  const invoke = await getInvoke();
  if (!invoke) {
    console.warn('loadUmlThemes: Not in Tauri environment, skipping');
    return [];
  }
  return invoke<UmlTheme[]>('load_uml_themes');
}

/**
 * Delete a custom UML theme by ID (Desktop only)
 */
export async function deleteUmlTheme(id: string): Promise<void> {
  const invoke = await getInvoke();
  if (!invoke) {
    console.warn('deleteUmlTheme: Not in Tauri environment, skipping');
    return;
  }
  return invoke('delete_uml_theme', { id });
}

/**
 * Save UML Styler configuration (Desktop only)
 */
export async function saveUmlConfig(config: UmlStylerConfig): Promise<void> {
  const invoke = await getInvoke();
  if (!invoke) {
    console.warn('saveUmlConfig: Not in Tauri environment, skipping');
    return;
  }
  return invoke('save_uml_config', { config });
}

/**
 * Load UML Styler configuration (Desktop only)
 */
export async function loadUmlConfig(): Promise<UmlStylerConfig> {
  const invoke = await getInvoke();
  if (!invoke) {
    console.warn('loadUmlConfig: Not in Tauri environment, skipping');
    return getDefaultUmlConfig();
  }
  return invoke<UmlStylerConfig>('load_uml_config');
}

/**
 * Get default UML Styler configuration
 */
export function getDefaultUmlConfig(): UmlStylerConfig {
  return {
    default_theme: 'shared/default',
    default_engine: 'Mermaid',
    export_resolution: 'Default',
    auto_save: true,
    auto_save_interval_secs: 30,
  };
}

/**
 * Helper to create a new UML template
 */
export function createUmlTemplateInput(
  name: string,
  description: string,
  code: string,
  engine: string
): Omit<UmlTemplate, 'id' | 'created_at' | 'updated_at'> {
  return {
    name,
    description,
    code,
    engine,
  };
}

/**
 * Helper to create a new custom UML theme
 */
export function createUmlThemeInput(
  name: string,
  description: string,
  themeType: string,
  config: Record<string, unknown>
): Omit<UmlTheme, 'id' | 'created_at' | 'updated_at'> {
  return {
    name,
    description,
    theme_type: themeType,
    config,
  };
}


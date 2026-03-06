'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import type { UmlTheme } from '@/lib/tauri';

import { ThemeTuning } from '../types';

interface ThemeSelectorProps {
  theme: string;
  onThemeChange: (theme: string) => void;
  engine: 'mermaid' | 'plantuml' | 'd2' | 'graphviz' | 'wavedrom';
  customThemes?: UmlTheme[];
  onDeleteCustomTheme?: (id: string) => void;
}

// Mermaid 主题
const MERMAID_THEMES = [
  { id: 'default', name: 'Default', preview: '#3B82F6' },
  { id: 'dark', name: 'Dark', preview: '#1F2937' },
  { id: 'forest', name: 'Forest', preview: '#059669' },
  { id: 'neutral', name: 'Neutral', preview: '#6B7280' },
];

// D2 Themes
const D2_THEMES = [
  { id: '100', name: 'Neutral', preview: '#F3F4F6' },
  { id: '200', name: 'Dark', preview: '#1F2937' },
];

// Graphviz Themes (Layout engines)
const GRAPHVIZ_THEMES = [
  { id: 'graphviz/default', name: 'Dot (Default)', preview: '#3B82F6' },
  { id: 'graphviz/dot', name: 'Dot', preview: '#3B82F6' },
  { id: 'graphviz/neato', name: 'Neato', preview: '#10B981' },
  { id: 'graphviz/twopi', name: 'Twopi', preview: '#F59E0B' },
  { id: 'graphviz/fdp', name: 'Fdp', preview: '#8B5CF6' },
  { id: 'graphviz/sfdp', name: 'Sfdp', preview: '#EF4444' },
];

// PlantUML 官方主题
const PLANTUML_THEMES = [
  { id: 'cerulean', name: 'Cerulean', preview: '#033C73' },
  { id: 'sketchy', name: 'Sketchy', preview: '#333333' },
  { id: 'toy', name: 'Toy', preview: '#E0E0E0' },
  { id: 'vibrant', name: 'Vibrant', preview: '#1A1A1A' },
];

// WaveDrom Themes (Limited options)
const WAVEDROM_THEMES = [
  { id: 'wavedrom/default', name: 'Default', preview: '#3B82F6' },
];

// 共享主题（适用于两个引擎）
const SHARED_THEMES = [
  { id: 'shared/default', name: 'Default', preview: '#3B82F6', category: 'shared' },
  { id: 'shared/dark', name: 'Dark', preview: '#1F2937', category: 'shared' },
  { id: 'shared/business', name: 'Business Blue', preview: '#0066CC', category: 'shared' },
  { id: 'shared/sketchy', name: 'Sketchy', preview: '#9CA3AF', category: 'shared' },
  { id: 'shared/minimal', name: 'Minimal', preview: '#64748B', category: 'shared' },
  { id: 'shared/colorful', name: 'Colorful', preview: '#8B5CF6', category: 'shared' },
];
const EMPTY_THEMES: UmlTheme[] = [];

export default function ThemeSelector({ theme, onThemeChange, engine, customThemes = EMPTY_THEMES, onDeleteCustomTheme }: ThemeSelectorProps) {
  // 合并共享主题和引擎特定主题
  const engineThemes = engine === 'plantuml' ? PLANTUML_THEMES
    : engine === 'd2' ? D2_THEMES
    : engine === 'graphviz' ? GRAPHVIZ_THEMES
    : engine === 'wavedrom' ? WAVEDROM_THEMES
    : MERMAID_THEMES;
  const themes = [...SHARED_THEMES, ...engineThemes];

  // 如果切换引擎后当前主题不在列表中，重置为第一个主题
  React.useEffect(() => {
    if (!themes.find(t => t.id === theme)) {
      onThemeChange(themes[0].id);
    }
  }, [engine, theme, themes, onThemeChange]);

  const currentTheme = themes.find(t => t.id === theme) || themes[0];

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded transition-colors"
      >
        <span 
          className="w-3 h-3 rounded-full border border-slate-300"
          style={{ backgroundColor: currentTheme.preview }}
        />
        <span>{currentTheme.name}</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 max-h-[300px] overflow-y-auto">
        <div className="p-2">
          {/* Custom Themes */}
          {customThemes.length > 0 && (
            <div className="mb-2 pb-2 border-b border-[var(--border)]">
              <div className="text-xs text-[var(--text-secondary)] px-2 py-1 flex items-center justify-between">
                <span>自定义主题</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">自定义</span>
              </div>
              {customThemes.map((t) => (
                <div key={t.id} className="group/item relative flex items-center">
                  <button
                    onClick={() => onThemeChange(t.id)}
                    className={`flex-1 flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors ${
                      theme === t.id 
                        ? 'bg-purple-500/20 text-purple-400' 
                        : 'text-[var(--text)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <span 
                      className="w-3 h-3 rounded-full border border-slate-300"
                      style={{ backgroundColor: (t.config as ThemeTuning)?.primaryColor || '#8B5CF6' }}
                    />
                    <span className="truncate">{t.name}</span>
                  </button>
                  {onDeleteCustomTheme && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustomTheme(t.id);
                      }}
                      className="absolute right-1 p-1 text-[var(--text-secondary)] hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-opacity"
                      title="删除主题"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-[var(--text-secondary)] px-2 py-1">预设主题</div>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors ${
                theme === t.id 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'text-[var(--text)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <span 
                className="w-3 h-3 rounded-full border border-slate-300"
                style={{ backgroundColor: t.preview }}
              />
              <span>{t.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

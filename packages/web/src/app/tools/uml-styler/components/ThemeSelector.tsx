'use client';

import React from 'react';

interface ThemeSelectorProps {
  theme: string;
  onThemeChange: (theme: string) => void;
  engine: 'mermaid' | 'plantuml';
}

// Mermaid 主题
const MERMAID_THEMES = [
  { id: 'default', name: 'Default', preview: '#3B82F6' },
  { id: 'dark', name: 'Dark', preview: '#1F2937' },
  { id: 'forest', name: 'Forest', preview: '#059669' },
  { id: 'neutral', name: 'Neutral', preview: '#6B7280' },
];

// PlantUML 官方主题
const PLANTUML_THEMES = [
  { id: 'cerulean', name: 'Cerulean', preview: '#033C73' },
  { id: 'sketchy', name: 'Sketchy', preview: '#333333' },
  { id: 'toy', name: 'Toy', preview: '#E0E0E0' },
  { id: 'vibrant', name: 'Vibrant', preview: '#1A1A1A' },
];

export default function ThemeSelector({ theme, onThemeChange, engine }: ThemeSelectorProps) {
  // 根据引擎选择主题列表
  const themes = engine === 'plantuml' ? PLANTUML_THEMES : MERMAID_THEMES;
  
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
          className="w-3 h border border-3 rounded-full-slate-300"
          style={{ backgroundColor: currentTheme.preview }}
        />
        <span>{currentTheme.name}</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="p-2">
          <div className="text-xs text-[var(--text-secondary)] px-2 py-1">主题</div>
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

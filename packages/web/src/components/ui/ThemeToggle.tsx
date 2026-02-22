'use client';

import { useTheme, Theme } from '@/components/ThemeProvider';

const themeLabels: Record<Theme, string> = {
  light: '浅色',
  dark: '深色',
  tech: '科技',
};

const themeIcons: Record<Theme, string> = {
  light: '☀️',
  dark: '🌙',
  tech: '⚡',
};

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--hover)] transition-colors"
      title={`当前主题: ${themeLabels[theme]}，点击切换`}
    >
      <span className="text-sm">{themeIcons[theme]}</span>
      <span className="text-sm text-[var(--text-secondary)] hidden sm:inline">
        {themeLabels[theme]}
      </span>
    </button>
  );
}

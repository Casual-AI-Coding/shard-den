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
      aria-label={`当前主题: ${themeLabels[theme]}，点击切换到其他主题`}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
    >
      <span className="text-sm" aria-hidden="true">{themeIcons[theme]}</span>
      <span className="text-sm text-[var(--text-secondary)] hidden sm:inline">
        {themeLabels[theme]}
      </span>
    </button>
  );
}

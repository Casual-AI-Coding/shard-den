'use client';

interface ThemeSelectorProps {
  theme: string;
  onThemeChange: (theme: string) => void;
}

const THEMES = [
  { id: 'default', name: 'Default' },
  { id: 'dark', name: 'Dark' },
  { id: 'forest', name: 'Forest' },
  { id: 'neutral', name: 'Neutral' },
];

export default function ThemeSelector({ theme, onThemeChange }: ThemeSelectorProps) {
  return (
    <select
      value={theme}
      onChange={(e) => onThemeChange(e.target.value)}
      className="px-3 py-1 border rounded"
    >
      {THEMES.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}

'use client';

import { useState, useCallback } from 'react';
import type { ThemeTuning } from '../types';

export type ThemeType = 'default' | 'dark' | 'forest' | 'neutral' | 'toy';

export interface UseThemeReturn {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  handleThemeChange: (theme: ThemeType) => void;
  tuning: ThemeTuning;
  setTuning: (tuning: ThemeTuning) => void;
  handleTuningChange: (tuning: ThemeTuning) => void;
  resetTuning: () => void;
}

export function useTheme(initialTheme: ThemeType = 'default'): UseThemeReturn {
  const [theme, setTheme] = useState<ThemeType>(initialTheme);
  const [tuning, setTuning] = useState<ThemeTuning>({});

  const handleThemeChange = useCallback((newTheme: ThemeType) => {
    setTheme(newTheme);
  }, []);

  const handleTuningChange = useCallback((newTuning: ThemeTuning) => {
    setTuning(newTuning);
  }, []);

  const resetTuning = useCallback(() => {
    setTuning({});
  }, []);

  return {
    theme,
    setTheme,
    handleThemeChange,
    tuning,
    setTuning,
    handleTuningChange,
    resetTuning,
  };
}

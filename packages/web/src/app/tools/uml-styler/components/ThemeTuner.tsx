'use client';

import type { ThemeTuning } from '../types';
import React, { useMemo, useCallback } from 'react';


interface ThemeTunerProps {
  tuning: ThemeTuning;
  onTuningChange: (tuning: ThemeTuning) => void;
}

const FONT_OPTIONS = [
  { value: 'inherit', label: 'Default' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
];

const DEFAULT_TUNING: ThemeTuning = {
  primaryColor: '#3B82F6',
  fontFamily: 'inherit',
  fontSize: 14,
  lineWidth: 2,
  backgroundColor: '#FFFFFF',
};

export default function ThemeTuner({ tuning, onTuningChange }: ThemeTunerProps) {
  const currentTuning = useMemo(
    () => ({ ...DEFAULT_TUNING, ...tuning }),
    [tuning]
  );

  const handleChange = useCallback(
    (key: keyof ThemeTuning, value: string | number) => {
      onTuningChange({ ...tuning, [key]: value });
    },
    [tuning, onTuningChange]
  );

  const handleReset = () => {
    onTuningChange({});
  };

  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4">
      <h3 className="text-sm font-medium text-[var(--text)] mb-3">Theme Tuning</h3>
      
      <div className="space-y-4">
        {/* Primary Color */}
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Primary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentTuning.primaryColor}
              onChange={(e) => handleChange('primaryColor', e.target.value)}
              className="w-8 h-8 rounded border border-[var(--border)] cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={currentTuning.primaryColor}
              onChange={(e) => handleChange('primaryColor', e.target.value)}
              className="flex-1 text-sm border border-[var(--border)] rounded px-2 py-1.5 bg-[var(--bg)] text-[var(--text)]"
            />
          </div>
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Font Family</label>
          <select
            value={currentTuning.fontFamily}
            onChange={(e) => handleChange('fontFamily', e.target.value)}
            className="w-full text-sm border border-[var(--border)] rounded px-2 py-1.5 bg-[var(--bg)] text-[var(--text)]"
          >
            {FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">
            Font Size: {currentTuning.fontSize}px
          </label>
          <input
            type="range"
            min="10"
            max="24"
            step="1"
            value={currentTuning.fontSize}
            onChange={(e) => handleChange('fontSize', parseInt(e.target.value, 10))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-[var(--text-secondary)] mt-1">
            <span>10px</span>
            <span>24px</span>
          </div>
        </div>

        {/* Line Width */}
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">
            Line Width: {currentTuning.lineWidth}px
          </label>
          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={currentTuning.lineWidth}
            onChange={(e) => handleChange('lineWidth', parseFloat(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-[var(--text-secondary)] mt-1">
            <span>1px</span>
            <span>5px</span>
          </div>
        </div>

        {/* Background Color */}
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Background Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentTuning.backgroundColor}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              className="w-8 h-8 rounded border border-[var(--border)] cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={currentTuning.backgroundColor}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              className="flex-1 text-sm border border-[var(--border)] rounded px-2 py-1.5 bg-[var(--bg)] text-[var(--text)]"
            />
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full text-sm text-[var(--text-secondary)] hover:text-[var(--text)] py-1.5 border border-[var(--border)] rounded hover:bg-[var(--surface-hover)] transition-colors"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
}

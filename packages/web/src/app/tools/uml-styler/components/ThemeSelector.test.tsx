import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ThemeSelector from './ThemeSelector';
import { describe, it, expect, vi } from 'vitest';
import ThemeSelector from './ThemeSelector';

describe('ThemeSelector', () => {
  it('renders without crashing', () => {
    const handleThemeChange = vi.fn();
    render(
      <ThemeSelector 
        theme="default" 
        onThemeChange={handleThemeChange} 
      />
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays all themes', () => {
    const handleThemeChange = vi.fn();
    render(
      <ThemeSelector 
        theme="default" 
        onThemeChange={handleThemeChange} 
      />
    );
    expect(screen.getByRole('option', { name: 'Default' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Dark' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Forest' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Neutral' })).toBeInTheDocument();
  });

  it('calls onThemeChange when selection changes', () => {
    const handleThemeChange = vi.fn();
    render(
      <ThemeSelector 
        theme="default" 
        onThemeChange={handleThemeChange} 
      />
    );
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'dark' } });
    
    expect(handleThemeChange).toHaveBeenCalledWith('dark');
  });
});
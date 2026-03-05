import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ThemeSelector from './ThemeSelector';

describe('ThemeSelector', () => {
  it('renders without crashing', () => {
    const handleThemeChange = vi.fn();
    render(
      <ThemeSelector 
        theme="default" 
        onThemeChange={handleThemeChange} 
        engine="mermaid"

      />
    );
    // Component uses buttons, check for the theme button exists
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('displays theme button', () => {
    const handleThemeChange = vi.fn();
    render(
      <ThemeSelector 
        theme="default" 
        onThemeChange={handleThemeChange} 
        engine="mermaid"

      />
    );
    // Check that there are buttons (theme selector uses button elements)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('has button elements for interaction', () => {
    const handleThemeChange = vi.fn();
    render(
      <ThemeSelector 
        theme="default" 
        onThemeChange={handleThemeChange} 
        engine="mermaid"

      />
    );
    
    // The component uses buttons in a dropdown, check for button role
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});

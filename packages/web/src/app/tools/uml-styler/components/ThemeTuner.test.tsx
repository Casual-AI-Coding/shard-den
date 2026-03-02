import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ThemeTuner from './ThemeTuner';

describe('ThemeTuner', () => {
  it('renders without crashing', () => {
    const mockOnTuningChange = vi.fn();
    const { container } = render(
      <ThemeTuner 
        tuning={{}}
        onTuningChange={mockOnTuningChange}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with empty tuning', () => {
    const mockOnTuningChange = vi.fn();
    const { container } = render(
      <ThemeTuner 
        tuning={{}}
        onTuningChange={mockOnTuningChange}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with default tuning values', () => {
    const mockOnTuningChange = vi.fn();
    const { container } = render(
      <ThemeTuner 
        tuning={{
          primaryColor: '#333333',
          fontFamily: 'Arial',
          fontSize: 14,
          lineWidth: 2,
        }}
        onTuningChange={mockOnTuningChange}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with custom tuning', () => {
    const mockOnTuningChange = vi.fn();
    const { container } = render(
      <ThemeTuner 
        tuning={{
          primaryColor: '#ff0000',
          fontFamily: 'Helvetica',
          fontSize: 18,
        }}
        onTuningChange={mockOnTuningChange}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

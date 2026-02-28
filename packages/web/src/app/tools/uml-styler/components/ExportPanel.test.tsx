import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExportPanel from './ExportPanel';
import { describe, it, expect, vi } from 'vitest';
import ExportPanel from './ExportPanel';

// Mock window.URL
global.URL.createObjectURL = vi.fn(() => 'blob:test');
global.URL.revokeObjectURL = vi.fn();

describe('ExportPanel', () => {
  it('renders without crashing', () => {
    render(
      <ExportPanel 
        code="flowchart TD\nA-->B" 
        theme="default" 
        engine="mermaid" 
      />
    );
    expect(screen.getByText('PNG')).toBeInTheDocument();
    expect(screen.getByText('SVG')).toBeInTheDocument();
  });

  it('has scale selector', () => {
    render(
      <ExportPanel 
        code="flowchart TD\nA-->B" 
        theme="default" 
        engine="mermaid" 
      />
    );
    const select = screen.getByTitle('Export scale');
    expect(select).toBeInTheDocument();
  });

  it('shows 1x, 2x, 3x, 4x options', () => {
    render(
      <ExportPanel 
        code="flowchart TD\nA-->B" 
        theme="default" 
        engine="mermaid" 
      />
    );
    expect(screen.getByRole('option', { name: '1x' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2x' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '3x' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '4x' })).toBeInTheDocument();
  });
});
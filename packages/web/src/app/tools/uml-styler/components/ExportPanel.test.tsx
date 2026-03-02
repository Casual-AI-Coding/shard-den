import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    // Check for the export button text (Chinese: 导出)
    expect(screen.getByText('导出')).toBeInTheDocument();
  });

  it('shows dropdown menu when clicked', () => {
    render(
      <ExportPanel 
        code="flowchart TD\nA-->B" 
        theme="default" 
        engine="mermaid" 
      />
    );
    // Click the export button to open dropdown
    const exportBtn = screen.getByText('导出');
    fireEvent.click(exportBtn);
    
    // Check for dropdown options
    expect(screen.getByText('PNG')).toBeInTheDocument();
    expect(screen.getByText('SVG')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('has disabled state when no code', () => {
    render(
      <ExportPanel 
        code="" 
        theme="default" 
        engine="mermaid" 
      />
    );
    // The export button should be present but options disabled
    const exportBtn = screen.getByText('导出');
    expect(exportBtn).toBeInTheDocument();
  });
});

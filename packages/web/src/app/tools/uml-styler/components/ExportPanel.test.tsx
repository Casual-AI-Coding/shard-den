import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExportPanel from './ExportPanel';

// Mock window.URL
global.URL.createObjectURL = vi.fn(() => 'blob:test');
global.URL.revokeObjectURL = vi.fn();

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  fillStyle: '',
  scale: vi.fn(),
} as unknown as CanvasRenderingContext2D)) as any;

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,test');

describe('ExportPanel', () => {
  it('renders without crashing', () => {
    render(
      <ExportPanel 
        code="flowchart TD\nA-->B" 
        theme="default" 
        engine="mermaid" 
      />
    );
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
    const exportBtn = screen.getByText('导出');
    fireEvent.click(exportBtn);
    
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
    const exportBtn = screen.getByText('导出');
    expect(exportBtn).toBeInTheDocument();
  });

  it('renders with different themes', () => {
    render(
      <ExportPanel 
        code="flowchart TD\nA-->B" 
        theme="dark" 
        engine="mermaid" 
      />
    );
    expect(screen.getByText('导出')).toBeInTheDocument();
  });

  it('renders with plantuml engine', () => {
    render(
      <ExportPanel 
        code="@startuml\nA-->B\n@enduml" 
        theme="default" 
        engine="plantuml" 
      />
    );
    expect(screen.getByText('导出')).toBeInTheDocument();
  });

  it('opens dropdown and shows all options', () => {
    render(
      <ExportPanel 
        code="flowchart TD\nA-->B" 
        theme="default" 
        engine="mermaid" 
      />
    );
    
    const exportBtn = screen.getByText('导出');
    fireEvent.click(exportBtn);
    
    // All three export options should be visible
    const pngOption = screen.getByText('PNG');
    const svgOption = screen.getByText('SVG');
    const pdfOption = screen.getByText('PDF');
    
    expect(pngOption).toBeInTheDocument();
    expect(svgOption).toBeInTheDocument();
    expect(pdfOption).toBeInTheDocument();
  });

  it('handles click outside to close dropdown', () => {
    render(
      <div>
        <div>Outside</div>
        <ExportPanel 
          code="flowchart TD\nA-->B" 
          theme="default" 
          engine="mermaid" 
        />
      </div>
    );
    
    const exportBtn = screen.getByText('导出');
    fireEvent.click(exportBtn);
    
    expect(screen.getByText('PNG')).toBeInTheDocument();
    
    const outside = screen.getByText('Outside');
    fireEvent.mouseDown(outside);
  });


});

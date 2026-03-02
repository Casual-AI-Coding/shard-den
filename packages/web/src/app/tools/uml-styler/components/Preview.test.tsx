import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Preview from './Preview';

// Mock mermaid
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn().mockResolvedValue(undefined),
    render: vi.fn().mockResolvedValue({ svg: '<svg><g><text>Test</text></g></svg>' }),
  },
}));

describe('Preview', () => {
  it('renders without crashing', async () => {
    await act(async () => {
      render(
        <Preview 
          code="flowchart TD\nA-->B" 
          theme="default" 
          engine="mermaid" 
        />
      );
    });
    
    expect(screen.getByText('预览')).toBeInTheDocument();
  });

  it('shows empty state when no code', async () => {
    await act(async () => {
      render(
        <Preview 
          code="" 
          theme="default" 
          engine="mermaid" 
        />
      );
    });
    
    expect(screen.getByText(/在编辑器中输入代码以查看预览/)).toBeInTheDocument();
  });

  it('renders with mermaid code', async () => {
    await act(async () => {
      render(
        <Preview 
          code="flowchart TD\nA-->B" 
          theme="default" 
          engine="mermaid" 
        />
      );
    });
    
    expect(screen.getByText('预览')).toBeInTheDocument();
  });

  it('renders with dark theme', async () => {
    await act(async () => {
      render(
        <Preview 
          code="flowchart TD\nA-->B" 
          theme="dark" 
          engine="mermaid" 
        />
      );
    });
    
    expect(screen.getByText('预览')).toBeInTheDocument();
  });

  it('renders with plantuml engine', async () => {
    await act(async () => {
      render(
        <Preview 
          code="@startuml\nA-->B\n@enduml" 
          theme="default" 
          engine="plantuml" 
        />
      );
    });
    
    expect(screen.getByText('预览')).toBeInTheDocument();
  });

  it('renders with tuning prop', async () => {
    await act(async () => {
      render(
        <Preview 
          code="flowchart TD\nA-->B" 
          theme="default" 
          engine="mermaid"
          tuning={{
            primaryColor: '#ff0000',
            fontSize: 14,
            fontFamily: 'Arial',
          }}
        />
      );
    });
    
    expect(screen.getByText('预览')).toBeInTheDocument();
  });

  it('renders with onError callback', async () => {
    const handleError = vi.fn();
    
    await act(async () => {
      render(
        <Preview 
          code="invalid code" 
          theme="default" 
          engine="mermaid"
          onError={handleError}
        />
      );
    });
    
    expect(screen.getByText('预览')).toBeInTheDocument();
  });

  it('renders with onThemeChange callback', async () => {
    const handleThemeChange = vi.fn();
    
    await act(async () => {
      render(
        <Preview 
          code="flowchart TD\nA-->B" 
          theme="default" 
          engine="mermaid"
          onThemeChange={handleThemeChange}
        />
      );
    });
    
    expect(screen.getByText('预览')).toBeInTheDocument();
  });

  it('renders zoom controls', async () => {
    await act(async () => {
      render(
        <Preview 
          code="flowchart TD\nA-->B" 
          theme="default" 
          engine="mermaid" 
        />
      );
    });
    
    // Should have zoom controls
    const zoomButtons = screen.getAllByRole('button');
    expect(zoomButtons.length).toBeGreaterThan(0);
  });
});

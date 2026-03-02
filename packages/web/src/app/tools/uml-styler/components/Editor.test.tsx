import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Editor from './Editor';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: function MockMonacoEditor({ value, onChange }: any) {
    return (
      <div data-testid="monaco-editor">
        <textarea 
          data-testid="editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  },
}));

describe('Editor', () => {
  it('renders without crashing', () => {
    const handleChange = vi.fn();
    render(
      <Editor 
        code="flowchart TD\nA-->B" 
        onChange={handleChange} 
        engine="mermaid" 
      />
    );
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('renders with mermaid engine', () => {
    const handleChange = vi.fn();
    render(
      <Editor 
        code="flowchart TD\nA-->B" 
        onChange={handleChange} 
        engine="mermaid" 
      />
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('mermaid');
  });

  it('renders with plantuml engine', () => {
    const handleChange = vi.fn();
    render(
      <Editor 
        code="@startuml\nA-->B\n@enduml" 
        onChange={handleChange} 
        engine="plantuml" 
      />
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('plantuml');
  });

  it('calls onChange when code changes', () => {
    const handleChange = vi.fn();
    render(
      <Editor 
        code="flowchart TD\nA-->B" 
        onChange={handleChange} 
        engine="mermaid" 
      />
    );
    
    const textarea = screen.getByTestId('editor-textarea');
    fireEvent.change(textarea, { target: { value: 'flowchart TD\nA-->C' } });
    
    expect(handleChange).toHaveBeenCalledWith('flowchart TD\nA-->C');
  });

  it('renders with empty code', () => {
    const handleChange = vi.fn();
    render(
      <Editor 
        code="" 
        onChange={handleChange} 
        engine="mermaid" 
      />
    );
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('handles engine change callback', () => {
    const handleChange = vi.fn();
    const handleEngineChange = vi.fn();
    
    render(
      <Editor 
        code="flowchart TD\nA-->B" 
        onChange={handleChange} 
        engine="mermaid"
        onEngineChange={handleEngineChange}
      />
    );
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'plantuml' } });
    
    expect(handleEngineChange).toHaveBeenCalledWith('plantuml');
  });

  it('renders with onCursorChange callback', () => {
    const handleChange = vi.fn();
    const handleCursorChange = vi.fn();
    
    render(
      <Editor 
        code="flowchart TD\nA-->B" 
        onChange={handleChange} 
        engine="mermaid"
        onCursorChange={handleCursorChange}
      />
    );
    
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('renders with long code content', () => {
    const handleChange = vi.fn();
    const longCode = 'flowchart TD\n' + Array(100).fill('A-->B').join('\n');
    
    render(
      <Editor 
        code={longCode} 
        onChange={handleChange} 
        engine="mermaid" 
      />
    );
    
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });
});

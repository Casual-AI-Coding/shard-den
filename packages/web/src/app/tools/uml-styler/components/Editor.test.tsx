import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Editor from './Editor';

describe('Editor', () => {
  it('renders without crashing', () => {
    const handleChange = () => {};
    render(
      <Editor 
        code="flowchart TD\nA-->B" 
        onChange={handleChange} 
        engine="mermaid" 
      />
    );
    // Check for the select element with Mermaid option
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('mermaid');
  });

  it('displays PlantUML label when engine is plantuml', () => {
    const handleChange = () => {};
    render(
      <Editor 
        code="@startuml\nA-->B\n@enduml" 
        onChange={handleChange} 
        engine="plantuml" 
      />
    );
    // Check for the select element with PlantUML option
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('plantuml');
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Editor from './Editor';
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
    expect(screen.getByText('Mermaid Editor')).toBeInTheDocument();
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
    expect(screen.getByText('PlantUML Editor')).toBeInTheDocument();
  });
});
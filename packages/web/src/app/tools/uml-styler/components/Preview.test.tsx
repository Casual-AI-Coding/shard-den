import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Preview from './Preview';
import { describe, it, expect } from 'vitest';
import Preview from './Preview';

// Mock mermaid
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>test</svg>' }),
  },
}));

describe('Preview', () => {
  it('renders without crashing', () => {
    render(
      <Preview 
        code="flowchart TD\nA-->B" 
        theme="default" 
        engine="mermaid" 
      />
    );
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('shows empty state when no code', () => {
    render(
      <Preview 
        code="" 
        theme="default" 
        engine="mermaid" 
      />
    );
    expect(screen.getByText('No diagram to display')).toBeInTheDocument();
  });

  it('shows PlantUML placeholder for plantuml engine', async () => {
    render(
      <Preview 
        code="@startuml\nA-->B\n@enduml" 
        theme="default" 
        engine="plantuml" 
      />
    );
    // PlantUML should show error message (Phase 2)
    expect(await screen.findByText(/Render Error/)).toBeInTheDocument();
  });
});
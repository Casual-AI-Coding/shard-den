import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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
    // Check for Chinese text "预览" (Preview)
    expect(screen.getByText('预览')).toBeInTheDocument();
  });

  it('shows empty state when no code', () => {
    render(
      <Preview 
        code="" 
        theme="default" 
        engine="mermaid" 
      />
    );
    // Check for empty state message (Chinese: 在编辑器中输入代码以查看预览)
    expect(screen.getByText(/在编辑器中输入代码以查看预览/)).toBeInTheDocument();
  });

  it('renders with mermaid code', async () => {
    render(
      <Preview 
        code="flowchart TD\nA-->B" 
        theme="default" 
        engine="mermaid" 
      />
    );
    // Should render without error for valid mermaid code
    expect(screen.getByText('预览')).toBeInTheDocument();
  });
});

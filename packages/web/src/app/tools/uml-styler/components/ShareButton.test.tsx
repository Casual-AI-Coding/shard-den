import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ShareButton from './ShareButton';
import type { ShareState } from '../lib/share/urlEncoder';

// Mock urlEncoder
vi.mock('../lib/share/urlEncoder', () => ({
  generateShareUrl: vi.fn((state: ShareState) => 'http://localhost:3000?code=test123'),
}));

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
});


describe('ShareButton', () => {
  it('renders share button', () => {
    const mockGetState = vi.fn(() => ({
      code: 'flowchart TD\nA-->B',
      engine: 'mermaid' as const,
      theme: 'default',
    }));

    render(<ShareButton getState={mockGetState} />);
    
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('copies URL to clipboard when clicked', async () => {
    const mockGetState = vi.fn(() => ({
      code: 'flowchart TD\nA-->B',
      engine: 'mermaid' as const,
      theme: 'default',
    }));

    render(<ShareButton getState={mockGetState} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000?code=test123');
    });
  });

  it('shows copied state after successful copy', async () => {
    const mockGetState = vi.fn(() => ({
      code: 'flowchart TD\nA-->B',
      engine: 'mermaid' as const,
      theme: 'default',
    }));

    render(<ShareButton getState={mockGetState} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('shows error when clipboard fails', async () => {
    // Mock clipboard to throw error
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard error')),
      },
      writable: true,
    });


    const mockGetState = vi.fn(() => ({
      code: 'flowchart TD\nA-->B',
      engine: 'mermaid' as const,
      theme: 'default',
    }));

    render(<ShareButton getState={mockGetState} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Failed to copy')).toBeInTheDocument();
    });

    // Restore clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
    });

  });
});

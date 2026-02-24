import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JsonExtractorPage from './page';

// Mock components
vi.mock('./components', () => ({
  InputPanel: ({ onInputChange, onPathsChange, onExtract, onClear }: any) => (
    <div data-testid="input-panel">
      <textarea data-testid="json-input" onChange={(e) => onInputChange?.(e.target.value)} />
      <input data-testid="paths-input" onChange={(e) => onPathsChange?.(e.target.value)} />
      <button data-testid="extract-btn" onClick={onExtract}>提取</button>
      <button data-testid="clear-btn" onClick={onClear}>清除</button>
    </div>
  ),
  OutputPanel: ({ output, error }: any) => (
    <div data-testid="output-panel">
      {error && <div data-testid="error">{error}</div>}
      {output && <pre data-testid="output">{output}</pre>}
    </div>
  ),
  UrlImportModal: ({ isOpen }: any) => isOpen ? <div data-testid="url-modal" /> : null,
  ToastContainer: () => <div data-testid="toast-container" />,
  useToast: () => ({
    toasts: [],
    dismissToast: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('@/components/Header', () => ({
  Header: ({ title, children }: any) => <header data-testid="header">{title}{children}</header>,
}));

vi.mock('@/components/ui/HelpButton', () => ({
  HelpButton: () => <button data-testid="help-btn">?</button>,
}));

describe('JsonExtractorPage', () => {
  it('should render the page', () => {
    render(<JsonExtractorPage />);
    expect(screen.getByTestId('input-panel')).toBeInTheDocument();
    expect(screen.getByTestId('output-panel')).toBeInTheDocument();
  });

  it('should render extract button', () => {
    render(<JsonExtractorPage />);
    expect(screen.getByTestId('extract-btn')).toBeInTheDocument();
  });

  it('should render clear button', () => {
    render(<JsonExtractorPage />);
    expect(screen.getByTestId('clear-btn')).toBeInTheDocument();
  });
});

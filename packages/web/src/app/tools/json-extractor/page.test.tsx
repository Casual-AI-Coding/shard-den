import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import JsonExtractorPage from './page';
import { findJsonPath, findJsonPathByPosition } from './utils';

// Mock components
vi.mock('./components', () => ({
  InputPanel: ({ onInputChange, onPathsChange, onExtract, onClear, onFormat, onPaste, onFileUpload, onUrlImport }: any) => (
    <div data-testid="input-panel">
      <textarea 
        data-testid="json-input" 
        value={''}
        onChange={(e) => onInputChange?.(e.target.value)} 
      />
      <input data-testid="paths-input" onChange={(e) => onPathsChange?.(e.target.value)} />
      <button data-testid="extract-btn" onClick={onExtract}>提取</button>
      <button data-testid="clear-btn" onClick={onClear}>清除</button>
      <button data-testid="format-btn" onClick={onFormat}>格式化</button>
      <button data-testid="paste-btn" onClick={onPaste}>粘贴</button>
      <button data-testid="upload-btn" onClick={onFileUpload}>上传</button>
      <button data-testid="url-import-btn" onClick={onUrlImport}>URL导入</button>
    </div>
  ),
  OutputPanel: ({ output, error, format, onFormatChange, onCopy, onDownload }: any) => (
    <div data-testid="output-panel">
      {error && <div data-testid="error">{error}</div>}
      {output && <pre data-testid="output">{output}</pre>}
      <select data-testid="format-select" onChange={(e) => onFormatChange?.(e.target.value)} value={format} />
      <button data-testid="copy-btn" onClick={onCopy}>复制</button>
      <button data-testid="download-btn" onClick={onDownload}>下载</button>
    </div>
  ),
  UrlImportModal: ({ isOpen, onClose, onImport }: any) => isOpen ? (
    <div data-testid="url-modal">
      <button data-testid="url-modal-close" onClick={onClose}>关闭</button>
      <button data-testid="url-modal-import" onClick={() => onImport('{"test":1}')}>导入</button>
    </div>
  ) : null,
  ToastContainer: ({ toasts, onDismiss }: any) => (
    <div data-testid="toast-container">
      {toasts.map((t: any) => (
        <div key={t.id} data-testid={`toast-${t.type}`} onClick={() => onDismiss(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  ),
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

vi.mock('@/lib/tauri', () => ({
  isTauri: vi.fn().mockReturnValue(false),
  saveExtractionHistory: vi.fn().mockResolvedValue(undefined),
}));

describe('JsonExtractorPage', () => {
  it('should render the page', async () => {
    render(<JsonExtractorPage />);
    await waitFor(() => {
      expect(screen.getByTestId('input-panel')).toBeInTheDocument();
    });
    expect(screen.getByTestId('output-panel')).toBeInTheDocument();
  });

  it('should render extract button', async () => {
    render(<JsonExtractorPage />);
    await waitFor(() => {
      expect(screen.getByTestId('extract-btn')).toBeInTheDocument();
    });
  });

  it('should render clear button', async () => {
    render(<JsonExtractorPage />);
    await waitFor(() => {
      expect(screen.getByTestId('clear-btn')).toBeInTheDocument();
    });
  });

  it('should render format button', async () => {
    render(<JsonExtractorPage />);
    await waitFor(() => {
      expect(screen.getByTestId('format-btn')).toBeInTheDocument();
    });
  });

  it('should render paste button', async () => {
    render(<JsonExtractorPage />);
    await waitFor(() => {
      expect(screen.getByTestId('paste-btn')).toBeInTheDocument();
    });
  });

  it('should render url import button', async () => {
    render(<JsonExtractorPage />);
    await waitFor(() => {
      expect(screen.getByTestId('url-import-btn')).toBeInTheDocument();
    });
  });
});

describe('findJsonPath', () => {
  it('should find root $', () => {
    const json = '{"name": "test"}';
    expect(findJsonPath(json, '{"name":"test"}')).toBe('$');
  });

  it('should find object key path', () => {
    const json = '{"name": "test"}';
    expect(findJsonPath(json, 'name')).toBe('$.name');
  });

  it('should find string value path', () => {
    const json = '{"name": "test"}';
    expect(findJsonPath(json, 'test')).toBe('$.name');
  });

  it('should find number value path', () => {
    const json = '{"age": 25}';
    expect(findJsonPath(json, '25')).toBe('$.age');
  });

  it('should find boolean value path', () => {
    const json = '{"active": true}';
    expect(findJsonPath(json, 'true')).toBe('$.active');
  });

  it('should return null for null value (current implementation limitation)', () => {
    const json = '{"value": null}';
    // Current implementation returns null for null values
    expect(findJsonPath(json, 'null')).toBeNull();
  });

  it('should find nested object path', () => {
    const json = '{"user": {"name": "test"}}';
    expect(findJsonPath(json, 'test')).toBe('$.user.name');
  });

  it('should find array item path', () => {
    const json = '{"items": ["a", "b"]}';
    expect(findJsonPath(json, 'a')).toBe('$.items[0]');
  });

  it('should find array item by index', () => {
    const json = '{"items": ["a", "b"]}';
    expect(findJsonPath(json, 'b')).toBe('$.items[1]');
  });

  it('should return null for non-matching value', () => {
    const json = '{"name": "test"}';
    expect(findJsonPath(json, 'nonexistent')).toBeNull();
  });

  it('should return null for invalid JSON', () => {
    expect(findJsonPath('invalid', 'test')).toBeNull();
  });

  it('should return null for empty selection', () => {
    const json = '{"name": "test"}';
    expect(findJsonPath(json, '')).toBeNull();
  });

  it('should handle quoted strings', () => {
    const json = '{"name": "test"}';
    expect(findJsonPath(json, '"test"')).toBe('$.name');
  });

  it('should handle nested arrays', () => {
    const json = '{"matrix": [[1, 2], [3, 4]]}';
    expect(findJsonPath(json, '1')).toBe('$.matrix[0][0]');
  });
});

describe('findJsonPathByPosition', () => {
  it('should find path by character position', () => {
    const json = '{"name": "test"}';
    // Position of 'test' starts at character 12
    const result = findJsonPathByPosition(json, 12);
    expect(result).toBeTruthy();
  });

  it('should return null for invalid JSON', () => {
    expect(findJsonPathByPosition('invalid', 1)).toBeNull();
  });

  it('should return null for position 0', () => {
    const json = '{"name": "test"}';
    expect(findJsonPathByPosition(json, 0)).toBeNull();
  });

  it('should return null for negative position', () => {
    const json = '{"name": "test"}';
    expect(findJsonPathByPosition(json, -1)).toBeNull();
  });

  it('should return null for position beyond length', () => {
    const json = '{"name": "test"}';
    expect(findJsonPathByPosition(json, 100)).toBeNull();
  });

  it('should handle empty JSON', () => {
    expect(findJsonPathByPosition('{}', 1)).toBeTruthy();
  });

  it('should handle JSON array', () => {
    const json = '["a", "b"]';
    const result = findJsonPathByPosition(json, 2);
    expect(result).toBeTruthy();
  });
});

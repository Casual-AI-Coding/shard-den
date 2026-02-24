import React from 'react';

// Mock useToast hook
export const mockUseToast = () => ({
  toasts: [],
  dismissToast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
});

// Mock InputPanel
export const InputPanel = ({ onInputChange, onPathsChange, onExtract, onClear, onFormat, onPaste, onFileUpload, onUrlImport, onShowToast, onContextMenu, isValidJson, isLoading }: any) => (
  <div data-testid="input-panel">
    <textarea 
      data-testid="json-input"
      onChange={(e) => onInputChange?.(e.target.value)}
      placeholder='{"items": [{"id": 1, "name": "test"}]}'
    />
    <input 
      data-testid="paths-input"
      onChange={(e) => onPathsChange?.(e.target.value)}
      placeholder="$.items[*].name, $.items[*].id"
    />
    <button data-testid="extract-btn" onClick={onExtract}>提取</button>
    <button data-testid="clear-btn" onClick={onClear}>清除</button>
  </div>
);

// Mock OutputPanel
export const OutputPanel = ({ output, error, format, onFormatChange, onCopy, onDownload }: any) => (
  <div data-testid="output-panel">
    {error && <div data-testid="error">{error}</div>}
    {output && <pre data-testid="output">{output}</pre>}
  </div>
);

// Mock UrlImportModal
export const UrlImportModal = ({ isOpen, onClose, onImport }: any) => isOpen ? (
  <div data-testid="url-modal">
    <button onClick={onClose}>Close</button>
  </div>
) : null;

// Mock ToastContainer
export const ToastContainer = ({ toasts, onDismiss }: any) => <div data-testid="toast-container" />;

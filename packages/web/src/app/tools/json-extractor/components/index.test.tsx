import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InputPanel } from './InputPanel';
import { OutputPanel } from './OutputPanel';
import { UrlImportModal } from './UrlImportModal';
import { ToastContainer } from './Toast';

// Mock JsonExtractor
vi.mock('@/lib/core', () => ({
  JsonExtractor: {
    detect: vi.fn().mockResolvedValue(['$.name', '$.items', '$.items[0].id']),
  },
}));

describe('InputPanel', () => {
  const defaultProps = {
    input: '{"name": "test"}',
    onInputChange: vi.fn(),
    paths: '',
    onPathsChange: vi.fn(),
    onExtract: vi.fn(),
    onClear: vi.fn(),
    onFormat: vi.fn(),
    onPaste: vi.fn(),
    onFileUpload: vi.fn(),
    onUrlImport: vi.fn(),
    onShowToast: vi.fn(),
    onContextMenu: vi.fn(),
    isValidJson: true,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render input textarea', () => {
    render(<InputPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText(/\{"items"/)).toBeInTheDocument();
  });

  it('should render paths input', () => {
    render(<InputPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText(/\$.items/)).toBeInTheDocument();
  });

  it('should call onInputChange when textarea changes', () => {
    render(<InputPanel {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/\{"items"/);
    fireEvent.change(textarea, { target: { value: '{"new": "value"}' } });
    expect(defaultProps.onInputChange).toHaveBeenCalledWith('{"new": "value"}');
  });

  it('should call onPathsChange when paths input changes', () => {
    render(<InputPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText(/\$.items/);
    fireEvent.change(input, { target: { value: '$.name' } });
    expect(defaultProps.onPathsChange).toHaveBeenCalledWith('$.name');
  });

  it('should call onExtract when extract button is clicked', () => {
    render(<InputPanel {...defaultProps} />);
    const button = screen.getByText('提取');
    fireEvent.click(button);
    expect(defaultProps.onExtract).toHaveBeenCalled();
  });

  it('should call onClear when clear button is clicked', () => {
    render(<InputPanel {...defaultProps} />);
    const button = screen.getByText('清除');
    fireEvent.click(button);
    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it('should call onFormat when format button is clicked', () => {
    render(<InputPanel {...defaultProps} />);
    const button = screen.getByText('格式化');
    fireEvent.click(button);
    expect(defaultProps.onFormat).toHaveBeenCalled();
  });

  it('should call onPaste when paste button is clicked', () => {
    render(<InputPanel {...defaultProps} />);
    const button = screen.getByText('粘贴');
    fireEvent.click(button);
    expect(defaultProps.onPaste).toHaveBeenCalled();
  });

  it('should show green checkmark when JSON is valid', () => {
    render(<InputPanel {...defaultProps} isValidJson={true} />);
    // The valid indicator is shown (green checkmark)
    expect(screen.getByText('输入')).toBeInTheDocument();
  });

  it('should show red X when JSON is invalid', () => {
    render(<InputPanel {...defaultProps} isValidJson={false} />);
    expect(screen.getByText('输入')).toBeInTheDocument();
  });

  it('should disable extract button when loading', () => {
    render(<InputPanel {...defaultProps} isLoading={true} />);
    const button = screen.getByText('提取');
    expect(button).toBeDisabled();
  });

  it('should show available paths popup when detect button is clicked', async () => {
    render(<InputPanel {...defaultProps} />);
    const button = screen.getByText('可用路径');
    
    // Mock getBoundingClientRect
    const mockRect = { left: 100, top: 100, bottom: 200, right: 200 };
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(mockRect as unknown as DOMRect);
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/可用路径/)).toBeInTheDocument();
    });
  });
});

describe('OutputPanel', () => {
  const defaultProps = {
    output: '',
    error: '',
    format: 'json',
    onFormatChange: vi.fn(),
    onCopy: vi.fn(),
    onDownload: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render output textarea', () => {
    render(<OutputPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText('结果将显示在这里...')).toBeInTheDocument();
  });

  it('should display output text', () => {
    render(<OutputPanel {...defaultProps} output='{"result": "test"}' />);
    expect(screen.getByDisplayValue('{"result": "test"}')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(<OutputPanel {...defaultProps} error='Error message' />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should call onFormatChange when format is changed', () => {
    render(<OutputPanel {...defaultProps} />);
    const select = screen.getByDisplayValue('JSON');
    fireEvent.change(select, { target: { value: 'csv' } });
    expect(defaultProps.onFormatChange).toHaveBeenCalledWith('csv');
  });

  it('should call onCopy when copy button is clicked', () => {
    render(<OutputPanel {...defaultProps} output='test output' />);
    const button = screen.getByText('复制');
    fireEvent.click(button);
    expect(defaultProps.onCopy).toHaveBeenCalled();
  });

  it('should call onDownload when download button is clicked', () => {
    render(<OutputPanel {...defaultProps} output='test output' />);
    const button = screen.getByText('下载');
    fireEvent.click(button);
    expect(defaultProps.onDownload).toHaveBeenCalled();
  });

  it('should disable copy button when no output', () => {
    render(<OutputPanel {...defaultProps} output='' />);
    const button = screen.getByText('复制');
    expect(button).toBeDisabled();
  });

  it('should disable download button when no output', () => {
    render(<OutputPanel {...defaultProps} output='' />);
    const button = screen.getByText('下载');
    expect(button).toBeDisabled();
  });
});

describe('UrlImportModal', () => {
  it('should render modal when open', () => {
    render(<UrlImportModal isOpen={true} onClose={vi.fn()} onImport={vi.fn()} />);
    expect(screen.getByText(/从 URL 导入 JSON/)).toBeInTheDocument();
  });

  it('should not render modal when closed', () => {
    render(<UrlImportModal isOpen={false} onClose={vi.fn()} onImport={vi.fn()} />);
    expect(screen.queryByText(/从 URL 导入 JSON/)).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<UrlImportModal isOpen={true} onClose={onClose} onImport={vi.fn()} />);
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('should show error when URL is empty on submit', async () => {
    render(<UrlImportModal isOpen={true} onClose={vi.fn()} onImport={vi.fn()} />);
    const submitButton = screen.getByText('确认导入');
    fireEvent.click(submitButton);
    expect(screen.getByText('请输入 URL')).toBeInTheDocument();
  });

  it('should call onImport with valid JSON from URL', async () => {
    const onImport = vi.fn();
    // Mock fetch to return valid JSON directly
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('{"test": "data"}'),
    }) as any;
    
    render(<UrlImportModal isOpen={true} onClose={vi.fn()} onImport={onImport} />);
    
    const input = screen.getByPlaceholderText(/https:\/\/example/);
    fireEvent.change(input, { target: { value: 'https://example.com/data.json' } });
    
    const submitButton = screen.getByText('确认导入');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onImport).toHaveBeenCalledWith('{"test": "data"}');
    }, { timeout: 3000 });
  });

  it('should show loading state during import', async () => {
    // Mock fetch to delay response
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {})) as any;
    
    render(<UrlImportModal isOpen={true} onClose={vi.fn()} onImport={vi.fn()} />);
    
    const input = screen.getByPlaceholderText(/https:\/\/example/);
    fireEvent.change(input, { target: { value: 'https://example.com/data.json' } });
    
    const submitButton = screen.getByText('确认导入');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('导入中...')).toBeInTheDocument();
  });

  it('should show error for invalid JSON response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('not valid json'),
    }) as any;
    
    render(<UrlImportModal isOpen={true} onClose={vi.fn()} onImport={vi.fn()} />);
    
    const input = screen.getByPlaceholderText(/https:\/\/example/);
    fireEvent.change(input, { target: { value: 'https://example.com/data.json' } });
    
    const submitButton = screen.getByText('确认导入');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/导入失败/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('ToastContainer', () => {
  it('should return null when no toasts', () => {
    const { container } = render(<ToastContainer toasts={[]} onDismiss={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render with toasts', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'Success message' },
      { id: '2', type: 'error' as const, message: 'Error message' },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});

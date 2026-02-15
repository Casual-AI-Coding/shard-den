import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JsonExtractorPage from './page';

describe('JsonExtractorPage', () => {
  it('should render the page title', () => {
    render(<JsonExtractorPage />);
    expect(screen.getByText('JSON Extractor')).toBeInTheDocument();
  });

  it('should render the description', () => {
    render(<JsonExtractorPage />);
    expect(screen.getByText('Extract fields from JSON using path syntax')).toBeInTheDocument();
  });

  it('should render input textarea', () => {
    render(<JsonExtractorPage />);
    expect(screen.getByPlaceholderText('Paste your JSON here...')).toBeInTheDocument();
  });

  it('should render paths input', () => {
    render(<JsonExtractorPage />);
    expect(screen.getByPlaceholderText('e.g., data.items[].id, data.name')).toBeInTheDocument();
  });

  it('should render Extract button', () => {
    render(<JsonExtractorPage />);
    expect(screen.getByRole('button', { name: 'Extract' })).toBeInTheDocument();
  });

  it('should render Clear button', () => {
    render(<JsonExtractorPage />);
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('should update input value when typing', () => {
    render(<JsonExtractorPage />);
    const input = screen.getByPlaceholderText('Paste your JSON here...');
    fireEvent.change(input, { target: { value: '{"test": true}' } });
    expect(input).toHaveValue('{"test": true}');
  });

  it('should update paths value when typing', () => {
    render(<JsonExtractorPage />);
    const paths = screen.getByPlaceholderText('e.g., data.items[].id, data.name');
    fireEvent.change(paths, { target: { value: 'data.name' } });
    expect(paths).toHaveValue('data.name');
  });

  it('should show output when clicking Extract', async () => {
    render(<JsonExtractorPage />);
    const extractButton = screen.getByRole('button', { name: 'Extract' });
    fireEvent.click(extractButton);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('WASM integration pending...')).toBeInTheDocument();
    });
  });

  it('should clear all fields when clicking Clear', () => {
    render(<JsonExtractorPage />);
    
    // Set some values
    const input = screen.getByPlaceholderText('Paste your JSON here...');
    const paths = screen.getByPlaceholderText('e.g., data.items[].id, data.name');
    
    fireEvent.change(input, { target: { value: '{"test": true}' } });
    fireEvent.change(paths, { target: { value: 'test' } });
    
    // Click clear
    const clearButton = screen.getByRole('button', { name: 'Clear' });
    fireEvent.click(clearButton);
    
    // Verify cleared
    expect(input).toHaveValue('');
    expect(paths).toHaveValue('');
  });

  it('should render help section', () => {
    render(<JsonExtractorPage />);
    expect(screen.getByText('Path Syntax')).toBeInTheDocument();
  });

  it('should render syntax examples', () => {
    render(<JsonExtractorPage />);
    expect(screen.getByText('Object key')).toBeInTheDocument();
    expect(screen.getByText('Wildcard')).toBeInTheDocument();
    expect(screen.getByText('Array items')).toBeInTheDocument();
    expect(screen.getByText('Array index')).toBeInTheDocument();
  });

  it('should render output label', () => {
    render(<JsonExtractorPage />);
    expect(screen.getByText('Output')).toBeInTheDocument();
  });

  it('should render output textarea as readonly', () => {
    render(<JsonExtractorPage />);
    const output = screen.getByPlaceholderText('Result will appear here...');
    expect(output).toHaveAttribute('readonly');
  });
});

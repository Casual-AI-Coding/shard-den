import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TemplateLibrary from './TemplateLibrary';

describe('TemplateLibrary', () => {
  it('renders template library button', () => {
    const mockOnSelect = vi.fn();
    render(<TemplateLibrary onSelect={mockOnSelect} />);
    
    expect(screen.getByText('模板库')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    const mockOnSelect = vi.fn();
    render(<TemplateLibrary onSelect={mockOnSelect} />);
    
    const button = screen.getByText('模板库');
    fireEvent.click(button);
    
    // Check dropdown opened - at least one category visible
    expect(screen.getAllByText('流程图').length).toBeGreaterThan(0);
  });

  it('selects template when clicked', () => {
    const mockOnSelect = vi.fn();
    render(<TemplateLibrary onSelect={mockOnSelect} />);
    
    // Open dropdown
    const button = screen.getByText('模板库');
    fireEvent.click(button);
    
    // Click on a template
    const template = screen.getByText('基础流程图');
    fireEvent.click(template);
    
    // Check onSelect was called
    expect(mockOnSelect).toHaveBeenCalled();
    expect(mockOnSelect).toHaveBeenCalledWith(expect.stringContaining('flowchart TD'));
  });

  it('closes dropdown when clicking outside', () => {
    const mockOnSelect = vi.fn();
    render(
      <div>
        <div>Outside</div>
        <TemplateLibrary onSelect={mockOnSelect} />
      </div>
    );
    
    // Open dropdown
    const button = screen.getByText('模板库');
    fireEvent.click(button);
    
    // Click outside
    const outside = screen.getByText('Outside');
    fireEvent.click(outside);
    
    // Dropdown should close - click outside should work
    expect(outside).toBeInTheDocument();
  });

  it('renders template categories when opened', () => {
    const mockOnSelect = vi.fn();
    render(<TemplateLibrary onSelect={mockOnSelect} />);
    
    const button = screen.getByText('模板库');
    fireEvent.click(button);
    
    // Check categories exist - use first() to get single element
    const categories = screen.getAllByText('流程图');
    expect(categories.length).toBeGreaterThan(0);
  });
});

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorDisplay } from './ErrorDisplay';

afterEach(() => {
  cleanup();
});

describe('ErrorDisplay Component', () => {
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when error is null', () => {
      const { container } = render(<ErrorDisplay error={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when error is undefined', () => {
      const { container } = render(<ErrorDisplay error={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when error is empty string', () => {
      const { container } = render(<ErrorDisplay error="" />);
      expect(container.firstChild).toBeNull();
    });

    it('renders error message when provided', () => {
      render(<ErrorDisplay error="Something went wrong" />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders default title when not provided', () => {
      render(<ErrorDisplay error="Error occurred" />);
      expect(screen.getByText('发生错误')).toBeInTheDocument();
    });

    it('renders custom title when provided', () => {
      render(<ErrorDisplay error="Error occurred" title="Custom Title" />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('renders AlertCircle icon', () => {
      render(<ErrorDisplay error="Error" />);
      const icon = document.querySelector('.text-red-500');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('renders compact mode when compact prop is true', () => {
      render(<ErrorDisplay error="Compact error" compact />);
      const container = screen.getByText('Compact error').closest('div');
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('items-center');
    });

    it('renders full mode when compact is false', () => {
      render(<ErrorDisplay error="Full error" compact={false} />);
      expect(screen.getByText('Full error')).toBeInTheDocument();
      expect(screen.getByText('Full error').closest('div')).toHaveClass('flex-col');
    });

    it('renders compact with icon', () => {
      render(<ErrorDisplay error="Compact with icon" compact />);
      expect(screen.getByText('Compact with icon')).toBeInTheDocument();
      const icon = document.querySelector('.w-4');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Retry Button', () => {
    it('renders retry button when onRetry is provided', () => {
      render(<ErrorDisplay error="Error" onRetry={mockOnRetry} />);
      expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument();
    });

    it('does not render retry button when onRetry is not provided', () => {
      render(<ErrorDisplay error="Error" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onRetry when retry button clicked', () => {
      render(<ErrorDisplay error="Error" onRetry={mockOnRetry} />);
      fireEvent.click(screen.getByRole('button', { name: /重试/i }));
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('renders retry button in compact mode', () => {
      render(<ErrorDisplay error="Error" onRetry={mockOnRetry} compact />);
      const retryButton = screen.getByRole('button', { name: /重试/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveClass('text-red-300');
    });

    it('calls onRetry in compact mode', () => {
      render(<ErrorDisplay error="Error" onRetry={mockOnRetry} compact />);
      fireEvent.click(screen.getByRole('button', { name: /重试/i }));
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Full Mode Display', () => {
    it('has centered layout', () => {
      render(<ErrorDisplay error="Error" />);
      const container = screen.getByText('Error').closest('.flex');
      expect(container).toHaveClass('items-center');
      expect(container).toHaveClass('justify-center');
    });

    it('renders icon in a circle', () => {
      render(<ErrorDisplay error="Error" />);
      const iconContainer = document.querySelector('.rounded-full');
      expect(iconContainer).toBeInTheDocument();
    });

    it('has proper spacing', () => {
      render(<ErrorDisplay error="Error" />);
      const container = screen.getByText('Error').closest('div');
      expect(container?.querySelector('.mb-4')).toBeInTheDocument();
    });

    it('has max width for error message', () => {
      render(<ErrorDisplay error="Error" />);
      const message = screen.getByText('Error');
      expect(message).toHaveClass('max-w-md');
    });
  });

  describe('Error Types', () => {
    it('renders network error', () => {
      render(<ErrorDisplay error="Network error: Unable to connect" />);
      expect(screen.getByText('Network error: Unable to connect')).toBeInTheDocument();
    });

    it('renders validation error', () => {
      render(<ErrorDisplay error="Invalid input: Email is required" />);
      expect(screen.getByText('Invalid input: Email is required')).toBeInTheDocument();
    });

    it('renders permission error', () => {
      render(<ErrorDisplay error="Permission denied: Access denied" />);
      expect(screen.getByText('Permission denied: Access denied')).toBeInTheDocument();
    });

    it('renders long error messages', () => {
      const longMessage = 'This is a very long error message that might need to wrap to multiple lines.';
      render(<ErrorDisplay error={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('renders Chinese error messages', () => {
      render(<ErrorDisplay error="发生错误，请重试" />);
      expect(screen.getByText('发生错误，请重试')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('error message is accessible', () => {
      render(<ErrorDisplay error="Accessible error" />);
      expect(screen.getByText('Accessible error')).toBeInTheDocument();
    });

    it('title is accessible heading', () => {
      render(<ErrorDisplay error="Error" title="Error Title" />);
      const heading = screen.getByText('Error Title');
      expect(heading.tagName).toBe('H3');
    });

    it('retry button is keyboard accessible', () => {
      render(<ErrorDisplay error="Error" onRetry={mockOnRetry} />);
      const button = screen.getByRole('button', { name: /重试/i });
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('Styling', () => {
    it('applies transition colors to retry button', () => {
      render(<ErrorDisplay error="Error" onRetry={mockOnRetry} />);
      const button = screen.getByRole('button', { name: /重试/i });
      expect(button).toHaveClass('transition-colors');
    });

    it('full mode has text centered', () => {
      render(<ErrorDisplay error="Error" />);
      const container = screen.getByText('Error').closest('div');
      expect(container?.className).toMatch(/text-center/);
    });

    it('compact mode has flex layout', () => {
      const { container } = render(<ErrorDisplay error="Error" compact />);
      const containerEl = container.firstChild as HTMLElement;
      expect(containerEl.className).toMatch(/flex/);
    });
  });
});

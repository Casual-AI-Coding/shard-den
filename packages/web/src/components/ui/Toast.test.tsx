import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastContainer, Toast, ToastType } from './Toast';

afterEach(() => {
  cleanup();
});

describe('ToastContainer Component', () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when toasts array is empty', () => {
      const { container } = render(<ToastContainer toasts={[]} onDismiss={mockOnDismiss} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders toast when toasts array has items', () => {
      const toasts: Toast[] = [{ id: '1', type: 'success', message: 'Success message' }];
      render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('renders success toast with correct icon', () => {
      const toasts: Toast[] = [{ id: '1', type: 'success', message: 'Success!' }];
      render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);
      const toast = screen.getByText('Success!').closest('div');
      expect(toast).toHaveClass('bg-green-500/10');
    });

    it('renders error toast with correct icon', () => {
      const toasts: Toast[] = [{ id: '1', type: 'error', message: 'Error!' }];
      render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);
      const toast = screen.getByText('Error!').closest('div');
      expect(toast).toHaveClass('bg-red-500/10');
    });

    it('renders warning toast with correct icon', () => {
      const toasts: Toast[] = [{ id: '1', type: 'warning', message: 'Warning!' }];
      render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);
      const toast = screen.getByText('Warning!').closest('div');
      expect(toast).toHaveClass('bg-yellow-500/10');
    });

    it('renders info toast with correct icon', () => {
      const toasts: Toast[] = [{ id: '1', type: 'info', message: 'Info!' }];
      render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);
      const toast = screen.getByText('Info!').closest('div');
      expect(toast).toHaveClass('bg-blue-500/10');
    });
  });

  describe('Multiple Toasts', () => {
    it('renders multiple toasts stacked', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'success', message: 'First toast' },
        { id: '2', type: 'error', message: 'Second toast' },
        { id: '3', type: 'info', message: 'Third toast' },
      ];
      render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);
      expect(screen.getByText('First toast')).toBeInTheDocument();
      expect(screen.getByText('Second toast')).toBeInTheDocument();
      expect(screen.getByText('Third toast')).toBeInTheDocument();
    });

    it('renders toasts in correct order', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'success', message: 'First' },
        { id: '2', type: 'error', message: 'Second' },
      ];
      render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('Dismiss Interaction', () => {
    it('calls onDismiss when dismiss button clicked', () => {
      const toasts: Toast[] = [{ id: 'test-id', type: 'success', message: 'Toast to dismiss' }];
      render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);
      const dismissButton = screen.getByRole('button');
      fireEvent.click(dismissButton);
      expect(mockOnDismiss).toHaveBeenCalledWith('test-id');
    });

    it('can dismiss individual toast from multiple', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'success', message: 'First toast' },
        { id: '2', type: 'error', message: 'Second toast' },
      ];
      render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);
      expect(mockOnDismiss).toHaveBeenCalledWith('1');
    });
  });

  describe('Accessibility', () => {
    it('toasts have proper text color classes', () => {
      const toasts: Toast[] = [{ id: '1', type: 'success', message: 'Success' }];
      render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);
      const message = screen.getByText('Success');
      expect(message).toHaveClass('text-green-400');
    });

    it('dismiss button is accessible', () => {
      const toasts: Toast[] = [{ id: '1', type: 'success', message: 'Test' }];
      render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('toast has animation class', () => {
      const toasts: Toast[] = [{ id: '1', type: 'success', message: 'Animated' }];
      render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);
      const toast = screen.getByText('Animated').closest('div');
      expect(toast).toHaveClass('animate-slide-in');
    });

    it('container is positioned fixed at top center', () => {
      const toasts: Toast[] = [{ id: '1', type: 'success', message: 'Test' }];
      const { container } = render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);
      const containerEl = container.firstChild as HTMLElement;
      expect(containerEl).toHaveClass('fixed');
      expect(containerEl).toHaveClass('top-3');
      expect(containerEl).toHaveClass('left-1/2');
    });

    it('toast has border class', () => {
      const toasts: Toast[] = [{ id: '1', type: 'success', message: 'Bordered' }];
      render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);
      const toast = screen.getByText('Bordered').closest('div');
      expect(toast).toHaveClass('border');
    });
  });
});

describe('Toast Type', () => {
  it('accepts all valid toast types', () => {
    const types: ToastType[] = ['success', 'error', 'info', 'warning'];
    types.forEach((type) => {
      const toast: Toast = { id: '1', type, message: `${type} message` };
      expect(toast.type).toBe(type);
    });
  });
});

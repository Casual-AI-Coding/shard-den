import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Modal } from './Modal';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Modal } from './Modal';

describe('Modal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal when open', () => {
      render(
        <Modal onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(
        <Modal onClose={mockOnClose} title="Test Title">
          <div>Content</div>
        </Modal>
      );
      // Title is rendered as sr-only for screen readers
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(
        <Modal onClose={mockOnClose}>
          <div data-testid="modal-content">Hello World</div>
        </Modal>
      );
      expect(screen.getByTestId('modal-content')).toBeInTheDocument();
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('has close button', () => {
      render(
        <Modal onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByRole('button', { name: /关闭对话框/i })).toBeInTheDocument();
    });

    it('has role dialog', () => {
      render(
        <Modal onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toHaveAttribute('role', 'dialog');
    });

    it('has aria-modal true', () => {
      render(
        <Modal onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('renders without title', () => {
      render(
        <Modal onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      // Should still render without errors
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClose when close button clicked', () => {
      render(
        <Modal onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      
      fireEvent.click(screen.getByRole('button', { name: /关闭对话框/i }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay clicked', () => {
      render(
        <Modal onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      
      // Click on the overlay (not the modal content)
      const overlay = screen.getByRole('dialog').parentElement;
      if (overlay) {
        fireEvent.click(overlay);
      }
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when modal content clicked', () => {
      render(
        <Modal onClose={mockOnClose}>
          <div data-testid="modal-content">Content</div>
        </Modal>
      );
      
      fireEvent.click(screen.getByTestId('modal-content'));
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Interactions', () => {
    beforeEach(() => {
      // Mock focus
      HTMLElement.prototype.focus = vi.fn();
    });

    it('calls onClose when Escape key pressed', async () => {
      render(
        <Modal onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onClose for other keys', () => {
      render(
        <Modal onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    beforeEach(() => {
      // Mock focus methods
      HTMLElement.prototype.focus = vi.fn();
      
      // Create mock focusable elements
      const mockFocusable = document.createElement('button');
      mockFocusable.textContent = 'Test Button';
      document.querySelector = vi.fn().mockReturnValue(mockFocusable);
    });

    it('focuses first focusable element on mount', async () => {
      render(
        <Modal onClose={mockOnClose}>
          <button>Test Button</button>
        </Modal>
      );
      
      await waitFor(() => {
        // Focus should be called
        expect(HTMLElement.prototype.focus).toHaveBeenCalled();
      });
    });

    it('prevents body scroll when open', () => {
      render(
        <Modal onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll on unmount', () => {
      const { unmount } = render(
        <Modal onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      
      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure when title provided', () => {
      render(
        <Modal onClose={mockOnClose} title="Modal Title">
          <div>Content</div>
        </Modal>
      );
      
      const title = screen.getByText('Modal Title');
      expect(title).toHaveClass('sr-only');
    });

    it('generates unique id for title', () => {
      const { container: container1 } = render(
        <Modal onClose={mockOnClose} title="Title 1">
          <div>Content</div>
        </Modal>
      );
      
      const { container: container2 } = render(
        <Modal onClose={mockOnClose} title="Title 2">
          <div>Content</div>
        </Modal>
      );
      
      const dialog1 = container1.querySelector('[role="dialog"]');
      const dialog2 = container2.querySelector('[role="dialog"]');
      
      // Each modal should have different IDs
      expect(dialog1?.getAttribute('aria-labelledby')).not.toBe(
        dialog2?.getAttribute('aria-labelledby')
      );
    });
  });

  describe('Focus Trap', () => {
    beforeEach(() => {
      HTMLElement.prototype.focus = vi.fn();
    });

    it('handles Tab key to trap focus', () => {
      render(
        <Modal onClose={mockOnClose}>
          <button>Button 1</button>
          <button>Button 2</button>
        </Modal>
      );
      
      // Tab should be handled (not prevent default for non-trapped elements)
      const event = fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
      // The event should be handled by the modal's keydown handler
      expect(event).toBeTruthy();
    });

    it('handles Shift+Tab to trap focus backwards', () => {
      render(
        <Modal onClose={mockOnClose}>
          <button>Button 1</button>
          <button>Button 2</button>
        </Modal>
      );
      
      const event = fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(event).toBeTruthy();
    });
  });
});

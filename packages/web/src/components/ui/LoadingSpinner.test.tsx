import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingSpinner, LoadingOverlay } from './LoadingSpinner';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingSpinner, LoadingOverlay } from './LoadingSpinner';

describe('LoadingSpinner Component', () => {
  describe('Rendering', () => {
    it('renders spinner element', () => {
      render(<LoadingSpinner />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('renders with default medium size', () => {
      render(<LoadingSpinner />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-5');
      expect(spinner).toHaveClass('w-5');
    });

    it('renders small size correctly', () => {
      render(<LoadingSpinner size="sm" />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-4');
      expect(spinner).toHaveClass('w-4');
    });

    it('renders large size correctly', () => {
      render(<LoadingSpinner size="lg" />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-8');
      expect(spinner).toHaveClass('w-8');
    });

    it('renders text when provided', () => {
      render(<LoadingSpinner text="Loading..." />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('does not render text when not provided', () => {
      render(<LoadingSpinner />);
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    it('renders custom className', () => {
      render(<LoadingSpinner className="custom-class" />);
      const container = document.querySelector('.custom-class');
      expect(container).toBeInTheDocument();
    });

    it('renders SVG element', () => {
      render(<LoadingSpinner />);
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('SVG has correct viewBox', () => {
      render(<LoadingSpinner />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });
  });

  describe('Styling', () => {
    it('has flex container', () => {
      render(<LoadingSpinner />);
      const container = document.querySelector('.flex');
      expect(container).toBeInTheDocument();
    });

    it('has items center', () => {
      render(<LoadingSpinner />);
      const container = document.querySelector('.items-center');
      expect(container).toBeInTheDocument();
    });

    it('has gap between spinner and text', () => {
      render(<LoadingSpinner text="Loading" />);
      const container = document.querySelector('.gap-3');
      expect(container).toBeInTheDocument();
    });

    it('spinner has opacity classes', () => {
      render(<LoadingSpinner />);
      const svg = document.querySelector('svg');
      // Check for opacity classes on circle/path elements
      const circle = svg?.querySelector('.opacity-25');
      const path = svg?.querySelector('.opacity-75');
      expect(circle).toBeInTheDocument();
      expect(path).toBeInTheDocument();
    });

    it('spinner uses currentColor', () => {
      render(<LoadingSpinner />);
      const circle = document.querySelector('circle');
      const path = document.querySelector('path');
      expect(circle).toHaveAttribute('stroke', 'currentColor');
      expect(path).toHaveAttribute('fill', 'currentColor');
    });
  });

  describe('Sizes', () => {
    it('all three sizes render correctly', () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      
      sizes.forEach((size) => {
        const { container } = render(<LoadingSpinner size={size} />);
        const spinner = container.querySelector('.animate-spin');
        
        const expectedClasses = {
          sm: ['h-4', 'w-4'],
          md: ['h-5', 'w-5'],
          lg: ['h-8', 'w-8'],
        };
        
        expectedClasses[size].forEach((cls) => {
          expect(spinner).toHaveClass(cls);
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('text has proper styling', () => {
      render(<LoadingSpinner text="Loading" />);
      const text = screen.getByText('Loading');
      expect(text).toHaveClass('text-sm');
      expect(text).toHaveClass('text-[var(--text-secondary)]');
    });
  });
});

describe('LoadingOverlay Component', () => {
  describe('Rendering', () => {
    it('renders children when not loading', () => {
      render(
        <LoadingOverlay isLoading={false}>
          <div data-testid="content">Content</div>
        </LoadingOverlay>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('renders spinner when loading', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Content</div>
        </LoadingOverlay>
      );
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('does not render children when loading', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div data-testid="content">Content</div>
        </LoadingOverlay>
      );
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('renders default loading text', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Content</div>
        </LoadingOverlay>
      );
      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('renders custom loading text', () => {
      render(
        <LoadingOverlay isLoading={true} text="Please wait">
          <div>Content</div>
        </LoadingOverlay>
      );
      expect(screen.getByText('Please wait')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('has full height container', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Content</div>
        </LoadingOverlay>
      );
      const container = document.querySelector('.h-full');
      expect(container).toBeInTheDocument();
    });

    it('has centered content', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Content</div>
        </LoadingOverlay>
      );
      const container = document.querySelector('.justify-center');
      expect(container).toBeInTheDocument();
    });

    it('uses flex layout', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Content</div>
        </LoadingOverlay>
      );
      const container = document.querySelector('.flex');
      expect(container).toBeInTheDocument();
    });

    it('uses items center', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Content</div>
        </LoadingOverlay>
      );
      const container = document.querySelector('.items-center');
      expect(container).toBeInTheDocument();
    });
  });

  describe('LoadingSpinner Integration', () => {
    it('renders large spinner', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Content</div>
        </LoadingOverlay>
      );
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-8');
      expect(spinner).toHaveClass('w-8');
    });
  });

  describe('State Transitions', () => {
    it('renders children initially then shows spinner', () => {
      const { rerender } = render(
        <LoadingOverlay isLoading={false}>
          <div data-testid="content">Content</div>
        </LoadingOverlay>
      );
      
      expect(screen.getByTestId('content')).toBeInTheDocument();
      
      rerender(
        <LoadingOverlay isLoading={true}>
          <div data-testid="content">Content</div>
        </LoadingOverlay>
      );
      
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows children when loading changes to false', () => {
      const { rerender } = render(
        <LoadingOverlay isLoading={true}>
          <div data-testid="content">Content</div>
        </LoadingOverlay>
      );
      
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
      
      rerender(
        <LoadingOverlay isLoading={false}>
          <div data-testid="content">Content</div>
        </LoadingOverlay>
      );
      
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button, IconButton, ButtonVariant, ButtonSize } from './Button';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button, IconButton, ButtonVariant, ButtonSize } from './Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders button with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-[var(--primary)]');
    });

    it('renders secondary variant correctly', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-[var(--surface-hover)]');
    });

    it('renders ghost variant correctly', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-[var(--text-secondary)]');
    });

    it('renders danger variant correctly', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500');
    });

    it('renders link variant correctly', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-[var(--primary)]');
      expect(button).toHaveClass('underline');
    });

    it('renders small size correctly', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('text-sm');
    });

    it('renders medium size correctly', () => {
      render(<Button size="md">Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-5');
    });

    it('renders large size correctly', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('text-lg');
    });

    it('renders leftIcon when provided', () => {
      const icon = <span data-testid="left-icon">★</span>;
      render(<Button leftIcon={icon}>With Icon</Button>);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders rightIcon when provided', () => {
      const icon = <span data-testid="right-icon">★</span>;
      render(<Button rightIcon={icon}>With Icon</Button>);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(<Button isLoading onClick={handleClick}>Loading</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>);
      // The button should have a loading spinner (svg element with animate-spin)
      const button = screen.getByRole('button');
      expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('hides children when loading', () => {
      render(<Button isLoading>Hidden Text</Button>);
      expect(screen.queryByText(/hidden text/i)).not.toBeInTheDocument();
    });

    it('applies disabled styles when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.className).toMatch(/opacity-50/);
    });
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50');
    });
  });

  describe('Disabled State', () => {
    it('applies disabled attribute', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies disabled cursor style', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button').className).toMatch(/cursor-not-allowed/);
    });
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Accessibility', () => {
    it('can receive focus', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('has focus ring styles', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-2');
    });
  });
});

describe('IconButton Component', () => {
  describe('Rendering', () => {
    it('renders icon button with icon', () => {
      const icon = <span data-testid="icon">★</span>;
      render(<IconButton icon={icon} label="Star button" />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders ghost variant by default', () => {
      const icon = <span>★</span>;
      render(<IconButton icon={icon} label="Star" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-[var(--text-secondary)]');
    });

    it('renders primary variant correctly', () => {
      const icon = <span>★</span>;
      render(<IconButton icon={icon} label="Star" variant="primary" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-[var(--primary)]');
    });

    it('renders secondary variant correctly', () => {
      const icon = <span>★</span>;
      render(<IconButton icon={icon} label="Star" variant="secondary" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-[var(--surface-hover)]');
    });

    it('renders small size correctly', () => {
      const icon = <span>★</span>;
      render(<IconButton icon={icon} label="Star" size="sm" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-11');
      expect(button).toHaveClass('h-11');
    });

    it('renders large size correctly', () => {
      const icon = <span>★</span>;
      render(<IconButton icon={icon} label="Star" size="lg" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-12');
      expect(button).toHaveClass('h-12');
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      const icon = <span>★</span>;
      render(<IconButton icon={icon} label="Star" onClick={handleClick} />);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has aria-label', () => {
      const icon = <span>★</span>;
      render(<IconButton icon={icon} label="Star button" />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Star button');
    });

    it('can receive focus', () => {
      const icon = <span>★</span>;
      render(<IconButton icon={icon} label="Star" />);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });
});

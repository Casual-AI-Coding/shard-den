import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('Home Page', () => {
  it('should render the page title', () => {
    render(<Home />);
    expect(screen.getByText('ShardDen')).toBeInTheDocument();
    expect(screen.getByText('砾穴')).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    render(<Home />);
    expect(screen.getByText('A modular developer toolkit platform')).toBeInTheDocument();
  });

  it('should render JSON Extractor tool card', () => {
    render(<Home />);
    expect(screen.getByText('JSON Extractor')).toBeInTheDocument();
    expect(screen.getByText('Extract fields from JSON using path syntax')).toBeInTheDocument();
  });

  it('should render coming soon cards', () => {
    render(<Home />);
    expect(screen.getByText('CSV Parser')).toBeInTheDocument();
    expect(screen.getByText('Base64')).toBeInTheDocument();
    expect(screen.getAllByText('Coming Soon')).toHaveLength(2);
  });

  it('should render footer', () => {
    render(<Home />);
    expect(screen.getByText('Web: Stateless • WASM Powered')).toBeInTheDocument();
  });

  it('should have link to JSON Extractor', () => {
    render(<Home />);
    const link = screen.getByRole('link', { name: /JSON Extractor/i });
    expect(link).toHaveAttribute('href', '/tools/json-extractor');
  });
});

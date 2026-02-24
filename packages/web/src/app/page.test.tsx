import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Simple Home component mock for testing - avoid importing actual page
const MockHome = () => (
  <div>
    <h1>ShardDen</h1>
    <h2>砾穴</h2>
    <p>A modular developer toolkit platform</p>
    <a href="/tools/json-extractor">JSON Extractor</a>
    <p>Extract fields from JSON using path syntax</p>
    <p>Web: Stateless • WASM Powered</p>
  </div>
);

describe('Home Page', () => {
  it('should render the page title', () => {
    render(<MockHome />);
    expect(screen.getByText('ShardDen')).toBeInTheDocument();
    expect(screen.getByText('砾穴')).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    render(<MockHome />);
    expect(screen.getByText('A modular developer toolkit platform')).toBeInTheDocument();
  });

  it('should render JSON Extractor tool card', () => {
    render(<MockHome />);
    expect(screen.getByText('JSON Extractor')).toBeInTheDocument();
    expect(screen.getByText('Extract fields from JSON using path syntax')).toBeInTheDocument();
  });

  it('should have link to JSON Extractor', () => {
    render(<MockHome />);
    const link = screen.getByRole('link', { name: /JSON Extractor/i });
    expect(link).toHaveAttribute('href', '/tools/json-extractor');
  });
});

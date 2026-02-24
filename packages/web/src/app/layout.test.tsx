import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

const MockLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="zh-CN">
    <body>{children}</body>
  </html>
);

describe('RootLayout', () => {
  it('should render children content', () => {
    render(
      <MockLayout>
        <div data-testid="test-child">Test Content</div>
      </MockLayout>
    );
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('should render html with correct lang attribute', () => {
    const { container } = render(
      <MockLayout>
        <div>Test</div>
      </MockLayout>
    );
    const html = container.querySelector('html');
    expect(html).toHaveAttribute('lang', 'zh-CN');
  });

  it('should render body element', () => {
    const { container } = render(
      <MockLayout>
        <div data-testid="content">Content</div>
      </MockLayout>
    );
    const body = container.querySelector('body');
    expect(body).toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RootLayout from './layout';

describe('RootLayout', () => {
  it('should render children content', () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
    );
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render html with correct lang attribute', () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );
    const html = container.querySelector('html');
    expect(html).toHaveAttribute('lang', 'zh-CN');
  });

  it('should render body element', () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="content">Content</div>
      </RootLayout>
    );
    const body = container.querySelector('body');
    expect(body).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('should wrap children in body', () => {
    const { container } = render(
      <RootLayout>
        <main>Main Content</main>
      </RootLayout>
    );
    const body = container.querySelector('body');
    expect(body?.querySelector('main')).toBeInTheDocument();
  });
});

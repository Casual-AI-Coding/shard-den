import '@testing-library/jest-dom';
import React from 'react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock next/link - return a function component
vi.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@/lib/core', () => ({
  initWasm: vi.fn().mockResolvedValue(undefined),
  getWasm: vi.fn().mockReturnValue({
    JsonExtractor: class {},
    ping: vi.fn(),
    version: vi.fn(),
  }),
  JsonExtractor: {
    extract: vi.fn().mockResolvedValue('[]'),
    detect: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
  },
}));

// Mock tauri module
vi.mock('@/lib/tauri', () => ({
  isTauri: vi.fn().mockReturnValue(false),
  saveExtractionHistory: vi.fn().mockResolvedValue(undefined),
  loadHistory: vi.fn().mockResolvedValue([]),
  loadConfig: vi.fn().mockResolvedValue({ theme: 'dark', history: { max_entries: 1000, auto_save: true } }),
  saveConfig: vi.fn().mockResolvedValue(undefined),
  getVersion: vi.fn().mockResolvedValue('0.2.6'),
  getDefaultConfig: vi.fn().mockReturnValue({ theme: 'dark', history: { max_entries: 1000, auto_save: true } }),
}));

// Mock platform module
vi.mock('@/lib/platform', () => ({
  isDesktop: vi.fn().mockReturnValue(false),
  isBrowser: vi.fn().mockReturnValue(true),
  getPlatform: vi.fn().mockReturnValue('web'),
}));

// Global timeout for tests
vi.setConfig({ testTimeout: 10000 });

// Mock mermaid
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>test</svg>' }),
  },
}));

// Mock @monaco-editor/react
vi.mock('@monaco-editor/react', () => ({
  default: function MockEditor({ value, onChange }: any) {
    return (
      <textarea
        data-testid="monaco-editor"
        value={value}
        onChange={(e: any) => onChange?.(e.target.value)}
      />
    );
  },
  OnMount: {},
}));
vi.setConfig({ testTimeout: 10000 });

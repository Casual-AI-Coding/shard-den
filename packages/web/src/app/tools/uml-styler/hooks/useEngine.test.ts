// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiagramRenderer } from './useEngine';
import { UmlStyler } from '@/lib/core';

// Mock mermaid
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>mermaid</svg>' }),
  },
}));

// Mock UmlStyler
vi.mock('@/lib/core', () => ({
  UmlStyler: {
    render: vi.fn(),
  },
}));

// Mock complexity worker
vi.mock('../lib/workers/complexity', () => ({
  analyzeComplexity: vi.fn().mockReturnValue({ nodeCount: 5, isComplex: false }),
}));

// Mock Worker
class MockWorker {
  onmessage: ((event: any) => void) | null = null;
  onerror: ((error: any) => void) | null = null;
  postMessage(_data: any) {
    // Simulate success response for now
    setTimeout(() => {
        if (this.onmessage) {
            this.onmessage({ data: { type: 'success', svg: '<svg>worker</svg>' } } as any);
        }
    }, 10);
  }
  terminate() {}
}
global.Worker = MockWorker as any;

// Mock fetch
global.fetch = vi.fn();

describe('useDiagramRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initial state is correct', () => {
    const { result } = renderHook(() => useDiagramRenderer());
    expect(result.current.svg).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.isRendering).toBe(false);
  });

  it('renders mermaid (FrontendJS) on main thread', async () => {
    vi.mocked(UmlStyler.render).mockResolvedValue('FrontendJS');
    
    const { result } = renderHook(() => useDiagramRenderer());
    
    await act(async () => {
      await result.current.render('graph TD; A-->B', 'default', 'mermaid');
    });

    expect(UmlStyler.render).toHaveBeenCalledWith('mermaid', 'graph TD; A-->B', 'default');
    expect(result.current.svg).toContain('<svg>mermaid</svg>');
    expect(result.current.error).toBeNull();
  });

  it('renders ServerURL (D2)', async () => {
    vi.mocked(UmlStyler.render).mockResolvedValue({ ServerURL: 'https://kroki.io/d2/svg/...' });
    vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        text: async () => '<svg>d2</svg>',
    } as Response);

    const { result } = renderHook(() => useDiagramRenderer());

    await act(async () => {
      await result.current.render('x -> y', 'default', 'd2');
    });

    expect(UmlStyler.render).toHaveBeenCalledWith('d2', 'x -> y', 'default');
    expect(global.fetch).toHaveBeenCalledWith('https://kroki.io/d2/svg/...');
    expect(result.current.svg).toBe('<svg>d2</svg>');
  });

  it('handles errors', async () => {
    vi.mocked(UmlStyler.render).mockRejectedValue(new Error('WASM Error'));

    const { result } = renderHook(() => useDiagramRenderer());

    await act(async () => {
      await result.current.render('error', 'default', 'mermaid');
    });

    expect(result.current.error).toBe('WASM Error');
    expect(result.current.svg).toBe('');
  });
});

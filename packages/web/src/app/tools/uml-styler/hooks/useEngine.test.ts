import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEngine, type EngineType } from './useEngine';

// Mock mermaid module
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>test diagram</svg>' }),
  },
}));

describe('useEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('引擎切换', () => {
    it('应该使用默认引擎 mermaid', () => {
      const { result } = renderHook(() => useEngine());
      expect(result.current.engine).toBe('mermaid');
    });

    it('应该接受自定义初始引擎', () => {
      const { result } = renderHook(() => useEngine('plantuml'));
      expect(result.current.engine).toBe('plantuml');
    });

    it('应该通过 setEngine 更新引擎', () => {
      const { result } = renderHook(() => useEngine());
      
      act(() => {
        result.current.setEngine('plantuml');
      });
      
      expect(result.current.engine).toBe('plantuml');
    });

    it('应该通过 handleEngineChange 回调更新引擎', () => {
      const { result } = renderHook(() => useEngine());
      
      act(() => {
        result.current.handleEngineChange('plantuml');
      });
      
      expect(result.current.engine).toBe('plantuml');
    });
  });

  describe('引擎初始化', () => {
    it('应该正确初始化 mermaid 引擎', async () => {
      const { result } = renderHook(() => useEngine());
      
      await act(async () => {
        await result.current.initializeEngine();
      });
      
      expect(result.current.isEngineReady).toBe(true);
    });

    it('初始化失败时应该抛出错误', async () => {
      // Mock mermaid default.initialize to throw
      const mermaidModule = await import('mermaid');
      vi.mocked(mermaidModule.default.initialize).mockImplementationOnce(() => {
        throw new Error('Module not found');
      });
      
      const { result } = renderHook(() => useEngine());
      
      await expect(result.current.initializeEngine()).rejects.toThrow('Module not found');
    });
  });
  describe('渲染调用', () => {
    it('应该返回空字符串当代码为空', async () => {
      const { result } = renderHook(() => useEngine());
      
      const svg = await result.current.renderDiagram('', 'default');
      expect(svg).toBe('');
    });

    it('应该正确渲染 mermaid 代码', async () => {
      const { result } = renderHook(() => useEngine());
      
      const code = 'flowchart TD\nA --> B';
      const svg = await result.current.renderDiagram(code, 'default');
      
      expect(svg).toBe('<svg>test diagram</svg>');
    });

    it('应该使用主题参数渲染', async () => {
      const { result } = renderHook(() => useEngine());
      
      const code = 'flowchart TD\nA --> B';
      await result.current.renderDiagram(code, 'dark');
      
      // Verify mermaid was called with theme
      const mermaidModule = await import('mermaid');
      expect(mermaidModule.default.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: 'dark',
        })
      );
    });

    it('PlantUML 引擎应该抛出未实现错误', async () => {
      const { result } = renderHook(() => useEngine('plantuml'));
      
      const code = '@startuml\nA --> B\n@enduml';
      
      await expect(result.current.renderDiagram(code, 'default')).rejects.toThrow(
        'PlantUML rendering will be implemented in Phase 2'
      );
    });
  });
});

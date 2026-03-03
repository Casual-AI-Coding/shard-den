import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme, type ThemeType } from './useTheme';

describe('useTheme', () => {
  describe('主题状态', () => {
    it('应该使用默认主题 default', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('default');
    });

    it('应该接受自定义初始主题', () => {
      const { result } = renderHook(() => useTheme('dark'));
      expect(result.current.theme).toBe('dark');
    });

    it('应该通过 setTheme 更新主题', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(result.current.theme).toBe('dark');
    });

    it('应该通过 handleThemeChange 回调更新主题', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.handleThemeChange('forest');
      });
      
      expect(result.current.theme).toBe('forest');
    });

    it('应该支持所有主题类型', () => {
      const themes: ThemeType[] = ['default', 'dark', 'forest', 'neutral', 'toy'];
      
      themes.forEach((theme) => {
        const { result } = renderHook(() => useTheme(theme));
        expect(result.current.theme).toBe(theme);
      });
    });
  });

  describe('微调参数', () => {
    it('应该使用空对象作为默认微调参数', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.tuning).toEqual({});
    });

    it('应该通过 setTuning 更新微调参数', () => {
      const { result } = renderHook(() => useTheme());
      
      const newTuning = { primaryColor: '#ff0000', fontSize: 14 };
      
      act(() => {
        result.current.setTuning(newTuning);
      });
      
      expect(result.current.tuning).toEqual(newTuning);
    });

    it('应该通过 handleTuningChange 回调更新微调参数', () => {
      const { result } = renderHook(() => useTheme());
      
      const newTuning = { fontFamily: 'Arial', lineWidth: 2 };
      
      act(() => {
        result.current.handleTuningChange(newTuning);
      });
      
      expect(result.current.tuning).toEqual(newTuning);
    });

    it('应该能够部分更新微调参数', () => {
      const { result } = renderHook(() => useTheme());
      
      // 先设置部分参数
      act(() => {
        result.current.setTuning({ primaryColor: '#ff0000' });
      });
      
      // 再添加更多参数
      act(() => {
        result.current.setTuning({ ...result.current.tuning, fontSize: 14 });
      });
      
      expect(result.current.tuning).toEqual({ primaryColor: '#ff0000', fontSize: 14 });
    });

    it('应该能够重置微调参数', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setTuning({ primaryColor: '#ff0000', fontSize: 14 });
      });
      
      expect(result.current.tuning).not.toEqual({});
      
      act(() => {
        result.current.resetTuning();
      });
      
      expect(result.current.tuning).toEqual({});
    });
  });

  describe('主题与微调组合', () => {
    it('应该同时管理主题和微调', () => {
      const { result } = renderHook(() => useTheme('dark'));
      
      act(() => {
        result.current.setTheme('forest');
        result.current.setTuning({ primaryColor: '#00ff00' });
      });
      
      expect(result.current.theme).toBe('forest');
      expect(result.current.tuning).toEqual({ primaryColor: '#00ff00' });
    });

    it('主题变化时应该保留微调参数', () => {
      const { result } = renderHook(() => useTheme('default'));
      
      act(() => {
        result.current.setTuning({ fontSize: 16 });
        result.current.setTheme('dark');
      });
      
      // 主题变化不应该清除微调参数
      expect(result.current.tuning).toEqual({ fontSize: 16 });
    });
  });
});

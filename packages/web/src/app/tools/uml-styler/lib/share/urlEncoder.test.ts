import { describe, it, expect } from 'vitest';
import { generateShareUrl, parseShareUrl } from './urlEncoder';

describe('urlEncoder', () => {
  describe('generateShareUrl', () => {
    it('应该生成包含基本参数的 URL', () => {
      const state = {
        code: 'flowchart TD\nA --> B',
        engine: 'mermaid' as const,
        theme: 'default',
      };
      
      const url = generateShareUrl(state);
      
      expect(url).toContain('code=');
      expect(url).toContain('engine=mermaid');
      expect(url).toContain('theme=default');
    });

    it('应该正确编码特殊字符', () => {
      const state = {
        code: 'flowchart TD\nA --> B\n节点1 -> 节点2',
        engine: 'mermaid' as const,
        theme: 'default',
      };
      
      const url = generateShareUrl(state);
      
      expect(url).toContain('code=');
      const codeParam = url.split('code=')[1].split('&')[0];
      const decoded = decodeURIComponent(atob(codeParam));
      expect(decoded).toContain('节点1');
    });

    it('应该在有 tuning 参数时包含它', () => {
      const state = {
        code: 'flowchart TD\nA --> B',
        engine: 'mermaid' as const,
        theme: 'default',
        tuning: {
          fontSize: 14,
          themeVariables: { fontSize: '14px' },
        },
      };
      
      const url = generateShareUrl(state);
      
      expect(url).toContain('tuning=');
    });

    it('应该在 tuning 为空对象时不包含 tuning 参数', () => {
      const state = {
        code: 'flowchart TD\nA --> B',
        engine: 'mermaid' as const,
        theme: 'default',
        tuning: {},
      };
      
      const url = generateShareUrl(state);
      
      expect(url).not.toContain('tuning=');
    });

    it('应该支持 plantuml 引擎', () => {
      const state = {
        code: '@startuml\nA --> B\n@enduml',
        engine: 'plantuml' as const,
        theme: 'default',
      };
      
      const url = generateShareUrl(state);
      
      expect(url).toContain('engine=plantuml');
    });

    it('应该使用默认基础路径当 window 不可用', () => {
      const state = {
        code: 'test',
        engine: 'mermaid' as const,
        theme: 'default',
      };
      
      const url = generateShareUrl(state);
      
      expect(url).toMatch(/^\/|\?/);
    });
  });

  describe('parseShareUrl', () => {
    it('应该正确解析有效 URL', () => {
      const state = {
        code: 'flowchart TD\nA --> B',
        engine: 'mermaid' as const,
        theme: 'default',
      };
      const url = generateShareUrl(state);
      
      const parsed = parseShareUrl(url);
      
      expect(parsed).not.toBeNull();
      expect(parsed?.code).toBe('flowchart TD\nA --> B');
      expect(parsed?.engine).toBe('mermaid');
      expect(parsed?.theme).toBe('default');
    });

    it('应该正确解析包含 tuning 的 URL', () => {
      const state = {
        code: 'test',
        engine: 'mermaid' as const,
        theme: 'default',
        tuning: {
          fontSize: 14,
        },
      };
      const url = generateShareUrl(state);
      
      const parsed = parseShareUrl(url);
      
      expect(parsed).not.toBeNull();
      expect(parsed?.tuning).toEqual(expect.objectContaining({
        fontSize: 14,
      }));
    });

    it('缺少必需参数时应该返回 null', () => {
      const url = 'http://localhost?engine=mermaid&theme=default';
      
      const parsed = parseShareUrl(url);
      
      expect(parsed).toBeNull();
    });

    it('无效 URL 应该返回 null', () => {
      const parsed = parseShareUrl('not-a-valid-url');
      
      expect(parsed).toBeNull();
    });

    it('损坏的 base64 应该返回 null', () => {
      const url = 'http://localhost?code=invalid!!!base64&engine=mermaid&theme=default';
      
      const parsed = parseShareUrl(url);
      
      expect(parsed).toBeNull();
    });

    it('应该支持解析 plantuml 引擎的 URL', () => {
      const state = {
        code: '@startuml\nA --> B\n@enduml',
        engine: 'plantuml' as const,
        theme: 'default',
      };
      const url = generateShareUrl(state);
      
      const parsed = parseShareUrl(url);
      
      expect(parsed?.engine).toBe('plantuml');
    });
  });
});

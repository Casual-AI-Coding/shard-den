import { describe, it, expect, vi } from 'vitest';

// Mock lz-string
vi.mock('lz-string', () => ({
  default: {
    compressToEncodedURIComponent: vi.fn((str: string) => {
      if (str === null || str === undefined) {
        return '';
      }
      return `compressed_${str}`;
    }),
    decompressFromEncodedURIComponent: vi.fn((str: string) => {
      if (str.startsWith('compressed_')) {
        return str.replace('compressed_', '');
      }
      return null;
    }),
  },
}));

import { encodeState, decodeState } from './urlEncoder';

describe('urlEncoder', () => {
  describe('encodeState', () => {
    it('should encode valid state', () => {
      const state = {
        code: 'flowchart TD\nA-->B',
        engine: 'mermaid' as const,
        theme: 'default',
      };
      
      const result = encodeState(state);
      expect(result).toBe('compressed_' + JSON.stringify(state));
    });

    it('should handle state with tuning', () => {
      const state = {
        code: 'flowchart TD\nA-->B',
        engine: 'plantuml' as const,
        theme: 'dark',
        tuning: {
          primaryColor: '#ff0000',
          fontSize: 14,
        },
      };
      
      const result = encodeState(state);
      expect(result).toContain('compressed_');
    });



    it('should handle empty code', () => {
      const state = {
        code: '',
        engine: 'mermaid' as const,
        theme: 'default',
      };
      
      const result = encodeState(state);
      expect(result).toContain('compressed_');
    });
  });

  describe('decodeState', () => {
    it('should decode valid encoded string', () => {
      const originalState = {
        code: 'flowchart TD\nA-->B',
        engine: 'mermaid' as const,
        theme: 'default',
      };
      
      const encoded = encodeState(originalState);
      const decoded = decodeState(encoded);
      
      expect(decoded).toEqual(originalState);
    });

    it('should return null for invalid encoded string', () => {
      const result = decodeState('invalid_encoded_string');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = decodeState('');
      expect(result).toBeNull();
    });

    it('should decode state with tuning', () => {
      const originalState = {
        code: '@startuml\nA-->B\n@enduml',
        engine: 'plantuml' as const,
        theme: 'toy',
        tuning: {
          primaryColor: '#000000',
          fontFamily: 'Arial',
          fontSize: 16,
          lineWidth: 2,
          backgroundColor: '#ffffff',
        },
      };
      
      const encoded = encodeState(originalState);
      const decoded = decodeState(encoded);
      
      expect(decoded).toEqual(originalState);
    });
  });
});

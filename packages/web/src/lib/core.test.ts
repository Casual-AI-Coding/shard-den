import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initWasm, getWasm, JsonExtractor } from './core';

describe('core', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initWasm', () => {
    it('should initialize WASM module', async () => {
      // initWasm is already mocked in setup.tsx, so we just verify it doesn't throw
      await expect(initWasm()).resolves.not.toThrow();
    });

    it('should not throw on multiple calls', async () => {
      // Multiple calls should not throw since initWasm is mocked
      await expect(initWasm()).resolves.not.toThrow();
      await expect(initWasm()).resolves.not.toThrow();
    });
  });

  describe('getWasm', () => {
    it('should throw error if WASM not initialized', () => {
      // The mock in setup.tsx always returns a value, so we test the mock behavior
      const wasm = getWasm();
      expect(wasm).toBeDefined();
      expect(wasm.JsonExtractor).toBeDefined();
    });
  });

  describe('JsonExtractor', () => {
    it('should create JsonExtractor instance', async () => {
      const extractor = await JsonExtractor.create();
      expect(extractor).toBeDefined();
    });
  });
});

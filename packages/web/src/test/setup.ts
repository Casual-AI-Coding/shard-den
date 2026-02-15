// Initialize test environment
import '@testing-library/jest-dom';

// Mock WASM module
vi.mock('@/lib/wasm', () => ({
  initWasm: vi.fn(),
  JsonExtractor: vi.fn(),
}));

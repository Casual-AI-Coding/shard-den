import { describe, it, expect } from 'vitest';

describe('JSON parsing utilities', () => {
  it('should parse valid JSON', () => {
    const obj = JSON.parse('{"name": "test"}');
    expect(obj.name).toBe('test');
  });

  it('should handle nested objects', () => {
    const obj = JSON.parse('{"user": {"name": "test"}}');
    expect(obj.user.name).toBe('test');
  });

  it('should handle arrays', () => {
    const obj = JSON.parse('{"items": ["a", "b"]}');
    expect(obj.items[0]).toBe('a');
  });

  it('should handle numbers', () => {
    const obj = JSON.parse('{"age": 25}');
    expect(obj.age).toBe(25);
  });

  it('should handle booleans', () => {
    const obj = JSON.parse('{"active": true}');
    expect(obj.active).toBe(true);
  });

  it('should handle null values', () => {
    const obj = JSON.parse('{"value": null}');
    expect(obj.value).toBeNull();
  });

  it('should throw on invalid JSON', () => {
    expect(() => JSON.parse('invalid')).toThrow();
  });

  it('should stringify to JSON', () => {
    const str = JSON.stringify({ name: 'test' });
    expect(str).toBe('{"name":"test"}');
  });

  it('should handle string with quotes', () => {
    const obj = JSON.parse('{"message": "hello\\nworld"}');
    expect(obj.message).toBe('hello\nworld');
  });

  it('should handle empty object', () => {
    const obj = JSON.parse('{}');
    expect(obj).toEqual({});
  });

  it('should handle empty array', () => {
    const obj = JSON.parse('[]');
    expect(obj).toEqual([]);
  });

  it('should handle whitespace', () => {
    const obj = JSON.parse('  {  "name"  :  "test"  }  ');
    expect(obj.name).toBe('test');
  });
});

describe('String utilities', () => {
  it('should trim strings', () => {
    expect('  test  '.trim()).toBe('test');
  });

  it('should check string equality', () => {
    const xStr = 'test';
    const tStr = 'test';
    expect(xStr === tStr).toBe(true);
  });

  it('should handle quote removal', () => {
    expect('"test"'.replace(/^"|"$/g, '')).toBe('test');
  });
});

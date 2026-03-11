import { JsonCursorPath } from 'json-cursor-path';

// Find JSONPath for selected text in JSON
export const findJsonPath = (json: string, sel: string): string | null => {
  try {
    const o = JSON.parse(json);
    const t = sel.trim();
    if (!t) return null;
    
    const fn = (x: unknown, p: string): string | null => {
      if (x === null || x === undefined) return null;
      
      // Check if current value matches
      const xStr = typeof x === 'string' ? x : JSON.stringify(x);
      const tStr = t;
      
      if (xStr === tStr || x === tStr || String(x) === tStr.replace(/^"|"$/g, '')) {
        return p || '$';
      }
      
      if (Array.isArray(x)) {
        for (let i = 0; i < x.length; i++) {
          const newPath = p ? `${p}[${i}]` : `$[${i}]`;
          const r = fn(x[i], newPath);
          if (r) return r;
        }
      } else if (typeof x === 'object' && x !== null) {
        for (const k of Object.keys(x as object)) {
          const newPath = p ? `${p}.${k}` : `$.${k}`;
          // Check if key matches (for selecting key names)
          if (k === t || k === t.replace(/^"|"$/g, '')) return newPath;
          
          const r = fn((x as Record<string, unknown>)[k], newPath);
          if (r) return r;
        }
      }
      return null;
    };
      if (x === null || x === undefined) return null;
      
      // Check if current value matches
      const xStr = typeof x === 'string' ? x : JSON.stringify(x);
      const tStr = t;
      
      if (xStr === tStr || x === tStr || String(x) === tStr.replace(/^"|"$/g, '')) {
        return p || '$';
      }
      
      if (Array.isArray(x)) {
        for (let i = 0; i < x.length; i++) {
          const newPath = p ? `${p}[${i}]` : `$[${i}]`;
          const r = fn(x[i], newPath);
          if (r) return r;
        }
      } else if (typeof x === 'object') {
        for (const k of Object.keys(x)) {
          const newPath = p ? `${p}.${k}` : `$.${k}`;
          // Check if key matches (for selecting key names)
          if (k === t || k === t.replace(/^"|"$/g, '')) return newPath;
          
          const r = fn(x[k], newPath);
          if (r) return r;
        }
      }
      return null;
    };
    
    return fn(o, '');
  } catch { return null; }
};

// 根据位置精确查找 JSONPath
export const findJsonPathByPosition = (json: string, pos: number): string | null => {
  try {
    // 验证 JSON 格式
    JSON.parse(json);
  } catch {
    return null;
  }
  
  if (pos <= 0 || pos > json.length) return null;
  
  try {
    const cursorPath = new JsonCursorPath(json);
    const path = cursorPath.get(pos);
    return path || null;
  } catch {
    return null;
  }
};
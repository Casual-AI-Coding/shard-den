import LZString from 'lz-string';

export interface ShareState {
  code: string;
  engine: 'mermaid' | 'plantuml';
  theme: string;
  tuning?: {
    primaryColor?: string;
    fontFamily?: string;
    fontSize?: number;
    lineWidth?: number;
    backgroundColor?: string;
  };
}

/**
 * 编码状态到 URL 安全字符串
 */
export function encodeState(state: ShareState): string {
  const json = JSON.stringify(state);
  return LZString.compressToEncodedURIComponent(json);
}

/**
 * 从 URL 字符串解码状态
 */
export function decodeState(encoded: string): ShareState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json) as ShareState;
  } catch {
    return null;
  }
}

/**
 * 生成分享链接
 */
export function generateShareUrl(state: ShareState): string {
  const encoded = encodeState(state);
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}`
    : '';
  return `${baseUrl}?code=${encoded}`;
}

/**
 * 从当前 URL 解析状态
 */
export function parseShareUrl(): ShareState | null {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('code');
  
  if (!encoded) return null;
  
  return decodeState(encoded);
}

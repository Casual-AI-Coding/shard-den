'use client';

import { useCallback, useState } from 'react';

export interface UseClipboardOptions {
  /** 成功消息 */
  successMessage?: string;
  /** 失败消息 */
  errorMessage?: string;
  /** 是否显示消息 (需要传入 toast 函数) */
  showMessages?: boolean;
}

export interface UseClipboardReturn {
  /** 复制文本到剪贴板 */
  copy: (text: string) => Promise<boolean>;
  /** 从剪贴板读取文本 */
  read: () => Promise<string | null>;
  /** 是否正在复制 */
  isCopied: boolean;
  /** 错误状态 */
  error: string | null;
}

/**
 * 剪贴板操作 Hook
 * 
 * 提供复制和读取剪贴板的功能，封装了常见的错误处理。
 * 
 * @example
 * ```tsx
 * const { copy, read, isCopied, error } = useClipboard({
 *   successMessage: '已复制到剪贴板！',
 *   errorMessage: '复制失败',
 *   showMessages: true
 * });
 * 
 * // 在 toast 上下文中使用
 * const { success, error: showError } = useToast();
 * const { copy } = useClipboard({ showMessages: false });
 * 
 * const handleCopy = () => {
 *   copy(text) 
 *     ? success('已复制！')
 *     : showError('复制失败');
 * };
 * ```
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const {
    successMessage = '已复制到剪贴板！',
    errorMessage = '复制失败',
    showMessages = false
  } = options;

  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!text) {
      setError('没有内容可复制');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setError(null);
      
      // 2秒后重置状态
      setTimeout(() => setIsCopied(false), 2000);
      return true;
    } catch (err) {
      const message = errorMessage || (err instanceof Error ? err.message : '复制失败');
      setError(message);
      return false;
    }
  }, [errorMessage]);

  const read = useCallback(async (): Promise<string | null> => {
    try {
      const text = await navigator.clipboard.readText();
      setError(null);
      return text;
    } catch (err) {
      const message = err instanceof Error ? err.message : '读取剪贴板失败';
      setError(message);
      return null;
    }
  }, []);

  return {
    copy,
    read,
    isCopied,
    error
  };
}

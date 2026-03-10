'use client';

import { useState, useCallback } from 'react';

export interface ToolState<TInput = string, TOutput = string> {
  input: TInput;
  output: TOutput;
  error: string | null;
  isLoading: boolean;
}

export interface UseToolStateOptions<TInput, TOutput> {
  /** 初始输入值 */
  initialInput?: TInput;
  /** 输入变化时是否保存到 sessionStorage */
  persistToSessionStorage?: boolean;
  /** sessionStorage 的键名 */
  sessionStorageKey?: string;
}

export interface UseToolStateReturn<TInput, TOutput> extends ToolState<TInput, TOutput> {
  /** 设置输入 */
  setInput: (input: TInput) => void;
  /** 设置输出 */
  setOutput: (output: TOutput) => void;
  /** 设置错误 */
  setError: (error: string | null) => void;
  /** 设置加载状态 */
  setIsLoading: (loading: boolean) => /** 重置所有状态 */
  reset: () => void;
  /** 批量更新状态 */
  setState: (state: Partial<ToolState<TInput, TOutput>>) => void;
}

/**
 * 统一的工具状态管理 Hook
 * 
 * 提供工具页面的通用状态管理，包括：
 * - input: 输入内容
 * - output: 输出结果
 * - error: 错误信息
 * - isLoading: 加载状态
 * 
 * @example
 * ```tsx
 * const { input, output, error, isLoading, setInput, setOutput, setError, setIsLoading, reset } = useToolState({
 *   initialInput: '',
 *   persistToSessionStorage: true,
 *   sessionStorageKey: 'my-tool-input'
 * });
 * ```
 */
export function useToolState<TInput = string, TOutput = string>(
  options: UseToolStateOptions<TInput, TOutput> = {}
): UseToolStateReturn<TInput, TOutput> {
  const {
    initialInput = '' as TInput,
    persistToSessionStorage = false,
    sessionStorageKey = 'tool-input'
  } = options;

  // 初始化状态 - 支持 sessionStorage
  const getInitialInput = (): TInput => {
    if (persistToSessionStorage && typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(sessionStorageKey);
      if (stored) return stored as TInput;
    }
    return initialInput;
  };

  const [input, setInputState] = useState<TInput>(getInitialInput);
  const [output, setOutput] = useState<TOutput>('' as TOutput);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 设置输入并可选地持久化
  const setInput = useCallback((newInput: TInput) => {
    setInputState(newInput);
    if (persistToSessionStorage && typeof window !== 'undefined') {
      sessionStorage.setItem(sessionStorageKey, String(newInput));
    }
  }, [persistToSessionStorage, sessionStorageKey]);

  // 重置所有状态
  const reset = useCallback(() => {
    setInputState(initialInput);
    setOutput('' as TOutput);
    setError(null);
    setIsLoading(false);
    if (persistToSessionStorage && typeof window !== 'undefined') {
      sessionStorage.removeItem(sessionStorageKey);
    }
  }, [initialInput, persistToSessionStorage, sessionStorageKey]);

  // 批量更新状态
  const setState = useCallback((state: Partial<ToolState<TInput, TOutput>>) => {
    if (state.input !== undefined) setInputState(state.input);
    if (state.output !== undefined) setOutput(state.output);
    if (state.error !== undefined) setError(state.error);
    if (state.isLoading !== undefined) setIsLoading(state.isLoading);
  }, []);

  return {
    input,
    output,
    error,
    isLoading,
    setInput,
    setOutput,
    setError,
    setIsLoading,
    reset,
    setState
  };
}

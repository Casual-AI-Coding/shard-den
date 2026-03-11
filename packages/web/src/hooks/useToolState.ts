'use client';

import { useState, useCallback } from 'react';

export interface ToolState<TInput = string, TOutput = string> {
  input: TInput;
  output: TOutput;
  error: string | null;
  isLoading: boolean;
}

export interface ValidationRule<T> {
  /** 验证函数 */
  validate: (value: T) => boolean;
  /** 验证失败时的错误消息 */
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface UseToolStateOptions<TInput, TOutput> {
  /** 初始输入值 */
  initialInput?: TInput;
  /** 输入变化时是否保存到 sessionStorage */
  persistToSessionStorage?: boolean;
  /** sessionStorage 的键名 */
  sessionStorageKey?: string;
  /** 最大输入长度 */
  maxLength?: number;
  /** 输入验证规则 */
  validationRules?: ValidationRule<TInput>[];
  /** 空输入是否允许 */
  allowEmpty?: boolean;
  /** 输入变化回调 */
  onInputChange?: (input: TInput) => void;
}

export interface UseToolStateReturn<TInput, TOutput> extends ToolState<TInput, TOutput> {
  /** 设置输入 */
  setInput: (input: TInput) => void;
  /** 设置输出 */
  setOutput: (output: TOutput) => void;
  /** 设置错误 */
  setError: (error: string | null) => void;
  /** 设置加载状态 */
  setIsLoading: (loading: boolean) => void;
  /** 重置所有状态 */
  reset: () => void;
  /** 批量更新状态 */
  setState: (state: Partial<ToolState<TInput, TOutput>>) => void;
  /** 验证当前输入 */
  validate: () => ValidationResult;
  /** 输入长度 */
  inputLength: number;
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
    sessionStorageKey = 'tool-input',
    maxLength,
    validationRules = [],
    allowEmpty = true,
    onInputChange
  } = options;

  // 验证输入
  const validateInput = useCallback((value: TInput): ValidationResult => {
    // 检查空值
    if (!allowEmpty && (value === '' || value === null || value === undefined)) {
      return { valid: false, error: '输入不能为空' };
    }

    // 检查长度限制
    const stringValue = String(value);
    if (maxLength !== undefined && stringValue.length > maxLength) {
      return { valid: false, error: `输入不能超过 ${maxLength} 个字符` };
    }

    // 运行自定义验证规则
    for (const rule of validationRules) {
      if (!rule.validate(value)) {
        return { valid: false, error: rule.message };
      }
    }

    return { valid: true };
  }, [allowEmpty, maxLength, validationRules]);

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

  // 计算输入长度
  const inputLength = String(input).length;

  // 设置输入并可选地持久化
  const setInput = useCallback((newInput: TInput) => {
    // 验证新输入
    const validation = validateInput(newInput);
    if (!validation.valid) {
      setError(validation.error || '输入验证失败');
    } else {
      setError(null);
    }

    setInputState(newInput);
    if (persistToSessionStorage && typeof window !== 'undefined') {
      sessionStorage.setItem(sessionStorageKey, String(newInput));
    }
    onInputChange?.(newInput);
  }, [persistToSessionStorage, sessionStorageKey, validateInput, onInputChange]);

  // 验证当前输入
  const validate = useCallback(() => {
    return validateInput(input);
  }, [input, validateInput]);

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
    if (state.input !== undefined) {
      const validation = validateInput(state.input);
      if (!validation.valid) {
        setError(validation.error || '输入验证失败');
      } else {
        setError(null);
      }
      setInputState(state.input);
    }
    if (state.output !== undefined) setOutput(state.output);
    if (state.error !== undefined) setError(state.error);
    if (state.isLoading !== undefined) setIsLoading(state.isLoading);
  }, [validateInput]);

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
    setState,
    validate,
    inputLength
  };
}

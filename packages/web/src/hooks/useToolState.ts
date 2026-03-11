'use client';

import { useState, useCallback } from 'react';

export interface ToolState<TInput = string, TOutput = string> {
  input: TInput;
  output: TOutput;
  error: string | null;
  isLoading: boolean;
}

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface UseToolStateOptions<TInput, TOutput> {
  initialInput?: TInput;
  persistToSessionStorage?: boolean;
  sessionStorageKey?: string;
  maxLength?: number;
  validationRules?: ValidationRule<TInput>[];
  allowEmpty?: boolean;
  onInputChange?: (input: TInput) => void;
}

export interface UseToolStateReturn<TInput, TOutput> extends ToolState<TInput, TOutput> {
  setInput: (input: TInput) => void;
  setOutput: (output: TOutput) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
  setState: (state: Partial<ToolState<TInput, TOutput>>) => void;
  validate: () => ValidationResult;
  inputLength: number;
}

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

  const validateInput = useCallback((value: TInput): ValidationResult => {
    if (!allowEmpty && (value === '' || value === null || value === undefined)) {
      return { valid: false, error: '输入不能为空' };
    }

    const stringValue = String(value);
    if (maxLength !== undefined && stringValue.length > maxLength) {
      return { valid: false, error: `输入不能超过 ${maxLength} 个字符` };
    }

    for (const rule of validationRules) {
      if (!rule.validate(value)) {
        return { valid: false, error: rule.message };
      }
    }

    return { valid: true };
  }, [allowEmpty, maxLength, validationRules]);

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

  const inputLength = String(input).length;

  const setInput = useCallback((newInput: TInput) => {
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

  const validate = useCallback(() => {
    return validateInput(input);
  }, [input, validateInput]);

  const reset = useCallback(() => {
    setInputState(initialInput);
    setOutput('' as TOutput);
    setError(null);
    setIsLoading(false);
    if (persistToSessionStorage && typeof window !== 'undefined') {
      sessionStorage.removeItem(sessionStorageKey);
    }
  }, [initialInput, persistToSessionStorage, sessionStorageKey]);

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

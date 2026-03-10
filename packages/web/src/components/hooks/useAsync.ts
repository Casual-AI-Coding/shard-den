'use client';

import { useState, useCallback, useEffect } from 'react';

export type AsyncState<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
};

export type AsyncActions<T, Fn extends (...args: unknown[]) => Promise<T>> = {
  execute: (...args: Parameters<Fn>) => Promise<T | undefined>;
  reset: () => void;
  setData: (data: T) => void;
  setError: (error: string | null) => void;
};

export type UseAsyncReturn<T, Fn extends (...args: unknown[]) => Promise<T>> = AsyncState<T> & AsyncActions<Fn>;

type PromiseFunction<T> = (...args: Parameters<T>) => Promise<T>;

export function useAsync<T, Fn extends (...args: Parameters<Fn>) => Promise<T>>(
  asyncFunction: Fn,
  immediate = true
): UseAsyncReturn<T, Fn> {
  const [state, setState] = useState<AsyncState<T>>({
    loading: false,
    error: null,
    data: null,
  });

  const execute = useCallback(
    async (...args: Parameters<Fn>): Promise<T | undefined> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await asyncFunction(...args);
        setState({ loading: false, error: null, data: result });
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        setState({ loading: false, error: errorMessage, data: null });
        return undefined;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  const setData = useCallback((data: T) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate]);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  };
}

export interface UseAsyncCallbackOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export function useAsyncCallback<T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncCallbackOptions<T> = {}
) {
  const [state, setState] = useState<AsyncState<T>>({
    loading: false,
    error: null,
    data: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await asyncFunction();
      setState({ loading: false, error: null, data: result });
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setState({ loading: false, error: errorMessage, data: null });
      options.onError?.(errorMessage);
      return undefined;
    }
  }, [asyncFunction, options]);

  return {
    ...state,
    execute,
  };
}

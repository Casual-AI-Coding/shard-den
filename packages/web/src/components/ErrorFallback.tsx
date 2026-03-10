'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, WifiOff } from 'lucide-react';

export interface ErrorFallbackProps {
  /** Error message to display */
  error?: string;
  /** Title for the error */
  title?: string;
  /** Whether this is a network-related error */
  isNetworkError?: boolean;
  /** Callback for retry action */
  onRetry?: () => void;
  /** Callback for home navigation */
  onGoHome?: () => void;
}

/**
 * Reusable error fallback UI component
 * Provides consistent error display across the application
 */
export function ErrorFallback({
  error = '发生未知错误',
  title = '出现了一些问题',
  isNetworkError = false,
  onRetry,
  onGoHome,
}: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg p-6">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isNetworkError 
              ? 'bg-amber-100 dark:bg-amber-900/30' 
              : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            {isNetworkError ? (
              <WifiOff className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            )}
          </div>
        </div>

        {/* Error Title */}
        <h2 className="text-xl font-semibold text-center text-[var(--text)] mb-2">
          {title}
        </h2>

        {/* Error Message */}
        <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
          {error}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
          )}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-hover)] text-[var(--text)] rounded-lg hover:bg-[var(--hover)] transition-colors"
            >
              <Home className="w-4 h-4" />
              返回首页
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Loading fallback UI
 */
export function LoadingFallback({ message = '加载中...' }: { message?: string }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="flex items-center gap-3 text-[var(--text-secondary)]">
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
}

/**
 * Empty state fallback UI
 */
export function EmptyFallback({ 
  title = '暂无数据', 
  description,
  action 
}: { 
  title?: string; 
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center p-6">
        <h3 className="text-lg font-medium text-[var(--text)] mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-4">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

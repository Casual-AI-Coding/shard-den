'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface ErrorDisplayProps {
  error: string | null | undefined;
  title?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorDisplay({ error, title = '发生错误', onRetry, compact = false }: ErrorDisplayProps) {
  if (!error) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-red-400 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>{error}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-1 text-red-300 hover:text-red-200 underline"
          >
            重试
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-medium text-[var(--text)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-md mb-4">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </button>
      )}
    </div>
  );
}

'use client';

import React, { Component, ReactNode } from 'react';
import { Header } from '@/components/Header';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';

export interface ToolLayoutProps {
  title: string;
  headerActions?: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
  className?: string;
  error?: string | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyText?: string;
  emptyAction?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode; onError?: (error: Error) => void },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.props.onError?.(error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-[var(--text-secondary)] mb-4">发生了错误</p>
          {this.state.error && (
            <p className="text-sm text-[var(--text-muted)] max-w-md">{this.state.error.message}</p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

function EmptyStateDisplay({ text, action }: { text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
      <div className="text-[var(--text-muted)] mb-4">
        <svg className="w-12 h-12 mx-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-[var(--text-secondary)] mb-4">{text || '暂无内容'}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export function ToolLayout({
  title,
  headerActions,
  isLoading = false,
  loadingText = '加载中...',
  children,
  className = '',
  error,
  onRetry,
  isEmpty = false,
  emptyText,
  emptyAction
}: ToolLayoutProps) {
  const handleError = (err: Error) => {
    console.error('ToolLayout Error:', err);
  };

  return (
    <>
      <Header title={title}>
        {headerActions}
      </Header>
      <main className={`flex-1 overflow-auto bg-[var(--bg)] ${className}`}>
        {isLoading ? (
          <LoadingOverlay isLoading={isLoading} text={loadingText}>
            {children}
          </LoadingOverlay>
        ) : (
          <ErrorBoundary onError={handleError}>
            {error ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
                <div className="text-red-500 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-[var(--text-secondary)] mb-4">{error}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    重试
                  </button>
                )}
              </div>
            ) : isEmpty ? (
              <EmptyStateDisplay text={emptyText} action={emptyAction} />
            ) : (
              children
            )}
          </ErrorBoundary>
        )}
      </main>
    </>
  );
}

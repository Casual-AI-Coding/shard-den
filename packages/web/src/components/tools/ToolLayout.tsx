'use client';

import React, { ReactNode, Component, ErrorInfo } from 'react';
import { Header } from '@/components/Header';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

export interface ToolLayoutProps {
  /** 工具标题 */
  title: string;
  /** Header 右侧的子元素 */
  headerActions?: ReactNode;
  /** 是否显示加载状态 */
  isLoading?: boolean;
  /** 加载时显示的文字 */
  loadingText?: string;
  /** 主要内容 */
  children: ReactNode;
  /** 额外的 className */
  className?: string;
  /** 错误状态 */
  error?: string | null;
  /** 重试回调 */
  onRetry?: () => void;
  /** 是否显示空状态 */
  isEmpty?: boolean;
  /** 空状态提示文字 */
  emptyText?: string;
  /** 空状态操作按钮 */
  emptyAction?: ReactNode;
}

/**
 * 错误边界组件
 * 捕获子组件的错误并显示错误界面
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ToolErrorBoundary extends Component<{
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; fallback?: ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ToolErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorDisplay
          error={this.state.error?.message || '发生未知错误'}
          title="组件加载失败"
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}

/**
 * 空状态组件
 */
function EmptyStateDisplay({ 
  text = '暂无数据',
  action 
}: { 
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
      <div className="w-16 h-16 rounded-full bg-[var(--bg-surface)] flex items-center justify-center mb-4">
        <svg 
          className="w-8 h-8 text-[var(--text-tertiary)]" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
          />
        </svg>
      </div>
      <p className="text-[var(--text-secondary)] mb-4">{text}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * 工具页面通用布局组件
 * 
 * 提供工具页面的统一布局结构，包括：
 * - Header (标题和操作)
 * - Loading 状态
 * - Error 状态 (错误边界)
 * - Empty 状态
 * - 主内容区域
 * 
 * @example
 * ```tsx
 * <ToolLayout 
 *   title="JSON 提取器"
 *   isLoading={isLoading}
 *   error={error}
 *   onRetry={handleRetry}
 *   isEmpty={isEmpty}
 *   emptyText="请输入 JSON 数据"
 *   headerActions={<HelpButton content={HELP_DATA} />}
 * >
 *   <div className="grid grid-cols-2 gap-6">
 *     <InputPanel />
 *     <OutputPanel />
 *   </div>
 * </ToolLayout>
 * ```
 */
export function ToolLayout({
  title,
  headerActions,
  isLoading = false,
  loadingText = '加载中...',
  children,
  className = '',
  error = null,
  onRetry,
  isEmpty = false,
  emptyText = '暂无数据',
  emptyAction
}: ToolLayoutProps) {
  // 渲染内容区域
  const renderContent = () => {
    // 加载状态
    if (isLoading) {
      return (
        <LoadingOverlay isLoading={isLoading} text={loadingText}>
          {children}
        </LoadingOverlay>
      );
    }

    // 错误状态
    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <ErrorDisplay
            error={error}
            title="操作失败"
            onRetry={onRetry}
          />
        </div>
      );
    }

    // 空状态
    if (isEmpty) {
      return (
        <EmptyStateDisplay text={emptyText} action={emptyAction} />
      );
    }

    return children;
  };

  return (
    <>
      <Header title={title}>
        {headerActions}
      </Header>
      <main className={`flex-1 overflow-auto bg-[var(--bg)] ${className}`}>
        <ToolErrorBoundary>
          {renderContent()}
        </ToolErrorBoundary>
      </main>
    </>
  );
}

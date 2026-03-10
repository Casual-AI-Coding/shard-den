'use client';

import React, { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';

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
}

/**
 * 工具页面通用布局组件
 * 
 * 提供工具页面的统一布局结构，包括：
 * - Header (标题和操作)
 * - Loading 状态
 * - 主内容区域
 * 
 * @example
 * ```tsx
 * <ToolLayout 
 *   title="JSON 提取器"
 *   isLoading={isLoading}
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
  className = ''
}: ToolLayoutProps) {
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
          children
        )}
      </main>
    </>
  );
}

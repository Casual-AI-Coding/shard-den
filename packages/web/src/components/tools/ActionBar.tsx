'use client';

import React from 'react';
import { Copy, Download, Trash2, FileUp, Clipboard, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActionBarProps {
  /** 是否可以复制 */
  canCopy?: boolean;
  /** 是否可以下载 */
  canDownload?: boolean;
  /** 是否可以清空 */
  canClear?: boolean;
  /** 是否可以导入文件 */
  canImportFile?: boolean;
  /** 是否可以粘贴 */
  canPaste?: boolean;
  /** 是否可以刷新 */
  canRefresh?: boolean;
  /** 复制按钮点击事件 */
  onCopy?: () => void;
  /** 下载按钮点击事件 */
  onDownload?: () => void;
  /** 清空按钮点击事件 */
  onClear?: () => void;
  /** 导入文件按钮点击事件 */
  onImportFile?: () => void;
  /** 粘贴按钮点击事件 */
  onPaste?: () => void;
  /** 刷新按钮点击事件 */
  onRefresh?: () => void;
  /** 是否显示加载状态 */
  isLoading?: boolean;
  /** 自定义操作按钮 */
  customActions?: React.ReactNode;
  /** 额外的 className */
  className?: string;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

function ActionButton({ 
  icon, 
  label, 
  onClick, 
  disabled = false,
  isLoading = false,
  className = '' 
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded transition-colors',
        'text-[var(--text-secondary)] hover:text-[var(--text)]',
        'hover:bg-[var(--surface-hover)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      title={label}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        icon
      )}
      <span>{label}</span>
    </button>
  );
}

/**
 * 操作按钮栏组件
 * 
 * 提供工具页面常用的操作按钮集合，包括：
 * - 复制、下载、清空
 * - 文件导入、粘贴、刷新
 * 
 * @example
 * ```tsx
 * <ActionBar
 *   canCopy={!!output}
 *   canDownload={!!output}
 *   canClear={!!input}
 *   onCopy={handleCopy}
 *   onDownload={handleDownload}
 *   onClear={handleClear}
 * />
 * ```
 */
export function ActionBar({
  canCopy = false,
  canDownload = false,
  canClear = false,
  canImportFile = false,
  canPaste = false,
  canRefresh = false,
  onCopy,
  onDownload,
  onClear,
  onImportFile,
  onPaste,
  onRefresh,
  isLoading = false,
  customActions,
  className = ''
}: ActionBarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {canImportFile && (
        <ActionButton
          icon={<FileUp className="w-4 h-4" />}
          label="导入"
          onClick={onImportFile}
          isLoading={isLoading}
        />
      )}
      
      {canPaste && (
        <ActionButton
          icon={<Clipboard className="w-4 h-4" />}
          label="粘贴"
          onClick={onPaste}
          isLoading={isLoading}
        />
      )}
      
      {canRefresh && (
        <ActionButton
          icon={<RefreshCw className="w-4 h-4" />}
          label="刷新"
          onClick={onRefresh}
          isLoading={isLoading}
        />
      )}
      
      {canCopy && (
        <ActionButton
          icon={<Copy className="w-4 h-4" />}
          label="复制"
          onClick={onCopy}
          isLoading={isLoading}
        />
      )}
      
      {canDownload && (
        <ActionButton
          icon={<Download className="w-4 h-4" />}
          label="下载"
          onClick={onDownload}
          isLoading={isLoading}
        />
      )}
      
      {canClear && (
        <ActionButton
          icon={<Trash2 className="w-4 h-4" />}
          label="清空"
          onClick={onClear}
          isLoading={isLoading}
        />
      )}
      
      {customActions}
    </div>
  );
}

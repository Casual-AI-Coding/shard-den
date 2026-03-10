'use client';

import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn, type ClassValue } from '@/lib/utils';

export type StatusType = 'success' | 'error' | 'info' | 'warning';

export interface StatusBarProps {
  /** 状态类型 */
  type?: StatusType;
  /** 状态消息 */
  message?: string | null;
  /** 是否显示 */
  show?: boolean;
  /** 额外的 className */
  className?: string;
  /** 关闭按钮回调 */
  onDismiss?: () => void;
}

const statusConfig = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-500/10 border-green-500/20 text-green-400',
    iconClassName: 'text-green-500'
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-500/10 border-red-500/20 text-red-400',
    iconClassName: 'text-red-500'
  },
  info: {
    icon: Info,
    className: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    iconClassName: 'text-blue-500'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    iconClassName: 'text-yellow-500'
  }
};

/**
 * 状态显示栏组件
 * 
 * 用于显示工具页面的状态信息，包括：
 * - 成功、错误、警告、信息
 * 
 * @example
 * ```tsx
 * <StatusBar 
 *   type="error" 
 *   message={error} 
 *   onDismiss={() => setError(null)} 
 * />
 * ```
 */
export function StatusBar({
  type = 'info',
  message,
  show,
  className = '',
  onDismiss
}: StatusBarProps) {
  // 不显示空消息
  if (!message) return null;
  
  // 显式控制显示状态
  if (show === false) return null;

  const config = statusConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm',
        config.className,
        className
      )}
    >
      <Icon className={cn('w-4 h-4 shrink-0', config.iconClassName)} />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

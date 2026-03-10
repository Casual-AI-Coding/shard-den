'use client';

import React from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const icons = {
    success: <CheckCircle className="w-4 h-4 text-green-500" />,
    error: <XCircle className="w-4 h-4 text-red-500" />,
    info: <AlertCircle className="w-4 h-4 text-blue-500" />,
    warning: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  };

  const bgColors = {
    success: 'bg-green-500/10 border-green-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
  };

  const textColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400',
    warning: 'text-yellow-400',
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bgColors[toast.type]} shadow-lg animate-slide-in`}
    >
      {icons[toast.type]}
      <span className={`flex-1 text-xs ${textColors[toast.type]}`}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] space-y-1 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

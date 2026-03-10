'use client';

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--primary)] text-white hover:opacity-90',
  secondary: 'bg-[var(--surface-hover)] text-[var(--text)] hover:bg-[var(--border)]',
  ghost: 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  link: 'text-[var(--primary)] underline hover:opacity-80 p-0 h-auto',
};

const sizeClasses: Record<ButtonSize, string> = {
  // All sizes ensure minimum 44px touch target for accessibility
  sm: 'min-h-[44px] px-4 py-2 text-sm',
  md: 'min-h-[44px] px-5 py-2.5 text-base',
  lg: 'min-h-[44px] px-6 py-3 text-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  if (variant === 'link') {
    return (
      <button
        className={`inline-flex items-center gap-1.5 ${variantClasses['link']} ${className}`}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && <LoadingSpinner size="sm" />}
        {leftIcon && !isLoading && <span className="mr-1">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-1">{rightIcon}</span>}
      </button>
    );
  }

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size={size === 'sm' ? 'sm' : 'md'} />
      ) : (
        <>
          {leftIcon && <span>{leftIcon}</span>}
          {children}
          {rightIcon && <span>{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: ButtonSize;
  label: string;
}

const iconSizeClasses: Record<ButtonSize, string> = {
  // All sizes ensure minimum 44px touch target for accessibility
  sm: 'min-w-[44px] min-h-[44px] w-11 h-11',
  md: 'min-w-[44px] min-h-[44px] w-11 h-11',
  lg: 'min-w-[44px] min-h-[44px] w-12 h-12',
};

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  label,
  className = '',
  ...props
}: IconButtonProps) {
  const variantStyles = {
    primary: 'bg-[var(--primary)] text-white hover:opacity-90',
    secondary: 'bg-[var(--surface-hover)] text-[var(--text)] hover:bg-[var(--border)]',
    ghost: 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-lg transition-colors
        focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50
        ${iconSizeClasses[size]}
        ${variantStyles[variant]}
        ${className}
      `}
      aria-label={label}
      {...props}
    >
      {icon}
    </button>
  );
}

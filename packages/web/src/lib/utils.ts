import { clsx, type ClassValue } from 'clsx';

/**
 * 合并 className 的工具函数
 * 
 * @example
 * ```tsx
 * <div className={cn('base-class', condition && 'conditional-class', ['array', 'classes'])} />
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

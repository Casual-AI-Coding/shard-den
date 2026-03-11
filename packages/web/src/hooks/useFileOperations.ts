'use client';

import { useCallback, useRef, useState } from 'react';

export interface FileImportOptions {
  /** 接受的文件类型 */
  accept?: string;
  /** 是否允许多选 */
  multiple?: boolean;
  /** 文件大小限制（字节），默认 10MB */
  maxFileSize?: number;
  /** 文件读取完成回调 */
  onFileRead?: (content: string, file: File) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
}

// 默认最大文件大小: 10MB
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

// URL 请求超时时间
const URL_REQUEST_TIMEOUT = 30000;

export interface FileExportOptions {
  /** 文件内容 */
  content: string;
  /** 文件名 */
  filename: string;
  /** MIME 类型 */
  mimeType?: string;
}

// 文件导出错误类型
export type FileErrorType = 
  | 'file_read_error'
  | 'file_size_exceeded'
  | 'file_type_mismatch'
  | 'network_error'
  | 'timeout'
  | 'export_error'
  | 'unknown';

export interface FileError {
  type: FileErrorType;
  message: string;
  originalError?: Error;
}

export interface UseFileOperationsReturn {
  /** 触发文件选择 */
  selectFile: () => void;
  /** 导出文件 */
  exportFile: (options: FileExportOptions) => void;
  /** 从 URL 导入 */
  importFromUrl: (url: string) => Promise<string | null>;
  /** 读取文件为文本 */
  readFileAsText: (file: File) => Promise<string | null>;
  /** 验证文件 */
  validateFile: (file: File) => FileError | null;
  /** 文件输入 ref (用于触发文件选择) */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  /** 导入状态 */
  isImporting: boolean;
  /** 导出状态 */
  isExporting: boolean;
  /** 最后错误 */
  lastError: FileError | null;
}

/**
 * 文件操作 Hook
 * 
 * 提供文件导入导出功能，包括：
 * - 文件选择和读取
 * - 从 URL 获取内容
 * - 文件下载
 * 
 * @example
 * ```tsx
 * const { selectFile, exportFile, importFromUrl, fileInputRef, validateFile } = useFileOperations({
 *   accept: '.json,.txt',
 *   maxFileSize: 5 * 1024 * 1024, // 5MB
 *   onFileRead: (content) => setInput(content),
 *   onError: (error) => showError(error)
 * });
 * 
 * return (
 *   <input 
 *     ref={fileInputRef} 
 *     type="file" 
 *     accept=".json,.txt"
 *     className="hidden"
 *     onChange={handleFileChange}
 *   />
 * );
 * ```
 */
export function useFileOperations(
  options: FileImportOptions = {}
): UseFileOperationsReturn {
  const {
    accept = '*/*',
    multiple = false,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    onFileRead,
    onError
  } = options;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastError, setLastError] = useState<FileError | null>(null);

  // 创建错误对象
  const createError = (type: FileErrorType, message: string, originalError?: Error): FileError => {
    const error: FileError = { type, message, originalError };
    setLastError(error);
    return error;
  };

  // 验证文件
  const validateFile = useCallback((file: File): FileError | null => {
    // 检查文件大小
    if (file.size > maxFileSize) {
      const sizeMB = (maxFileSize / (1024 * 1024)).toFixed(0);
      return createError(
        'file_size_exceeded', 
        `文件大小超过限制 (最大 ${sizeMB}MB): ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      );
    }

    // 检查文件类型
    if (accept !== '*/*' && accept) {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      
      const isValidType = acceptedTypes.some(type => {
        // 处理 MIME 类型 (如 application/json)
        if (type.startsWith('.')) {
          return fileName.endsWith(type);
        }
        // 处理通配符 (如 text/*)
        if (type.endsWith('/*')) {
          const baseType = type.replace('/*', '');
          return fileType.startsWith(baseType + '/');
        }
        // 精确匹配
        return fileType === type;
      });

      if (!isValidType) {
        return createError(
          'file_type_mismatch',
          `不支持的文件类型: ${file.type || '未知'}`
        );
      }
    }

    return null;
  }, [accept, maxFileSize]);

  // 触发文件选择
  const selectFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 读取文件为文本
  const readFileAsText = useCallback(async (file: File): Promise<string | null> => {
    // 验证文件
    const validationError = validateFile(file);
    if (validationError) {
      onError?.(validationError.message);
      return null;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          resolve(content);
        } else {
          createError('file_read_error', '文件读取失败：无法解析文件内容');
          onError?.('文件读取失败：无法解析文件内容');
          resolve(null);
        }
      };
      
      reader.onerror = () => {
        createError('file_read_error', '文件读取失败', reader.error as Error);
        onError?.('文件读取失败');
        resolve(null);
      };
      
      reader.readAsText(file);
    });
  }, [validateFile, onError]);

  // 从 URL 导入
  const importFromUrl = useCallback(async (url: string): Promise<string | null> => {
    // URL 验证
    try {
      new URL(url);
    } catch {
      createError('network_error', '无效的 URL 地址');
      onError?.('无效的 URL 地址');
      return null;
    }

    setIsImporting(true);
    
    // 创建带超时的 fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), URL_REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        createError('network_error', errorMsg);
        onError?.(errorMsg);
        return null;
      }
      
      const text = await response.text();
      return text;
    } catch (err) {
      clearTimeout(timeoutId);
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          createError('timeout', `请求超时 (${URL_REQUEST_TIMEOUT / 1000}秒)`);
          onError?.(`请求超时，请检查网络连接`);
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          createError('network_error', '网络错误，请检查网络连接');
          onError?.('网络错误，请检查网络连接');
        } else {
          createError('unknown', err.message);
          onError?.(err.message);
        }
      } else {
        createError('unknown', 'URL 导入失败');
        onError?.('URL 导入失败');
      }
      return null;
    } finally {
      setIsImporting(false);
    }
  }, [onError]);

  // 导出文件
  const exportFile = useCallback((options: FileExportOptions) => {
    const { content, filename, mimeType = 'text/plain;charset=utf-8' } = options;
    
    if (!content) {
      createError('export_error', '没有内容可导出');
      onError?.('没有内容可导出');
      return;
    }

    setIsExporting(true);
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      setLastError(null); // 清除之前的错误
    } catch (err) {
      const message = err instanceof Error ? err.message : '文件导出失败';
      createError('export_error', message);
      onError?.(message);
    } finally {
      setIsExporting(false);
    }
  }, [onError]);

  return {
    selectFile,
    exportFile,
    importFromUrl,
    readFileAsText,
    validateFile,
    fileInputRef,
    isImporting,
    isExporting,
    lastError
  };
}

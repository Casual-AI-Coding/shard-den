'use client';

import { useCallback, useRef, useState } from 'react';

export interface FileError {
  code: 'SIZE_EXCEEDED' | 'TYPE_MISMATCH' | 'READ_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
  details?: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: FileError;
}

export interface FileImportOptions {
  accept?: string;
  multiple?: boolean;
  maxFileSize?: number;
  allowedTypes?: string[];
  urlTimeout?: number;
  onFileRead?: (content: string, file: File) => void;
  onError?: (error: string) => void;
}

export interface FileExportOptions {
  content: string;
  filename: string;
  mimeType?: string;
}

export interface UseFileOperationsReturn {
  selectFile: () => void;
  exportFile: (options: FileExportOptions) => void;
  importFromUrl: (url: string) => Promise<string | null>;
  readFileAsText: (file: File) => Promise<string | null>;
  validateFile: (file: File) => FileValidationResult;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isImporting: boolean;
  isExporting: boolean;
  lastError: FileError | null;
}

export function useFileOperations(
  options: FileImportOptions = {}
): UseFileOperationsReturn {
  const {
    accept = '*/*',
    multiple = false,
    maxFileSize = 10 * 1024 * 1024,
    allowedTypes = [],
    urlTimeout = 30000,
    onFileRead,
    onError
  } = options;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastError, setLastError] = useState<FileError | null>(null);

  const validateFile = useCallback((file: File): FileValidationResult => {
    if (maxFileSize && file.size > maxFileSize) {
      const error: FileError = {
        code: 'SIZE_EXCEEDED',
        message: `文件大小超过限制 (最大 ${Math.round(maxFileSize / 1024 / 1024)}MB)`,
        details: `当前文件大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      };
      setLastError(error);
      return { valid: false, error };
    }

    if (allowedTypes.length > 0) {
      const fileType = file.type;
      const fileName = file.name.toLowerCase();
      const isValidType = allowedTypes.some(type => {
        const t = type.toLowerCase();
        return fileType === t || fileName.endsWith(t) || t === '*/*';
      });
      
      if (!isValidType) {
        const error: FileError = {
          code: 'TYPE_MISMATCH',
          message: '不支持的文件类型',
          details: `允许的类型: ${allowedTypes.join(', ')}`
        };
        setLastError(error);
        return { valid: false, error };
      }
    }

    setLastError(null);
    return { valid: true };
  }, [maxFileSize, allowedTypes]);

  const selectFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const readFileAsText = useCallback(async (file: File): Promise<string | null> => {
    const validation = validateFile(file);
    if (!validation.valid) {
      onError?.(validation.error?.message || '文件验证失败');
      return null;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          resolve(content);
        } else {
          const error: FileError = {
            code: 'READ_ERROR',
            message: '文件内容读取失败'
          };
          setLastError(error);
          onError?.(error.message);
          resolve(null);
        }
      };
      
      reader.onerror = () => {
        const error: FileError = {
          code: 'READ_ERROR',
          message: '文件读取失败'
        };
        setLastError(error);
        onError?.(error.message);
        resolve(null);
      };
      
      reader.readAsText(file);
    });
  }, [validateFile, onError]);

  const importFromUrl = useCallback(async (url: string): Promise<string | null> => {
    setIsImporting(true);
    setLastError(null);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), urlTimeout);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error: FileError = {
          code: 'NETWORK_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
          details: url
        };
        setLastError(error);
        onError?.(error.message);
        return null;
      }

      const text = await response.text();
      return text;
    } catch (err) {
      const error: FileError = {
        code: err instanceof Error && err.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
        message: err instanceof Error && err.name === 'AbortError' 
          ? `请求超时 (${urlTimeout / 1000}秒)` 
          : 'URL 导入失败',
        details: err instanceof Error ? err.message : undefined
      };
      setLastError(error);
      onError?.(error.message);
      return null;
    } finally {
      setIsImporting(false);
    }
  }, [urlTimeout, onError]);

  const exportFile = useCallback((options: FileExportOptions) => {
    const { content, filename, mimeType = 'text/plain;charset=utf-8' } = options;
    
    if (!content) {
      const error: FileError = {
        code: 'UNKNOWN',
        message: '没有内容可导出'
      };
      setLastError(error);
      onError?.(error.message);
      return;
    }

    setIsExporting(true);
    setLastError(null);
    
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
    } catch (err) {
      const error: FileError = {
        code: 'UNKNOWN',
        message: '文件导出失败',
        details: err instanceof Error ? err.message : undefined
      };
      setLastError(error);
      onError?.(error.message);
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

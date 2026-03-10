'use client';

import { useCallback, useRef, useState } from 'react';

export interface FileImportOptions {
  /** 接受的文件类型 */
  accept?: string;
  /** 是否允许多选 */
  multiple?: boolean;
  /** 文件读取完成回调 */
  onFileRead?: (content: string, file: File) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
}

export interface FileExportOptions {
  /** 文件内容 */
  content: string;
  /** 文件名 */
  filename: string;
  /** MIME 类型 */
  mimeType?: string;
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
  /** 文件输入 ref (用于触发文件选择) */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  /** 导入状态 */
  isImporting: boolean;
  /** 导出状态 */
  isExporting: boolean;
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
 * const { selectFile, exportFile, importFromUrl, fileInputRef } = useFileOperations({
 *   accept: '.json,.txt',
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
    onFileRead,
    onError
  } = options;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // 触发文件选择
  const selectFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 读取文件为文本
  const readFileAsText = useCallback(async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          resolve(content);
        } else {
          resolve(null);
        }
      };
      
      reader.onerror = () => {
        onError?.('文件读取失败');
        resolve(null);
      };
      
      reader.readAsText(file);
    });
  }, [onError]);

  // 从 URL 导入
  const importFromUrl = useCallback(async (url: string): Promise<string | null> => {
    setIsImporting(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      return text;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'URL 导入失败';
      onError?.(message);
      return null;
    } finally {
      setIsImporting(false);
    }
  }, [onError]);

  // 导出文件
  const exportFile = useCallback((options: FileExportOptions) => {
    const { content, filename, mimeType = 'text/plain;charset=utf-8' } = options;
    
    if (!content) {
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
    } catch (err) {
      const message = err instanceof Error ? err.message : '文件导出失败';
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
    fileInputRef,
    isImporting,
    isExporting
  };
}

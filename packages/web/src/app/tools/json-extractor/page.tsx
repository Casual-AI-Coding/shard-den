'use client';

import React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { HelpButton } from '@/components/ui/HelpButton';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { StatusBar } from '@/components/tools/StatusBar';
import { initWasm, JsonExtractor } from '@/lib/core';
import { saveExtractionHistory, isTauri } from '@/lib/tauri';
import { useToolState } from '@/hooks/useToolState';
import { useClipboard } from '@/hooks/useClipboard';
import { useFileOperations } from '@/hooks/useFileOperations';
import { Copy } from 'lucide-react';
import {
  InputPanel,
  OutputPanel,
  UrlImportModal,
  ToastContainer,
  useToast,
} from './components';
import { findJsonPath, findJsonPathByPosition } from './utils';

const JSONPATH_HELP = [
  { code: 'key', desc: '获取对象属性' },
  { code: '[*]', desc: '数组通配符' },
  { code: '[0]', desc: '数组索引' },
  { code: '..', desc: '递归下降' },
  { code: '[?(@.x)]', desc: '过滤表达式' },
];

export default function JsonExtractorPage() {
  // 使用统一的工具状态管理
  const {
    input,
    output,
    error,
    isLoading,
    setInput,
    setOutput,
    setError,
    setIsLoading,
    reset
  } = useToolState<string, string>({
    persistToSessionStorage: true,
    sessionStorageKey: 'json-extractor-input'
  });

  // 额外的状态
  const [paths, setPaths] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('json-extractor-paths') || '';
    }
    return '';
  });
  const [format, setFormat] = useState('json');
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{x: number; y: number; text: string; cursorPos: number} | null>(null);
  const [isValidJson, setIsValidJson] = useState<boolean | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Toast
  const { toasts, dismissToast, success, error: showError, warning } = useToast();

  // 剪贴板操作
  const { copy: copyToClipboard } = useClipboard();

  // 文件操作
  const { exportFile, importFromUrl, readFileAsText, onError: handleFileError } = useFileOperations({
    onError: (msg) => showError(msg)
  });

  // 初始化 WASM
  useEffect(() => {
    initWasm()
      .then(() => setIsLoading(false))
      .catch((e) => {
        setError('WASM 加载失败: ' + (e instanceof Error ? e.message : String(e)));
        setIsLoading(false);
      });
  }, [setError, setIsLoading]);

  // JSON 验证 (防抖)
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (!input.trim()) {
      setIsValidJson(null);
      return;
    }
    debounceTimerRef.current = setTimeout(() => {
      try {
        JSON.parse(input);
        setIsValidJson(true);
      } catch {
        setIsValidJson(false);
      }
    }, 500);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [input]);

  // 持久化 paths
  useEffect(() => { if (paths) sessionStorage.setItem('json-extractor-paths', paths); }, [paths]);

  const handleShowToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    if (type === 'success') success(message);
    else if (type === 'error') showError(message);
    else if (type === 'warning') warning(message);
    else success(message);
  }, [success, showError, warning]);

  const handleExtract = useCallback(async () => {
    setError(null);
    setOutput('');
    if (!input.trim()) { setError('请输入 JSON 数据'); return; }
    if (!paths.trim()) { setError('请输入 JSONPath 表达式'); return; }
    try {
      const result = await JsonExtractor.extract(input, paths, format);
      setOutput(result);
      success('提取成功！');
      
      // Save to history in Desktop mode
      if (isTauri()) {
        saveExtractionHistory(input, paths, result, format).catch(console.error);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误';
      setError(msg);
      showError('提取失败: ' + msg);
    }
  }, [input, paths, format, success, showError, setError, setOutput]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const content = await readFileAsText(file);
    if (content) {
      try {
        const parsed = JSON.parse(content);
        setInput(JSON.stringify(parsed, null, 2));
        success('文件导入成功！');
      } catch {
        setInput(content);
        success('文件导入成功（未格式化）');
      }
    }
    e.target.value = '';
  }, [readFileAsText, setInput, success]);

  const handleCopy = useCallback(() => {
    if (output) {
      copyToClipboard(output);
      success('已复制到剪贴板！');
    }
  }, [output, copyToClipboard, success]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const ext = format === 'json' ? 'json' : format === 'csv' ? 'csv' : format === 'yaml' ? 'yaml' : 'txt';
    exportFile({
      content: output,
      filename: `extracted.${ext}`,
      mimeType: 'text/plain;charset=utf-8'
    });
    success('文件下载成功！');
  }, [output, format, exportFile, success]);

  const handleUrlImport = useCallback(async (url: string) => {
    const content = await importFromUrl(url);
    if (content) {
      try {
        const parsed = JSON.parse(content);
        setInput(JSON.stringify(parsed, null, 2));
        success('URL 导入成功！');
      } catch {
        setInput(content);
        success('URL 导入成功（未格式化）');
      }
    }
  }, [importFromUrl, setInput, success]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      JSON.parse(text);
      setInput(text);
      success('粘贴成功！');
    } catch { showError('剪贴板内容不是有效的 JSON'); }
  }, [setInput, success, showError]);

  const handleClear = useCallback(() => {
    setInput('');
    setPaths('');
    setOutput('');
    setError('');
  }, [setInput, setOutput, setError]);

  const handleFormatJson = useCallback(() => {
    if (!input.trim()) { showError('请输入 JSON 数据'); return; }
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
      success('格式化成功！');
    } catch { showError('无效的 JSON，无法格式化'); }
  }, [input, setInput, success, showError]);

  const handleContextMenu = useCallback((e: React.MouseEvent, text: string, selectionStart: number, _selectionEnd: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, text, cursorPos: selectionStart });
  }, []);

  const handleCopyRaw = useCallback(() => {
    if (contextMenu?.text) {
      copyToClipboard(contextMenu.text);
      success('已复制: ' + contextMenu.text);
    } else {
      success('请先选中内容');
    }
    setContextMenu(null);
  }, [contextMenu, copyToClipboard, success]);

  const handleCopyJsonPath = useCallback(() => {
    if (!input) {
      success('请先输入 JSON');
      setContextMenu(null);
      return;
    }
    
    // 优先：根据位置精确查找
    if (contextMenu?.cursorPos !== undefined) {
      const jpByPos = findJsonPathByPosition(input, contextMenu.cursorPos);
      if (jpByPos) {
        copyToClipboard(jpByPos);
        success('已复制: ' + jpByPos);
        setContextMenu(null);
        return;
      }
    }
    
    // 后备：根据文本匹配
    if (contextMenu?.text) {
      const jp = findJsonPath(input, contextMenu.text);
      if (jp) {
        copyToClipboard(jp);
        success('已复制: ' + jp);
      } else {
        success('未找到对应的 JSONPath');
      }
    } else {
      success('请先选中内容');
    }
    setContextMenu(null);
  }, [contextMenu, input, copyToClipboard, success]);

  // 点击外部关闭右键菜单
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <Header title="JSON 提取器">
        <HelpButton content={JSONPATH_HELP} />
      </Header>
      <main className="flex-1 p-6 overflow-auto bg-[var(--bg)]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3 text-[var(--text-secondary)]">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>加载中...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* 错误状态显示 */}
            {error && (
              <div className="lg:col-span-2">
                <StatusBar 
                  type="error" 
                  message={error} 
                  onDismiss={() => setError(null)} 
                />
              </div>
            )}
            <div className="h-full min-h-[500px]">
              <InputPanel 
                input={input} 
                onInputChange={setInput} 
                paths={paths} 
                onPathsChange={setPaths}
                onExtract={handleExtract} 
                onClear={handleClear} 
                onFormat={handleFormatJson}
                onPaste={handlePaste} 
                onFileUpload={handleFileUpload} 
                onUrlImport={() => setShowUrlModal(true)}
                onShowToast={handleShowToast} 
                onContextMenu={handleContextMenu} 
                isValidJson={isValidJson} 
                isLoading={isLoading} 
              />
            </div>
            <div className="h-full min-h-[500px]">
              <OutputPanel 
                output={output} 
                error={error} 
                format={format} 
                onFormatChange={setFormat}
                onCopy={handleCopy} 
                onDownload={handleDownload} 
              />
            </div>
          </div>
        )}
      </main>
      <UrlImportModal isOpen={showUrlModal} onClose={() => setShowUrlModal(false)} onImport={handleUrlImport} />
      {contextMenu && (
        <div className="fixed z-50 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[150px]"
          style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(e) => e.stopPropagation()}>
          <button onClick={handleCopyRaw} className="w-full px-4 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--hover)] flex items-center gap-2">
            <Copy className="w-4 h-4" />复制
          </button>
          <button onClick={handleCopyJsonPath} className="w-full px-4 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--hover)] flex items-center gap-2">
            <Copy className="w-4 h-4" />复制JSONPath
          </button>
        </div>
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { HelpButton } from '@/components/ui/HelpButton';
import { initWasm, JsonExtractor } from '@/lib/core';
import { Copy } from 'lucide-react';
import {
  InputPanel,
  OutputPanel,
  UrlImportModal,
  ToastContainer,
  useToast,
} from './components';

const JSONPATH_HELP = [
  { code: 'key', desc: '获取对象属性' },
  { code: '[*]', desc: '数组通配符' },
  { code: '[0]', desc: '数组索引' },
  { code: '..', desc: '递归下降' },
  { code: '[?(@.x)]', desc: '过滤表达式' },
];

export default function JsonExtractorPage() {
  const [input, setInput] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('json-extractor-input') || '';
    }
    return '';
  });
  const [paths, setPaths] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('json-extractor-paths') || '';
    }
    return '';
  });
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [format, setFormat] = useState('json');
  const [isLoading, setIsLoading] = useState(true);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{x: number; y: number; text: string} | null>(null);
  const [isValidJson, setIsValidJson] = useState<boolean | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { toasts, dismissToast, success, error: showError, warning } = useToast();

  useEffect(() => {
    initWasm()
      .then(() => setIsLoading(false))
      .catch((e) => {
        setError('WASM 加载失败: ' + (e instanceof Error ? e.message : String(e)));
        setIsLoading(false);
      });
  }, []);

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

  useEffect(() => { if (input) sessionStorage.setItem('json-extractor-input', input); }, [input]);
  useEffect(() => { if (paths) sessionStorage.setItem('json-extractor-paths', paths); }, [paths]);

  const handleShowToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    if (type === 'success') success(message);
    else if (type === 'error') showError(message);
    else if (type === 'warning') warning(message);
    else success(message);
  }, [success, showError, warning]);

  const handleExtract = useCallback(async () => {
    setError('');
    setOutput('');
    if (!input.trim()) { setError('请输入 JSON 数据'); return; }
    if (!paths.trim()) { setError('请输入 JSONPath 表达式'); return; }
    try {
      const result = await JsonExtractor.extract(input, paths, format);
      setOutput(result);
      success('提取成功！');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误';
      setError(msg);
      showError('提取失败: ' + msg);
    }
  }, [input, paths, format, success, showError]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        try {
          const parsed = JSON.parse(text);
          setInput(JSON.stringify(parsed, null, 2));
          success('文件导入成功！');
        } catch {
          setInput(text);
          success('文件导入成功（未格式化）');
        }
      }
    };
    reader.onerror = () => showError('文件读取失败');
    reader.readAsText(file);
    e.target.value = '';
  }, [success, showError]);

  const handleCopy = useCallback(() => {
    if (output) { navigator.clipboard.writeText(output); success('已复制到剪贴板！'); }
  }, [output, success]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const ext = format === 'json' ? 'json' : format === 'csv' ? 'csv' : format === 'yaml' ? 'yaml' : 'txt';
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `extracted.${ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('文件下载成功！');
  }, [output, format, success]);

  const handleUrlImport = useCallback((text: string) => {
    try {
      const parsed = JSON.parse(text);
      setInput(JSON.stringify(parsed, null, 2));
      success('URL 导入成功！');
    } catch { setInput(text); success('URL 导入成功（未格式化）'); }
  }, [success]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      JSON.parse(text);
      setInput(text);
      success('粘贴成功！');
    } catch { showError('剪贴板内容不是有效的 JSON'); }
  }, [success, showError]);

  const handleClear = useCallback(() => { setInput(''); setPaths(''); setOutput(''); setError(''); }, []);

  const handleFormatJson = useCallback(() => {
    if (!input.trim()) { showError('请输入 JSON 数据'); return; }
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
      success('格式化成功！');
    } catch { showError('无效的 JSON，无法格式化'); }
  }, [input, success, showError]);

  const handleCopySelected = useCallback(() => {
    if (contextMenu?.text) { navigator.clipboard.writeText(contextMenu.text); success('已复制！'); }
    setContextMenu(null);
  }, [contextMenu, success]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <Header title="JSON 提取器"><HelpButton content={JSONPATH_HELP} /></Header>
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
            <div className="h-full min-h-[500px]">
              <InputPanel input={input} onInputChange={setInput} paths={paths} onPathsChange={setPaths}
                onExtract={handleExtract} onClear={handleClear} onFormat={handleFormatJson}
                onPaste={handlePaste} onFileUpload={handleFileUpload} onUrlImport={() => setShowUrlModal(true)}
                onShowToast={handleShowToast} isValidJson={isValidJson} isLoading={isLoading} />
            </div>
            <div className="h-full min-h-[500px]">
              <OutputPanel output={output} error={error} format={format} onFormatChange={setFormat}
                onCopy={handleCopy} onDownload={handleDownload} />
            </div>
          </div>
        )}
      </main>
      <UrlImportModal isOpen={showUrlModal} onClose={() => setShowUrlModal(false)} onImport={handleUrlImport} />
      {contextMenu && (
        <div className="fixed z-50 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[150px]"
          style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(e) => e.stopPropagation()}>
          <button onClick={handleCopySelected} className="w-full px-4 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--hover)] flex items-center gap-2">
            <Copy className="w-4 h-4" />复制
          </button>
        </div>
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

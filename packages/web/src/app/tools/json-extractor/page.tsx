'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { HelpButton } from '@/components/ui/HelpButton';
import { initWasm, JsonExtractor } from '@/lib/core';
import { Upload, Wand2, Trash2, Copy, Search, Download, Link2, Clipboard } from 'lucide-react';

const JSONPATH_HELP = [
  { code: 'key', desc: '获取对象属性' },
  { code: '[*]', desc: '数组通配符' },
  { code: '[0]', desc: '数组索引' },
  { code: '..', desc: '递归下降' },
  { code: '[?(@.x)]', desc: '过滤表达式' },
];

export default function JsonExtractorPage() {
  const [input, setInput] = useState(() => {
    // sessionStorage persistence
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
  const [extractor, setExtractor] = useState<any>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [contextMenu, setContextMenu] = useState<{x: number; y: number; text: string} | null>(null);
  const [detectedPaths, setDetectedPaths] = useState<string[]>([]);
  const [showPathsPopup, setShowPathsPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isValidJson, setIsValidJson] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initWasm()
      .then(() => JsonExtractor.create())
      .then((ex) => {
        setExtractor(ex);
        setIsLoading(false);
      })
      .catch((e) => {
        setError('WASM 加载失败: ' + (e instanceof Error ? e.message : String(e)));
        setIsLoading(false);
      });
  }, []);

  // Debounced JSON validation (500ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

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

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [input]);

  // sessionStorage persistence
  useEffect(() => {
    if (input) {
      sessionStorage.setItem('json-extractor-input', input);
    }
  }, [input]);

  useEffect(() => {
    if (paths) {
      sessionStorage.setItem('json-extractor-paths', paths);
    }
  }, [paths]);

  const handleExtract = useCallback(async () => {
    setError('');
    setOutput('');

    if (!input.trim()) {
      setError('请输入 JSON 数据');
      return;
    }
    if (!paths.trim()) {
      setError('请输入 JSONPath 表达式');
      return;
    }

    try {
      const result = extractor.extract_with_format(input, paths, format);
      setOutput(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
    }
  }, [input, paths, format, extractor]);

  const handleDetect = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    setError('');
    setOutput('');

    if (!input.trim()) {
      setError('请输入 JSON 数据');
      return;
    }

    try {
      const detectedPaths = extractor.detect_paths(input);
      const paths = JSON.parse(detectedPaths);
      setDetectedPaths(paths);
      // Position popup near the button
      const rect = e.currentTarget.getBoundingClientRect();
      setPopupPosition({ x: rect.left, y: rect.bottom + 8 });
      setShowPathsPopup(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
    }
  }, [input, extractor]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setInput(text);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleCopy = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output);
    }
  }, [output]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    
    const ext = format === 'json' ? 'json' : format === 'csv' ? 'csv' : format === 'yaml' ? 'yaml' : 'txt';
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [output, format]);

  // URL import handler
  const handleUrlImport = useCallback(async () => {
    if (!urlInput.trim()) {
      setError('请输入 URL');
      return;
    }
    
    setIsLoadingUrl(true);
    setError('');
    
    try {
      const response = await fetch(urlInput);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      JSON.parse(text); // Validate JSON
      setInput(text);
      setShowUrlInput(false);
      setUrlInput('');
    } catch (e) {
      setError('URL 导入失败: ' + (e instanceof Error ? e.message : '未知错误'));
    } finally {
      setIsLoadingUrl(false);
    }
  }, [urlInput]);

  // Paste handler
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      JSON.parse(text);
      setInput(text);
    } catch {
      setError('剪贴板内容不是有效的 JSON');
    }
  }, []);

  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const selection = window.getSelection()?.toString() || '';
    if (selection) {
      setContextMenu({ x: e.clientX, y: e.clientY, text: selection });
    }
  }, []);

  const handleCopySelected = useCallback(() => {
    if (contextMenu?.text) {
      navigator.clipboard.writeText(contextMenu.text);
    }
    setContextMenu(null);
  }, [contextMenu]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setPaths('');
    setOutput('');
    setError('');
    setUrlInput('');
    setShowUrlInput(false);
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
            {/* Left Panel: Input */}
            <div className="space-y-4 flex flex-col">
              {/* JSON Input */}
              <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden flex-1 flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--text)]">输入</span>
                    {isValidJson === true && (
                      <span className="text-green-500" title="有效的 JSON">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                    {isValidJson === false && (
                      <span className="text-red-500" title="无效的 JSON">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Paste button */}
                    <button
                      onClick={handlePaste}
                      className="flex items-center gap-1 px-2 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded-lg transition-colors"
                      title="从剪贴板粘贴"
                    >
                      <Clipboard className="w-4 h-4" />
                    </button>
                    {/* URL import button */}
                    <button
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="flex items-center gap-1 px-2 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded-lg transition-colors"
                      title="从 URL 导入"
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                    {/* File upload */}
                    <label className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] bg-[var(--hover)] rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      上传
                      <input 
                        type="file" 
                        accept=".json,application/json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                {/* URL Input */}
                {showUrlInput && (
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--hover)]">
                    <input
                      ref={urlInputRef}
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/data.json"
                      className="flex-1 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      onClick={handleUrlImport}
                      disabled={isLoadingUrl}
                      className="px-3 py-1.5 bg-[var(--accent)] hover:opacity-90 text-[var(--bg)] text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isLoadingUrl ? '加载中...' : '导入'}
                    </button>
                  </div>
                )}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder='{"items": [{"id": 1, "name": "test"}]}'
                  className="flex-1 w-full p-4 bg-transparent font-mono text-sm text-[var(--text)] placeholder-[var(--text-secondary)] focus:outline-none resize-none"
                  spellCheck={false}
                />
              </div>

              {/* JSONPath Input */}
              <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <span className="font-medium text-[var(--text)]">JSONPath 表达式</span>
                </div>
                <input
                  type="text"
                  value={paths}
                  onChange={(e) => setPaths(e.target.value)}
                  placeholder="$.items[*].name, $.items[*].id"
                  className="w-full px-4 py-3 bg-transparent font-mono text-sm text-[var(--text)] placeholder-[var(--text-secondary)] focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExtract}
                  disabled={!extractor}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--accent)] hover:opacity-90 text-[var(--bg)] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wand2 className="w-4 h-4" />
                  提取
                </button>

                <button
                  onClick={handleDetect}
                  disabled={!extractor}
                  className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--hover)] text-[var(--text)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="检测可用路径"
                >
                  <Search className="w-4 h-4" />
                </button>

                <button
                  onClick={handleClear}
                  className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--hover)] text-[var(--text-secondary)] rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Panel: Output */}
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden flex flex-col">
              <div className="flex items-center px-4 py-3 border-b border-[var(--border)]">
                <span className="font-medium text-[var(--text)]">输出</span>
              </div>
              
              {error && (
                <div className="m-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
              
              <textarea
                value={output}
                readOnly
                placeholder="结果将显示在这里..."
                className="flex-1 w-full p-4 bg-transparent font-mono text-sm text-[var(--text)] placeholder-[var(--text-secondary)] focus:outline-none resize-none"
                spellCheck={false}
              />
              
              {/* Bottom Actions */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="text">Text</option>
                  <option value="yaml">YAML</option>
                </select>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={!output}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] bg-[var(--hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy className="w-4 h-4" />
                    复制
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!output}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] bg-[var(--hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[150px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleCopySelected}
            className="w-full px-4 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--hover)] transition-colors flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            复制
          </button>
        </div>
      )}

      {/* Detected Paths Popup */}
      {showPathsPopup && (
        <div
          className="fixed z-50 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg max-w-md max-h-96 overflow-auto"
          style={{ left: popupPosition.x, top: popupPosition.y }}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
            <span className="font-medium text-sm text-[var(--text)]">可用路径</span>
            <button
              onClick={() => setShowPathsPopup(false)}
              className="text-[var(--text-secondary)] hover:text-[var(--text)] text-lg leading-none"
            >
              ×
            </button>
          </div>
          <div className="p-2">
            {detectedPaths.map((path, index) => (
              <button
                key={index}
                onClick={() => {
                  setPaths(path);
                  setShowPathsPopup(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm font-mono text-[var(--text)] hover:bg-[var(--hover)] rounded transition-colors"
              >
                {path}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

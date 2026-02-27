'use client';

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Trash2, FileJson, Clipboard, Link2, Upload, Search, Wand2 } from 'lucide-react';
import { JsonExtractor } from '@/lib/core';

interface InputPanelProps {
  input: string;
  onInputChange: (value: string) => void;
  paths: string;
  onPathsChange: (value: string) => void;
  onExtract: () => void;
  onClear: () => void;
  onFormat: () => void;
  onPaste: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlImport: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onContextMenu?: (e: React.MouseEvent, text: string, selectionStart: number, selectionEnd: number) => void;
  isValidJson: boolean | null;
  isLoading: boolean;
}

export function InputPanel({
  input,
  onInputChange,
  paths,
  onPathsChange,
  onExtract,
  onClear,
  onFormat,
  onPaste,
  onFileUpload,
  onUrlImport,
  onShowToast,
  onContextMenu,
  isValidJson,
  isLoading,
}: InputPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const detectButtonRef = useRef<HTMLButtonElement>(null);
  const [detectedPaths, setDetectedPaths] = useState<string[]>([]);
  const [showPathsPopup, setShowPathsPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const handleDetect = async () => {
    if (!input.trim()) return;

    const rect = detectButtonRef.current?.getBoundingClientRect();
    if (!rect) return;

    try {
      const detected = await JsonExtractor.detect(input);
      setDetectedPaths(detected);

      if (detected.length === 0) {
        onShowToast?.('warning', '未检测到可用路径');
        return;
      }

      const pathCount = detected.length;
      const estimatedPopupHeight = Math.min(pathCount * 34 + 70, 205);
      const spaceBelow = window.innerHeight - rect.bottom;

      const showBelow = pathCount >= 3 && pathCount > 0 && spaceBelow > estimatedPopupHeight + 20;

      setPopupPosition({
        x: rect.left,
        y: showBelow ? rect.bottom + 8 : rect.top - estimatedPopupHeight - 8
      });
      setShowPathsPopup(true);
    } catch (e) {
      console.error(e);
      onShowToast?.('error', '检测路径失败');
    }
  };

  useEffect(() => {
    const handleClick = () => setShowPathsPopup(false);
    if (showPathsPopup) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showPathsPopup]);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-[var(--surface)] rounded-t-xl border border-[var(--border)] border-b-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--text)]">输入</span>
            {isValidJson === true && (
              <span className="text-green-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
            {isValidJson === false && (
              <span className="text-red-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            )}
          </div>
        <div className="flex items-center gap-0.5">
            <button onClick={onClear} className="flex items-center gap-1 px-2.5 py-1.5 text-xs xl:text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded">
              <Trash2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">清除</span>
            </button>
            <button onClick={onFormat} className="flex items-center gap-1 px-2.5 py-1.5 text-xs xl:text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded">
              <FileJson className="w-3.5 h-3.5" /><span className="hidden sm:inline">格式化</span>
            </button>
            <button onClick={onPaste} className="flex items-center gap-1 px-2.5 py-1.5 text-xs xl:text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded">
              <Clipboard className="w-3.5 h-3.5" /><span className="hidden sm:inline">粘贴</span>
            </button>
            <button onClick={onUrlImport} className="flex items-center gap-1 px-2.5 py-1.5 text-xs xl:text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded">
              <Link2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">URL 导入</span>
            </button>
            <label className="flex items-center gap-1 px-2.5 py-1.5 text-xs xl:text-sm text-[var(--text-secondary)] bg-[var(--hover)] rounded cursor-pointer">
              <Upload className="w-3.5 h-3.5" /><span className="hidden sm:inline">上传</span>
              <input type="file" accept=".json,application/json" onChange={onFileUpload} className="hidden" />
            </label>
          </div>
            <button onClick={onClear} className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded">
              <Trash2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">清除</span>
            </button>
            <button onClick={onFormat} className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded">
              <FileJson className="w-3.5 h-3.5" /><span className="hidden sm:inline">格式化</span>
            </button>
            <button onClick={onPaste} className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded">
              <Clipboard className="w-3.5 h-3.5" /><span className="hidden sm:inline">粘贴</span>
            </button>
            <button onClick={onUrlImport} className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded">
              <Link2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">URL 导入</span>
            </button>
            <label className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-secondary)] bg-[var(--hover)] rounded cursor-pointer">
              <Upload className="w-3.5 h-3.5" /><span className="hidden sm:inline">上传</span>
              <input type="file" accept=".json,application/json" onChange={onFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface)] border-x border-[var(--border)] flex-1 min-h-0">
        <textarea ref={textareaRef} value={input} onChange={(e) => onInputChange(e.target.value)} placeholder='{"items": [{"id": 1, "name": "test"}]}' className="w-full h-full min-h-[200px] p-4 bg-transparent font-mono text-sm text-[var(--text)] placeholder-[var(--text-secondary)] focus:outline-none resize-none" spellCheck={false} 
          onContextMenu={(e) => { 
            e.preventDefault(); 
            const selection = window.getSelection()?.toString() || '';
            const textarea = textareaRef.current;
            const start = textarea?.selectionStart || 0;
            const end = textarea?.selectionEnd || 0;
            onContextMenu?.(e, selection, start, end); 
          }} />
      </div>

      <div className="h-px bg-[var(--border)]" />

      <div className="bg-[var(--surface)] rounded-b-xl border border-[var(--border)] border-t-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="font-medium text-[var(--text)] whitespace-nowrap">JSONPath:</span>
          <input type="text" value={paths} onChange={(e) => onPathsChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onExtract()} placeholder="$.items[*].name, $.items[*].id" className="flex-1 px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg font-mono text-sm text-[var(--text)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]" />
          <button ref={detectButtonRef} onClick={handleDetect} disabled={isLoading || !input.trim()} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--hover)] hover:border-[var(--accent)] text-[var(--text-secondary)] rounded disabled:opacity-50">
            <Search className="w-3.5 h-3.5" /><span>可用路径</span>
          </button>
          <button onClick={onExtract} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] hover:opacity-90 text-[var(--bg)] text-sm font-medium rounded disabled:opacity-50">
            <Wand2 className="w-3.5 h-3.5" />提取
          </button>
        </div>
      </div>

      {showPathsPopup && detectedPaths.length > 0 && (
        <div className="fixed z-50 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg w-auto max-w-[350px]" style={{ left: popupPosition.x, top: popupPosition.y }} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
            <span className="font-medium text-sm text-[var(--text)]">可用路径 ({detectedPaths.length})</span>
            <button onClick={() => setShowPathsPopup(false)} className="text-[var(--text-secondary)] text-lg">×</button>
          </div>
          <div className="max-h-36 overflow-auto p-2">
            {detectedPaths.map((path, index) => (
              <button key={index} onClick={() => { onPathsChange(path); setShowPathsPopup(false); }} className="w-full px-3 py-1.5 text-left text-sm font-mono text-[var(--text)] hover:bg-[var(--hover)] rounded">
                {path}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

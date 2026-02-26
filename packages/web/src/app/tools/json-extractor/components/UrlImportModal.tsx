'use client';

import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface UrlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string) => void;
}

export function UrlImportModal({
  isOpen,
  onClose,
  onImport,
}: UrlImportModalProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError('请输入 URL');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      let response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      let text = await response.text();
      JSON.parse(text);
      onImport(text);
      onClose();
    } catch {
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const proxyResponse = await fetch(proxyUrl);
        if (!proxyResponse.ok) {
          throw new Error(`代理请求失败: HTTP ${proxyResponse.status}`);
        }
        const proxyData = await proxyResponse.json();
        if (!proxyData.contents) {
          throw new Error('代理返回空内容');
        }
        JSON.parse(proxyData.contents);
        onImport(proxyData.contents);
        onClose();
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : '未知错误';
        if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('CORS') || errorMsg.includes('代理')) {
          setError('导入失败: CORS 跨域错误。已尝试代理但仍失败，请下载后通过粘贴或上传文件方式导入。');
        } else {
          setError('导入失败: ' + errorMsg);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text)]">📥 从 URL 导入 JSON</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text)] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">URL</label>
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="https://example.com/data.json"
              className="w-full min-w-[500px] px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)] text-lg"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text)]">
              取消
            </button>
            <button onClick={handleSubmit} disabled={isLoading} className="px-6 py-2 bg-[var(--accent)] hover:opacity-90 text-[var(--bg)] rounded-lg disabled:opacity-50">
              {isLoading ? '导入中...' : '确认导入'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

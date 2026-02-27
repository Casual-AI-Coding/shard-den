'use client';

import React from 'react';
import { Copy, Download } from 'lucide-react';

interface OutputPanelProps {
  output: string;
  error: string;
  format: string;
  onFormatChange: (format: string) => void;
  onCopy: () => void;
  onDownload: () => void;
}

export function OutputPanel({
  output,
  error,
  format,
  onFormatChange,
  onCopy,
  onDownload,
}: OutputPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-[var(--surface)] rounded-t-xl border border-[var(--border)] border-b-0">
        <div className="flex items-center px-4 py-3 border-b border-[var(--border)]">
          <span className="font-medium text-[var(--text)]">输出</span>
        </div>
      </div>

      <div className="bg-[var(--surface)] border-x border-[var(--border)] flex-1 min-h-0">
        {error && (
          <div className="m-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        <textarea
          value={output}
          readOnly
          placeholder="结果将显示在这里..."
          className="w-full h-full min-h-[200px] p-4 bg-transparent font-mono text-sm xl:text-base text-[var(--text)] placeholder-[var(--text-secondary)] focus:outline-none resize-none"
          spellCheck={false}
        />
      </div>

      <div className="h-px bg-[var(--border)]" />

      <div className="bg-[var(--surface)] rounded-b-xl border border-[var(--border)] border-t-0">
        <div className="flex items-center justify-between px-4 py-3">
          <select
            value={format}
            onChange={(e) => onFormatChange(e.target.value)}
            className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="text">Text</option>
            <option value="yaml">YAML</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={onCopy}
              disabled={!output}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] bg-[var(--hover)] rounded-lg disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              复制
            </button>
            <button
              onClick={onDownload}
              disabled={!output}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] bg-[var(--hover)] rounded-lg disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              下载
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

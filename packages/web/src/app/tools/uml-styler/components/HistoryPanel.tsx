'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, 
  X, 
  Trash2, 
  Clock, 
  GitBranch, 
  FileCode,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { loadHistory, clearHistory, saveUmlHistory, type HistoryEntry, isTauri } from '@/lib/tauri';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadEntry: (code: string, engine: string, theme: string) => void;
  currentCode: string;
  currentEngine: string;
  currentTheme: string;
}

export default function HistoryPanel({
  isOpen,
  onClose,
  onLoadEntry,
  currentCode,
  currentEngine,
  currentTheme
}: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(isTauri());
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!isDesktop) return;
    
    setIsLoading(true);
    try {
      const entries = await loadHistory('uml-styler', 50);
      setHistory(entries);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    if (isOpen && isDesktop) {
      fetchHistory();
    }
  }, [isOpen, isDesktop, fetchHistory]);

  const handleSave = async () => {
    if (!isDesktop || !currentCode.trim()) return;
    
    setIsSaving(true);
    try {
      await saveUmlHistory(currentCode, currentEngine, currentTheme);
      await fetchHistory();
    } catch (err) {
      console.error('Failed to save history:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = (entry: HistoryEntry) => {
    const engine = entry.metadata?.engine || 'mermaid';
    const theme = entry.metadata?.theme || 'default';
    onLoadEntry(entry.input, engine, theme);
    onClose();
  };

  const handleClear = async () => {
    if (!isDesktop) return;
    
    const confirmed = window.confirm('确定要清空所有历史记录吗？此操作不可撤销。');
    if (!confirmed) return;
    
    setIsClearing(true);
    try {
      await clearHistory();
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than 1 minute
    if (diff < 60000) {
      return '刚刚';
    }
    // Less than 1 hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} 分钟前`;
    }
    // Less than 1 day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} 小时前`;
    }
    // More than 1 day
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCodeSnippet = (code: string) => {
    const firstLine = code.split('\n')[0];
    return firstLine.length > 40 ? firstLine.slice(0, 40) + '...' : firstLine;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-80 bg-[var(--surface)] border-l border-[var(--border)] shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-medium text-[var(--text)]">历史记录</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Save Current Button */}
        {isDesktop && (
          <div className="p-3 border-b border-[var(--border)]">
            <button
              onClick={handleSave}
              disabled={isSaving || !currentCode.trim()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              <span>保存当前代码</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!isDesktop ? (
            <div className="p-4 text-center text-[var(--text-secondary)] text-sm">
              <p>历史记录功能仅在桌面端可用</p>
              <p className="mt-1 text-xs opacity-70">请下载桌面版以使用此功能</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
            </div>
          ) : history.length === 0 ? (
            <div className="p-4 text-center text-[var(--text-secondary)] text-sm">
              <FileCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>暂无历史记录</p>
              <p className="mt-1 text-xs opacity-70">点击「保存当前代码」保存到历史</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 hover:bg-[var(--surface-hover)] cursor-pointer transition-colors group"
                  onClick={() => handleLoad(entry)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <GitBranch className="w-3 h-3 text-[var(--text-secondary)] shrink-0" />
                        <span className="text-xs text-[var(--text-secondary)]">
                          {entry.metadata?.engine || 'mermaid'}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">•</span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text)] font-mono truncate">
                        {getCodeSnippet(entry.input)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoad(entry);
                      }}
                      className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--surface-hover)] rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="加载"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {isDesktop && history.length > 0 && (
          <div className="p-3 border-t border-[var(--border)]">
            <button
              onClick={handleClear}
              disabled={isClearing}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {isClearing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>清空历史</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

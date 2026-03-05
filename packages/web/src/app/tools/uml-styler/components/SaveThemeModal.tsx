'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Save, X, Palette } from 'lucide-react';
import type { ThemeTuning } from '../types';

interface SaveThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  currentTuning: ThemeTuning;
  currentEngine: string;
}

export function SaveThemeModal({
  isOpen,
  onClose,
  onSave,
  currentTuning,
  currentEngine,
}: SaveThemeModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave(name.trim(), description.trim());
      setName('');
      setDescription('');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div className="w-[420px]" onKeyDown={handleKeyDown}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-[var(--text)]">保存为自定义主题</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              主题名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：赛博朋克深色"
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Description input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述这个主题的用途..."
              rows={2}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Settings preview */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              包含的配置
            </label>
            <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
              <div className="text-xs text-[var(--text-secondary)] mb-1">
                引擎: {currentEngine === 'mermaid' ? 'Mermaid' : 'PlantUML'}
              </div>
              <div className="text-xs text-[var(--text-secondary)] flex flex-wrap gap-1 mt-2">
                {Object.entries(currentTuning).filter(([_, v]) => v !== undefined).length > 0 ? (
                  Object.entries(currentTuning)
                    .filter(([_, v]) => v !== undefined)
                    .map(([k, _]) => (
                      <span key={k} className="px-1.5 py-0.5 bg-[var(--surface-hover)] rounded border border-[var(--border)]">
                        {k}
                      </span>
                    ))
                ) : (
                  <span className="italic opacity-70">无自定义配置 (将保存为当前基础主题的副本)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="px-4 py-2 text-sm font-medium bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                保存中...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                保存主题
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

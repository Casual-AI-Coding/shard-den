'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Save, X } from 'lucide-react';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  currentCode: string;
  currentEngine: string;
}

export function SaveTemplateModal({
  isOpen,
  onClose,
  onSave,
  currentCode,
  currentEngine,
}: SaveTemplateModalProps) {
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

  // Generate a preview of the code (first 3 lines)
  const codePreview = currentCode.split('\n').slice(0, 3).join('\n');

  return (
    <Modal onClose={onClose}>
      <div className="w-[420px]" onKeyDown={handleKeyDown}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-[var(--text)]">保存为模板</h2>
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
              模板名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：用户认证流程图"
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
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
              placeholder="描述这个模板的用途..."
              rows={2}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Code preview */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              代码预览
            </label>
            <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
              <div className="text-xs text-[var(--text-secondary)] mb-1">
                引擎: {currentEngine === 'mermaid' ? 'Mermaid' : 'PlantUML'}
              </div>
              <pre className="text-xs text-[var(--text-secondary)] font-mono whitespace-pre-wrap overflow-hidden max-h-20">
                {codePreview}
                {currentCode.split('\n').length > 3 && '\n...'}
              </pre>
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
            className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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
                保存模板
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

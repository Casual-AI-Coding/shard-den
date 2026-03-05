'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { UmlStylerConfig } from '@/lib/tauri';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UmlStylerConfig;
  onSave: (config: UmlStylerConfig) => void;
}

export function SettingsModal({ isOpen, onClose, config, onSave }: SettingsModalProps) {
  const [localConfig, setLocalConfig] = useState<UmlStylerConfig>(config);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const currentResolution = typeof localConfig.export_resolution === 'string' 
    ? localConfig.export_resolution 
    : 'Custom';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[400px] bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="font-medium">设置</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-[var(--surface-hover)] rounded transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Export Resolution */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              导出分辨率
            </label>
            <select
              value={currentResolution}
              onChange={(e) => {
                const val = e.target.value;
                let res: UmlStylerConfig['export_resolution'] = 'Default';
                if (val === 'Default' || val === 'X2' || val === 'X3' || val === 'X4') {
                  res = val;
                }
                setLocalConfig(prev => ({ ...prev, export_resolution: res }));
              }}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="Default">1x (Default)</option>
              <option value="X2">2x</option>
              <option value="X3">3x</option>
              <option value="X4">4x</option>
            </select>
          </div>

          {/* Auto Save */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              自动保存
            </label>
            <button
              onClick={() => setLocalConfig(prev => ({ ...prev, auto_save: !prev.auto_save }))}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                localConfig.auto_save ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <div 
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  localConfig.auto_save ? 'left-5' : 'left-1'
                }`} 
              />
            </button>
          </div>

          {/* Auto Save Interval */}
          {localConfig.auto_save && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                自动保存间隔 (秒)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={localConfig.auto_save_interval_secs}
                onChange={(e) => setLocalConfig(prev => ({ 
                  ...prev, 
                  auto_save_interval_secs: Math.max(5, parseInt(e.target.value) || 30) 
                }))}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border)] bg-[var(--bg)] rounded-b-lg">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors shadow-sm"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}

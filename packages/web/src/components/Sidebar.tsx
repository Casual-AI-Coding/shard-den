'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileJson, Star, History, Settings, X, GitBranch } from 'lucide-react';
import packageJson from '../../package.json';
import { loadHistory, type HistoryEntry } from '@/lib/tauri';

const tools = [
  {
    name: 'JSON 提取器',
    path: '/tools/json-extractor',
    icon: FileJson,
    description: '使用 JSONPath 提取字段'
  },
  {
    name: 'UML Styler',
    path: '/tools/uml-styler',
    icon: GitBranch,
    description: 'UML 图表编辑器，支持 Mermaid'
  }
];

interface SidebarProps {
  isDesktop?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isDesktop = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (isDesktop) {
      loadHistory('json-extractor', 5)
        .then(setHistory)
        .catch(console.error);
    }
  }, [isDesktop]);

  return (
    <aside className="w-52 h-screen bg-[var(--surface)] border-r border-[var(--border)] flex flex-col relative">
      {/* Logo */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text)]">
          砾穴 <span className="text-[var(--accent)]">ShardDen</span>
          <span className="text-sm text-[var(--text-secondary)]"> v</span>
          <span className="text-sm text-[var(--accent)]">{packageJson.version}</span>
        </h1>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tools */}
      <nav className="p-4">
        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-3 tracking-wider">
          工具
        </h3>
        <ul className="space-y-1">
          {tools.map((tool) => {
            const isActive = pathname === tool.path;
            const Icon = tool.icon;
            return (
              <li key={tool.path}>
                <Link
                  href={tool.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                    ? 'bg-[var(--accent)] text-[var(--bg)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--hover)] hover:text-[var(--text)]'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tool.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop Only: Favorites & History */}
      {isDesktop && (
        <>
          <div className="border-t border-[var(--border)] p-4">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-3 tracking-wider flex items-center gap-2">
              <Star className="w-3 h-3" />
              收藏
            </h3>
            <p className="text-sm text-[var(--text-secondary)] opacity-50">
              暂无收藏
            </p>
          </div>
          <div className="border-t border-[var(--border)] p-4">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-3 tracking-wider flex items-center gap-2">
              <History className="w-3 h-3" />
              历史
            </h3>
            {history.length > 0 ? (
              <ul className="space-y-2">
                {history.slice(0, 5).map((entry) => (
                  <li key={entry.id} className="text-xs text-[var(--text-secondary)] truncate">
                    {entry.input.slice(0, 30)}{entry.input.length > 30 ? '...' : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--text-secondary)] opacity-50">
                暂无历史
              </p>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-[var(--border)]">
        {isDesktop && (
          <button className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
            <Settings className="w-4 h-4" />
            <span>设置</span>
          </button>
        )}
        <p className="text-xs text-[var(--text-secondary)] opacity-50 mt-2">
          {isDesktop ? 'Desktop Mode' : 'Web Mode • Stateless'}
        </p>
      </div>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileJson, Star, History, Settings, X } from 'lucide-react';

const tools = [
  { 
    name: 'JSON 提取器', 
    path: '/tools/json-extractor', 
    icon: FileJson,
    description: '使用 JSONPath 提取字段'
  },
];

interface SidebarProps {
  isDesktop?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isDesktop = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-[var(--surface)] border-r border-[var(--border)] flex flex-col relative">
      {/* Logo */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text)]">
          砾穴 <span className="text-[var(--accent)]">ShardDen</span>
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
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
            <p className="text-sm text-[var(--text-secondary)] opacity-50">
              暂无历史
            </p>
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

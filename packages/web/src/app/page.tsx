'use client';

import Link from 'next/link';
import { FileJson, Plus, Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useLayout } from '@/lib/layout-context';

const tools = [
  { 
    name: 'JSON 提取器', 
    path: '/tools/json-extractor', 
    title: 'JSON Extractor',
    description: '使用 JSONPath 从 JSON 中提取字段',
    icon: FileJson,
  },
];

const comingSoon = [
  { name: 'CSV 解析器', description: '解析和转换 CSV 文件' },
  { name: 'Base64', description: '编码/解码 Base64' },
];

export default function Home() {
  const { setIsMobileMenuOpen } = useLayout();

  return (
    <>
      {/* Header */}
      <header className="h-14 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* Mobile: Hamburger menu */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-1.5 -ml-1.5 text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-[var(--text)]">
            欢迎使用 <span className="text-[var(--accent)]">砾穴</span>
          </h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 p-6 overflow-auto bg-[var(--bg)]">
        {/* Description */}
        <p className="text-[var(--text-secondary)] mb-6">
          模块化开发者工具平台
        </p>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-4xl">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.path}
                href={tool.path}
                className="group p-5 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                    <Icon className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                    {tool.title}
                  </h2>
                </div>
                <p className="text-[var(--text-secondary)] text-sm">
                  {tool.description}
                </p>
              </Link>
            );
          })}

          {/* Coming Soon */}
          {comingSoon.map((item) => (
            <div
              key={item.name}
              className="p-5 bg-[var(--surface)] rounded-xl border border-[var(--border)] border-dashed opacity-60"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[var(--hover)] rounded-lg">
                  <Plus className="w-5 h-5 text-[var(--text-secondary)]" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-secondary)]">
                  {item.name}
                </h2>
              </div>
              <p className="text-[var(--text-secondary)] text-sm">
                {item.description}
              </p>
              <span className="inline-block mt-2 text-xs text-[var(--text-secondary)] bg-[var(--hover)] px-2 py-1 rounded">
                即将推出
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-[var(--text-secondary)] text-sm">
          <p>Web: 无状态 • WASM 驱动</p>
        </footer>
      </main>
    </>
  );
}

'use client';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HelpItem {
  code: string;
  desc: string;
}

interface HelpButtonProps {
  content: HelpItem[];
}

export function HelpButton({ content }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--hover)] transition-colors"
        title="JSONPath 语法帮助"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Tooltip */}
          <div className="absolute left-0 top-full mt-2 z-50 w-72 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-[var(--text)]">JSONPath 语法</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2">
              {content.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-sm">
                  <code className="px-1.5 py-0.5 bg-[var(--bg)] text-[var(--accent)] rounded text-xs font-mono">
                    {item.code}
                  </code>
                  <span className="text-[var(--text-secondary)]">{item.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

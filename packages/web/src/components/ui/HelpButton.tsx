'use client';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HelpItem {
  code: string;
  desc: string;
}

interface HelpButtonProps {
  content: HelpItem[];
  title?: string;
}

/**
 * Accessible Help Button component with:
 * - aria-expanded and aria-controls
 * - Focus management
 * - Escape key to close
 * - Proper labeling
 */
export function HelpButton({ content, title = 'JSONPath 语法帮助' }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Handle escape key and focus management
  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Restore focus when closed
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Generate unique IDs for accessibility
  const tooltipId = `help-tooltip-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={tooltipId}
        aria-label={title}
        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
      >
        <HelpCircle className="w-4 h-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop for click outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
            aria-hidden="true"
          />
          
          {/* Tooltip Panel */}
          <div
            id={tooltipId}
            role="region"
            aria-label={title}
            className="absolute left-0 top-full mt-2 z-50 w-72 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-[var(--text)]">{title}</h4>
              <button
                onClick={() => {
                  setIsOpen(false);
                  buttonRef.current?.focus();
                }}
                aria-label="关闭帮助"
                className="text-[var(--text-secondary)] hover:text-[var(--text)] p-1 rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <ul className="space-y-2" role="list">
              {content.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-sm">
                  <code className="px-1.5 py-0.5 bg-[var(--bg)] text-[var(--accent)] rounded text-xs font-mono" aria-label={`语法: ${item.code}`}>
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

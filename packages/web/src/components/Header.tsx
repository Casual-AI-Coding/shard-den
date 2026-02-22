'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Settings, Menu } from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';
import { useLayout } from '@/lib/layout-context';

interface HeaderProps {
  title: string;
  children?: ReactNode;
}

export function Header({ title, children }: HeaderProps) {
  const { setIsMobileMenuOpen, isDesktop: desktop } = useLayout();

  return (
    <header className="h-14 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        {/* Mobile: Hamburger menu */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-1.5 -ml-1.5 text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Desktop: Breadcrumb */}
        <Link 
          href="/" 
          className="hidden lg:block text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors text-sm"
        >
          砾穴
        </Link>
        <ChevronRight className="hidden lg:block w-4 h-4 text-[var(--text-secondary)]" />
        
        <h1 className="text-lg font-semibold text-[var(--text)]">{title}</h1>
        <div className="hidden lg:block">
          {children}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {desktop && (
          <button
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded-lg transition-colors"
            title="设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}

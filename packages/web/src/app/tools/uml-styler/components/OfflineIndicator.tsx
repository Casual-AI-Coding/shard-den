'use client';

import { useNetwork } from '../hooks/useNetwork';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface OfflineIndicatorProps {
  engine?: 'mermaid' | 'plantuml';
}

/**
 * Offline status indicator bar
 * Shows warning when offline and recovery message when back online
 */
export function OfflineIndicator({ engine = 'mermaid' }: OfflineIndicatorProps) {
  const { isOnline, wasOffline } = useNetwork();
  const [showRecovery, setShowRecovery] = useState(false);

  // Handle recovery message display
  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowRecovery(true);
      const timer = setTimeout(() => {
        setShowRecovery(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline, isOnline]);

  // Don't show anything if online and no recovery message
  if (isOnline && !showRecovery) {
    return null;
  }

  // Show recovery message
  if (showRecovery && isOnline) {
    return (
      <div className="bg-green-100 dark:bg-green-900/30 border-b border-green-200 dark:border-green-800 px-4 py-2 flex items-center justify-center gap-2 text-green-800 dark:text-green-200 text-sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>网络已恢复</span>
        <button
          onClick={() => setShowRecovery(false)}
          className="ml-2 p-0.5 hover:bg-green-200 dark:hover:bg-green-800 rounded"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // Show offline warning
  return (
    <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-center gap-2 text-amber-800 dark:text-amber-200 text-sm">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
      </svg>
      <span>
        离线模式 - Mermaid 可用
        {engine === 'plantuml' && '，PlantUML 需要网络'}
      </span>
    </div>
  );
}

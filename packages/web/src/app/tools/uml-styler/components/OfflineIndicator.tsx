'use client';

import { useNetwork } from '../hooks/useNetwork';
import { WifiOff, Check } from 'lucide-react';

interface OfflineIndicatorProps {
  engine?: 'mermaid' | 'plantuml' | 'd2' | 'graphviz';
}

/**
 * Offline status indicator bar
 * Shows warning when offline and recovery message when back online
 */
export function OfflineIndicator({ engine = 'mermaid' }: OfflineIndicatorProps) {
  const { isOnline, wasOffline, isNetworkSupported } = useNetwork();

  // Don't show if network events are not supported
  if (!isNetworkSupported) {
    return null;
  }

  // Don't show anything if online and no recovery message
  if (isOnline && !wasOffline) {
    return null;
  }

  // Show recovery message (wasOffline is true for 5 seconds after regaining connectivity)
  if (wasOffline && isOnline) {
    return (
      <div className="bg-green-100 dark:bg-green-900/30 border-b border-green-200 dark:border-green-800 px-4 py-2 flex items-center justify-center gap-2 text-green-800 dark:text-green-200 text-sm">
        <Check className="w-4 h-4" />
        <span>网络已恢复</span>
      </div>
    );
  }

  // Show offline warning
  return (
    <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-center gap-2 text-amber-800 dark:text-amber-200 text-sm">
      <WifiOff className="w-4 h-4" />
<span>
离线模式 - Mermaid 可用
{engine === 'plantuml' && '，PlantUML 需要网络'}
{engine === 'd2' && '，D2 需要网络'}
{engine === 'graphviz' && '，Graphviz 需要网络'}
</span>
    </div>
  );
}

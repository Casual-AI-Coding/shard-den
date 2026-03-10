'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ReactNode } from 'react';

interface ClientErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Client-side wrapper for ErrorBoundary
 * Used to wrap the app with error boundary handling
 */
export function ClientErrorBoundary({ children }: ClientErrorBoundaryProps) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseNetworkReturn {
  isOnline: boolean;
  wasOffline: boolean;
  isNetworkSupported: boolean;
}

/**
 * Hook to track network connectivity status
 * Works in both Web (browser) and Desktop (Tauri) environments
 * 
 * @returns Network status including:
 *   - isOnline: Current online status
 *   - wasOffline: True for 5 seconds after regaining connectivity (for showing recovery message)
 *   - isNetworkSupported: Whether the browser supports online/offline events
 */
export function useNetwork(): UseNetworkReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [isNetworkSupported, setIsNetworkSupported] = useState(true);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if navigator.onLine is available (not available in some SSR scenarios)
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
      setIsNetworkSupported(typeof window !== 'undefined' && 'ononline' in window);
    }

    const handleOnline = useCallback(() => {
      setIsOnline(true);
      // Mark that we were offline, to show recovery message
      setWasOffline(true);
      
      // Clear any existing timeout before setting a new one
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Clear the recovery message after 5 seconds
      timeoutRef.current = window.setTimeout(() => {
        setWasOffline(false);
      }, 5000);
    }, []);

    const handleOffline = useCallback(() => {
      setIsOnline(false);
      // Clear any pending recovery timeout when going offline
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }, []);

    // Add event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      // Clean up timeout on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  return {
    isOnline,
    wasOffline,
    isNetworkSupported,
  };
}

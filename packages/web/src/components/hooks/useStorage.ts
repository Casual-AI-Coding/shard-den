'use client';

import { useState, useEffect, useCallback } from 'react';
import { isDesktop } from '@/lib/platform';

export type StorageType = 'session' | 'local';

/**
 * Web: Uses sessionStorage/localStorage
 * Desktop: Uses Tauri storage (read-only for now)
 */
export function useStorage<T>(key: string, initialValue: T, type: StorageType = 'session') {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get storage based on type
  const getStorage = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return type === 'local' ? window.localStorage : window.sessionStorage;
  }, [type]);

  // Load initial value
  useEffect(() => {
    if (isDesktop()) {
      // Desktop: Read from Tauri (placeholder - actual implementation would use Tauri commands)
      // For now, fall back to web storage in desktop webview
      const storage = getStorage();
      if (storage) {
        try {
          const item = storage.getItem(key);
          if (item !== null) {
            setStoredValue(JSON.parse(item));
          }
        } catch (error) {
          console.error('Error reading from storage:', error);
        }
      }
      setIsInitialized(true);
    } else {
      // Web: Use sessionStorage/localStorage
      const storage = getStorage();
      if (storage) {
        try {
          const item = storage.getItem(key);
          if (item !== null) {
            setStoredValue(JSON.parse(item));
          }
        } catch (error) {
          console.error('Error reading from storage:', error);
        }
      }
      setIsInitialized(true);
    }
  }, [key, getStorage]);

  // Set value
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        const storage = getStorage();
        if (storage) {
          storage.setItem(key, JSON.stringify(valueToStore));
        }

        // In Desktop, also save to Tauri storage (future enhancement)
        if (isDesktop()) {
          // TODO: Call Tauri command to persist data
        }
      } catch (error) {
        console.error('Error saving to storage:', error);
      }
    },
    [key, storedValue, getStorage]
  );

  // Remove value
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      const storage = getStorage();
      if (storage) {
        storage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  }, [key, initialValue, getStorage]);

  return { storedValue, setValue, removeValue, isInitialized };
}

/**
 * Simple sessionStorage hook for Web (stateless)
 */
export function useSessionStorage<T>(key: string, initialValue: T) {
  return useStorage(key, initialValue, 'session');
}

/**
 * Simple localStorage hook for Web (stateless)
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  return useStorage(key, initialValue, 'local');
}

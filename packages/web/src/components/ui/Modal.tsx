'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
}

/**
 * Accessible Modal component with:
 * - role="dialog" and aria-modal="true"
 * - Focus trap (keeps focus inside modal)
 * - Escape key to close
 * - Click outside to close
 * - Proper heading hierarchy with aria-labelledby
 */
export function Modal({ children, onClose, title }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Focus trap: keep focus inside modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // If Shift+Tab and on first element, move to last
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
    // If Tab and on last element, move to first
    else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }, []);

  useEffect(() => {
    // Store the previously focused element
    previousActiveElement.current = document.activeElement;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleKeyDown);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Focus the modal container when it opens
    setTimeout(() => {
      const focusable = modalRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (focusable) {
        focusable.focus();
      } else {
        modalRef.current?.focus();
      }
    }, 0);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      
      // Restore focus to the previously focused element
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [onClose, handleKeyDown]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Generate unique ID for the modal title
  const titleId = title ? `modal-title-${Math.random().toString(36).substr(2, 9)}` : undefined;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-2xl p-6 m-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-auto relative"
        tabIndex={-1}
      >
        {/* Accessible close button */}
        <button
          onClick={onClose}
          aria-label="关闭对话框"
          className="absolute top-4 right-4 p-1.5 text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Title for screen readers */}
        {title && (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        )}
        
        {children}
      </div>
    </div>
  );
}

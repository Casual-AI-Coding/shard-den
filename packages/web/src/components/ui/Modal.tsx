'use client';

import React from 'react';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

export function Modal({ children, onClose }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-2xl p-6 m-4 animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}

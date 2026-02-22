'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { isDesktop } from './platform';

interface LayoutContextType {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isDesktop: boolean;
}

const LayoutContext = createContext<LayoutContextType>({
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: () => {},
  isDesktop: false,
});

export function useLayout() {
  return useContext(LayoutContext);
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    setDesktop(isDesktop());
  }, []);

  return (
    <LayoutContext.Provider value={{ isMobileMenuOpen, setIsMobileMenuOpen, isDesktop: desktop }}>
      {children}
    </LayoutContext.Provider>
  );
}

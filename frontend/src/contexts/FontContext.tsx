'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type FontContextType = {
  isPoppins: boolean;
  toggleFont: () => void;
  resetFont: () => void;
};

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [isPoppins, setIsPoppins] = useState(false);

  useEffect(() => {
    // Load saved preference from sessionStorage (persists during session only)
    const savedFont = sessionStorage.getItem('preferredFont');
    if (savedFont) {
      setIsPoppins(savedFont === 'poppins');
    }
  }, []);

  useEffect(() => {
    // Apply font class and size scaling to body when font changes
    if (typeof document !== 'undefined') {
      document.body.className = document.body.className
        .replace(/font-pixel|font-poppins|text-scale-110/g, '')
        .trim() + ` ${isPoppins ? 'font-poppins text-scale-110' : 'font-pixel'}`;
    }
  }, [isPoppins]);

  const toggleFont = () => {
    const newFont = !isPoppins;
    setIsPoppins(newFont);
    sessionStorage.setItem('preferredFont', newFont ? 'poppins' : 'pixel');
  };

  const resetFont = () => {
    setIsPoppins(false);
    sessionStorage.removeItem('preferredFont');
  };

  return (
    <FontContext.Provider value={{ isPoppins, toggleFont, resetFont }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
} 
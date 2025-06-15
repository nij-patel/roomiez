'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type FontContextType = {
  isPoppins: boolean;
  toggleFont: () => void;
};

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [isPoppins, setIsPoppins] = useState(false);

  useEffect(() => {
    // Load saved preference from localStorage
    const savedFont = localStorage.getItem('preferredFont');
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
    localStorage.setItem('preferredFont', newFont ? 'poppins' : 'pixel');
  };

  return (
    <FontContext.Provider value={{ isPoppins, toggleFont }}>
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
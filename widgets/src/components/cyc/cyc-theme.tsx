'use client';

import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import type { Theme } from '../../types/mcp-app';

interface CycThemeValue {
  theme: Theme;
  toggle: () => void;
}

const CycThemeContext = createContext<CycThemeValue | null>(null);

export function CycThemeProvider({
  hostTheme,
  children,
}: {
  hostTheme?: Theme | null;
  children: ReactNode;
}) {
  const [localTheme, setLocalTheme] = useState<Theme | null>(null);
  const theme = localTheme ?? hostTheme ?? 'light';

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    return () => {
      root.classList.remove('dark');
    };
  }, [theme]);

  return (
    <CycThemeContext
      value={{
        theme,
        toggle: () => {
          setLocalTheme(theme === 'light' ? 'dark' : 'light');
        },
      }}
    >
      {children}
    </CycThemeContext>
  );
}

export function useCycThemeContext() {
  return use(CycThemeContext);
}

export function useCycTheme() {
  const value = use(CycThemeContext);
  if (!value) {
    throw new Error('CycThemeProvider is required');
  }
  return value;
}

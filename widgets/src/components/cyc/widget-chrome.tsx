'use client';

import { createContext, use, type ReactNode } from 'react';
import type { DisplayMode } from '../../types/mcp-app';

export interface WidgetChromeValue {
  displayMode: DisplayMode;
  canToggleFullscreen: boolean;
  onToggleFullscreen: () => Promise<void>;
}

const WidgetChromeContext = createContext<WidgetChromeValue | null>(null);

export function WidgetChromeProvider({
  value,
  children,
}: {
  value: WidgetChromeValue;
  children: ReactNode;
}) {
  return <WidgetChromeContext value={value}>{children}</WidgetChromeContext>;
}

export function useWidgetChrome(): WidgetChromeValue | null {
  return use(WidgetChromeContext);
}

export function widgetChromeFromApp<
  T extends {
    displayMode: DisplayMode;
    canToggleFullscreen: boolean;
    toggleFullscreen: () => Promise<void>;
  },
>(widget: T): WidgetChromeValue {
  return {
    displayMode: widget.displayMode,
    canToggleFullscreen: widget.canToggleFullscreen,
    onToggleFullscreen: widget.toggleFullscreen,
  };
}

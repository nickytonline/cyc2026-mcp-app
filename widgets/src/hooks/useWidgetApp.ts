import { useEffect, useMemo, useState } from 'react';
import { App } from '@modelcontextprotocol/ext-apps';
import type { AppLike, HostContext, ToolResultPayload } from '../types/mcp-app';

export function useWidgetApp<T>(
  name: string,
  app?: AppLike<T>
): {
  toolOutput: T | null;
  hostContext: HostContext | null | undefined;
  activeApp: AppLike<T>;
} {
  const defaultApp = useMemo(
    () => new App({ name, version: '1.0.0' }) as unknown as AppLike<T>,
    [name]
  );
  const activeApp = app ?? defaultApp;
  const [toolOutput, setToolOutput] = useState<T | null>(null);
  const [hostContext, setHostContext] = useState<
    HostContext | null | undefined
  >(null);

  useEffect(() => {
    let isMounted = true;
    activeApp.ontoolresult = (result: ToolResultPayload<T>) => {
      if (!isMounted) return;
      setToolOutput(result.structuredContent ?? null);
    };
    activeApp.onhostcontextchanged = (context: HostContext) => {
      if (!isMounted) return;
      setHostContext((prev) => ({ ...prev, ...context }));
    };
    const connect = async () => {
      try {
        await activeApp.connect();
        if (!isMounted) return;
        setHostContext(activeApp.getHostContext());
      } catch (err) {
        console.error(`Failed to connect ${name}:`, err);
      }
    };
    void connect();
    return () => {
      isMounted = false;
    };
  }, [activeApp, name]);

  return { toolOutput, hostContext, activeApp };
}

export function hostPadding(hostContext: HostContext | null | undefined) {
  const insets = hostContext?.safeAreaInsets;
  const maxHeight = hostContext?.containerDimensions?.maxHeight;
  return {
    paddingTop: `${Math.max(insets?.top ?? 0, 0)}px`,
    paddingBottom: `${Math.max(insets?.bottom ?? 0, 0)}px`,
    paddingLeft: `${Math.max(insets?.left ?? 0, 0)}px`,
    paddingRight: `${Math.max(insets?.right ?? 0, 0)}px`,
    maxHeight: maxHeight ? `${maxHeight}px` : undefined,
    overflow: 'auto' as const,
  };
}

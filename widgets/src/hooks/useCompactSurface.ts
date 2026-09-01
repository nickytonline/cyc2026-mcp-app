import { useEffect, useState } from 'react';
import type { HostContext } from '../types/mcp-app';

const COMPACT_MAX = 640;

export function useCompactSurface(hostContext?: HostContext | null) {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth
  );

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const hostWidth =
    hostContext?.containerDimensions?.width ??
    hostContext?.containerDimensions?.maxWidth;

  return (hostWidth ?? viewportWidth) < COMPACT_MAX;
}

import type { CSSProperties, ReactNode } from 'react';
import type { HostContext } from '../../types/mcp-app';
import { hostPadding } from '../../hooks/useWidgetApp';
import { cn } from '../../utils/cn';

interface WidgetShellProps {
  kicker: string;
  title: string;
  hostContext?: HostContext | null;
  fill?: boolean;
  children: ReactNode;
}

export function WidgetShell({
  kicker,
  title,
  hostContext,
  fill = false,
  children,
}: WidgetShellProps) {
  const theme = hostContext?.theme ?? 'light';
  const padding = hostPadding(hostContext);
  const hostMax = hostContext?.containerDimensions?.maxHeight;
  const paneHeight = hostMax
    ? `${hostMax}px`
    : 'var(--cyc-widget-max)';
  const style: CSSProperties = fill
    ? {
        ...padding,
        height: paneHeight,
        maxHeight: paneHeight,
        overflow: 'hidden',
      }
    : padding;

  return (
    <main
      style={style}
      className={cn(theme === 'dark' && 'dark', fill && 'flex min-h-0 flex-col')}
    >
      <div
        className={cn(
          'overflow-hidden rounded-[8px] border border-[var(--cyc-line)] bg-white text-[var(--cyc-ink)] dark:border-white/10 dark:bg-[var(--cyc-navy)] dark:text-white',
          fill && 'flex min-h-0 flex-1 flex-col'
        )}
      >
        <header className="shrink-0 bg-[var(--cyc-navy)] px-5 py-4 text-white">
          <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7db3ff]">
            {kicker}
          </p>
          <h1 className="mt-1 text-[1.375rem] font-bold leading-tight tracking-tight">
            {title}
          </h1>
        </header>
        <div
          className={cn(
            'bg-[var(--cyc-cloud)] p-4 dark:bg-[var(--cyc-navy-soft)]',
            fill && 'flex min-h-0 flex-1 flex-col'
          )}
        >
          {children}
        </div>
      </div>
    </main>
  );
}

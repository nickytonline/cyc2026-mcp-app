import type { CSSProperties, ReactNode } from 'react';
import type { HostContext } from '../../types/mcp-app';
import { hostPadding } from '../../hooks/useWidgetApp';

interface WidgetShellProps {
  kicker: string;
  title: string;
  hostContext?: HostContext | null;
  children: ReactNode;
}

export function WidgetShell({
  kicker,
  title,
  hostContext,
  children,
}: WidgetShellProps) {
  const theme = hostContext?.theme ?? 'light';
  const style: CSSProperties = hostPadding(hostContext);

  return (
    <main
      style={style}
      className={theme === 'dark' ? 'dark' : undefined}
    >
      <div className="overflow-hidden rounded-[8px] border border-[var(--cyc-line)] bg-white text-[var(--cyc-ink)] dark:border-white/10 dark:bg-[var(--cyc-navy)] dark:text-white">
        <header className="bg-[var(--cyc-navy)] px-5 py-4 text-white">
          <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7db3ff]">
            {kicker}
          </p>
          <h1 className="mt-1 text-[1.375rem] font-bold leading-tight tracking-tight">
            {title}
          </h1>
        </header>
        <div className="bg-[var(--cyc-cloud)] p-4 dark:bg-[var(--cyc-navy-soft)]">
          {children}
        </div>
      </div>
    </main>
  );
}

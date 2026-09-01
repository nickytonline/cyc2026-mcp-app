import type { CSSProperties, ReactNode } from 'react';
import type { DisplayMode, HostContext } from '../../types/mcp-app';
import { hostPadding } from '../../hooks/useWidgetApp';
import { cn } from '../../utils/cn';
import { CycThemeProvider, useCycTheme, useCycThemeContext } from './cyc-theme';

interface WidgetShellProps {
  kicker: string;
  title: string;
  hostContext?: HostContext | null;
  fill?: boolean;
  displayMode?: DisplayMode;
  canToggleFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  children: ReactNode;
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WidgetShellChrome({
  kicker,
  title,
  hostContext,
  fill = false,
  displayMode = 'inline',
  canToggleFullscreen = false,
  onToggleFullscreen,
  children,
}: WidgetShellProps) {
  const { theme, toggle } = useCycTheme();
  const padding = hostPadding(hostContext);
  const hostMax = hostContext?.containerDimensions?.maxHeight;
  const paneHeight = hostMax ? `${hostMax}px` : 'var(--cyc-widget-max)';
  const style: CSSProperties = fill
    ? {
        ...padding,
        height: paneHeight,
        maxHeight: paneHeight,
        overflow: 'hidden',
      }
    : padding;
  const nextThemeLabel =
    theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  const fullscreenLabel =
    displayMode === 'fullscreen' ? 'Exit full screen' : 'Full screen';

  return (
    <main
      style={style}
      className={cn(
        theme === 'dark' && 'dark',
        fill && 'flex min-h-0 flex-col'
      )}
    >
      <div
        className={cn(
          'overflow-hidden rounded-[8px] border border-[var(--cyc-line)] bg-[var(--cyc-paper)] text-[var(--cyc-ink)]',
          fill && 'flex min-h-0 flex-1 flex-col'
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 bg-[var(--cyc-navy)] px-5 py-4 text-white">
          <div className="min-w-0">
            <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--cyc-kicker)]">
              {kicker}
            </p>
            <h1 className="mt-1 text-[1.375rem] font-bold leading-tight tracking-tight">
              {title}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {canToggleFullscreen && onToggleFullscreen ? (
              <button
                type="button"
                className="grid size-11 place-items-center rounded-[8px] text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                title={fullscreenLabel}
                onClick={() => {
                  void onToggleFullscreen();
                }}
              >
                {displayMode === 'fullscreen' ? (
                  <MinimizeIcon />
                ) : (
                  <MaximizeIcon />
                )}
                <span className="sr-only">{fullscreenLabel}</span>
              </button>
            ) : null}
            <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-[8px] text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            title={nextThemeLabel}
            onClick={toggle}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            <span className="sr-only">{nextThemeLabel}</span>
          </button>
          </div>
        </header>
        <div
          className={cn(
            'bg-[var(--cyc-cloud)] p-4',
            fill && 'flex min-h-0 flex-1 flex-col'
          )}
        >
          {children}
        </div>
      </div>
    </main>
  );
}

export function WidgetShell(props: WidgetShellProps) {
  const existing = useCycThemeContext();
  if (existing) {
    return <WidgetShellChrome {...props} />;
  }

  return (
    <CycThemeProvider hostTheme={props.hostContext?.theme}>
      <WidgetShellChrome {...props} />
    </CycThemeProvider>
  );
}

'use client';

import type { ListEventsOutput } from 'mcp-app-server/types';
import { WidgetShell } from '../components/cyc/WidgetShell';
import { useWidgetApp } from '../hooks/useWidgetApp';
import type { AppLike } from '../types/mcp-app';

export default function EventsList({
  app,
}: {
  app?: AppLike<ListEventsOutput>;
}) {
  const { toolOutput, hostContext } = useWidgetApp('EventsList', app);
  const events = toolOutput?.events ?? [];

  return (
    <WidgetShell
      kicker="Included with your ticket"
      title="Beyond the code."
      hostContext={hostContext}
      fill
    >
      <ul
        className="cyc-scroll min-h-0 flex-1 grid content-start gap-2 pr-1"
        tabIndex={0}
        aria-label="Events"
      >
        {events.map((event) => (
          <li
            key={event.id}
            className="rounded-[8px] border border-[var(--cyc-line)] bg-[var(--cyc-paper)] p-4"
          >
            <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[var(--cyc-blue-text)]">
              {event.when}
            </p>
            <h2 className="mt-1 text-lg font-bold">{event.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--cyc-muted)]">
              {event.description}
            </p>
          </li>
        ))}
      </ul>
    </WidgetShell>
  );
}

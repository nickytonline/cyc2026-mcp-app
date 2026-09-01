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
    >
      <ul className="grid gap-2">
        {events.map((event) => (
          <li
            key={event.id}
            className="rounded-[8px] border border-[var(--cyc-line)] bg-white p-4 dark:border-white/10 dark:bg-[var(--cyc-navy)]"
          >
            <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[var(--cyc-blue)]">
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

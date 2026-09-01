'use client';

import type { ListSpeakersOutput } from 'mcp-app-server/types';
import { TrackChip } from '../components/cyc/TrackChip';
import { SpeakerPhoto } from '../components/cyc/SpeakerPhoto';
import { WidgetShell } from '../components/cyc/WidgetShell';
import { useWidgetApp } from '../hooks/useWidgetApp';
import type { AppLike } from '../types/mcp-app';

export default function SpeakersList({
  app,
}: {
  app?: AppLike<ListSpeakersOutput>;
}) {
  const { toolOutput, hostContext } = useWidgetApp('SpeakersList', app);
  const speakers = toolOutput?.speakers ?? [];

  return (
    <WidgetShell
      kicker="04 / Who you'll learn from"
      title="This year's speakers"
      hostContext={hostContext}
    >
      <p className="mb-3 font-mono text-[0.75rem] text-[var(--cyc-muted)]">
        {toolOutput
          ? `Showing ${toolOutput.showing} of ${toolOutput.total}`
          : 'Waiting for speaker results'}
      </p>
      <ul className="grid gap-2">
        {speakers.map((speaker) => (
          <li
            key={speaker.id}
            className="grid grid-cols-[72px_minmax(0,1fr)] overflow-hidden rounded-[8px] border border-[var(--cyc-line)] bg-white dark:border-white/10 dark:bg-[var(--cyc-navy)]"
          >
            <div className="relative h-[88px] bg-[var(--cyc-navy)]">
              <SpeakerPhoto
                name={speaker.name}
                photoUrl={speaker.photoUrl}
                className="size-full"
              />
              <span className="absolute left-1.5 top-1.5 font-mono text-[0.625rem] font-bold text-white/90">
                {String(speaker.sequence).padStart(3, '0')}
              </span>
            </div>
            <div className="min-w-0 px-3 py-2">
              <TrackChip track={speaker.track} />
              <h2 className="mt-1 truncate text-[0.9375rem] font-bold text-[var(--cyc-ink)] dark:text-white">
                {speaker.name}
              </h2>
              <p className="truncate text-[0.75rem] text-[var(--cyc-muted)]">
                {speaker.title}
                {speaker.company ? ` / ${speaker.company}` : ''}
              </p>
              <p className="mt-1 line-clamp-2 text-[0.8125rem] text-[var(--cyc-ink)] dark:text-white/90">
                {speaker.talkTitle}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </WidgetShell>
  );
}

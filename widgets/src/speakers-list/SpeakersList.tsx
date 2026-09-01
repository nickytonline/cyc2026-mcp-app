'use client';

import { useState } from 'react';
import type { ListSpeakersOutput } from 'mcp-app-server/types';
import { TrackChip } from '../components/cyc/TrackChip';
import { SpeakerPhoto } from '../components/cyc/SpeakerPhoto';
import { SpeakerProfile } from '../components/cyc/speaker-profile';
import { WidgetShell } from '../components/cyc/WidgetShell';
import { useWidgetApp } from '../hooks/useWidgetApp';
import type { AppLike } from '../types/mcp-app';
import { TrackFilter } from './TrackFilter';

function isSpeakerList(value: unknown): value is ListSpeakersOutput {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as ListSpeakersOutput).speakers)
  );
}

export default function SpeakersList({
  app,
}: {
  app?: AppLike<ListSpeakersOutput>;
}) {
  const { toolOutput, hostContext, activeApp } = useWidgetApp(
    'SpeakersList',
    app
  );
  const [filtered, setFiltered] = useState<ListSpeakersOutput | null>(null);
  const [applied, setApplied] = useState<string[] | null>(null);
  const hostList = isSpeakerList(toolOutput) ? toolOutput : null;
  const list = filtered ?? hostList;
  const selectedTracks = applied ?? hostList?.appliedTracks ?? [];
  const speakers = (list?.speakers ?? []).toSorted((left, right) =>
    left.name.localeCompare(right.name, 'en', { sensitivity: 'base' })
  );

  async function applyTracks(next: string[]) {
    setApplied(next);
    const result = await activeApp.callServerTool<ListSpeakersOutput>({
      name: 'list_speakers',
      arguments: {
        ...(next.length > 0 ? { track: next } : {}),
        limit: 120,
      },
    });
    if (isSpeakerList(result.structuredContent)) {
      setFiltered(result.structuredContent);
    }
  }

  return (
    <SpeakerProfile.Host app={activeApp} hostContext={hostContext}>
      <WidgetShell
        kicker="04 / Who you'll learn from"
        title="This year's speakers"
        hostContext={hostContext}
        fill
      >
        <div className="mb-3 flex shrink-0 items-center justify-end">
          {list ? (
            <TrackFilter
              tracks={list.tracks}
              selected={selectedTracks}
              onChange={(next) => {
                void applyTracks(next);
              }}
            />
          ) : (
            <p className="font-mono text-[0.75rem] text-[var(--cyc-muted)]">
              Waiting for speaker results
            </p>
          )}
        </div>
        <ul
          className="cyc-scroll min-h-0 flex-1 grid content-start gap-2 pr-1"
          tabIndex={0}
          aria-label="Speakers"
        >
          {speakers.map((speaker) => (
            <li key={speaker.id}>
              <SpeakerProfile.Open
                speaker={speaker}
                className="grid w-full grid-cols-[72px_minmax(0,1fr)] overflow-hidden rounded-[8px] border border-[var(--cyc-line)] bg-white text-left hover:border-[var(--cyc-blue)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyc-blue)] dark:border-white/10 dark:bg-[var(--cyc-navy)]"
              >
                <div className="h-[88px] bg-[var(--cyc-navy)]">
                  <SpeakerPhoto
                    name={speaker.name}
                    photoUrl={speaker.photoUrl}
                    className="size-full object-cover"
                  />
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
              </SpeakerProfile.Open>
            </li>
          ))}
        </ul>
      </WidgetShell>
    </SpeakerProfile.Host>
  );
}

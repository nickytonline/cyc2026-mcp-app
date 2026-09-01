'use client';

import type { ViewScheduleItemOutput } from 'mcp-app-server/types';
import { TrackChip } from '../components/cyc/TrackChip';
import { SpeakerPhoto } from '../components/cyc/SpeakerPhoto';
import { SpeakerProfile } from '../components/cyc/speaker-profile';
import { WidgetShell } from '../components/cyc/WidgetShell';
import { useWidgetApp } from '../hooks/useWidgetApp';
import { formatClock, roomColor } from '../utils/cyc';
import type { AppLike } from '../types/mcp-app';

export default function SessionDetail({
  app,
}: {
  app?: AppLike<ViewScheduleItemOutput>;
}) {
  const { toolOutput, hostContext, activeApp } = useWidgetApp(
    'SessionDetail',
    app
  );
  const session = toolOutput?.session;
  const speakers = toolOutput?.speakers ?? [];

  if (!session) {
    return (
      <WidgetShell
        kicker="CYC26 / Session"
        title="Session"
        hostContext={hostContext}
      >
        <p className="text-sm text-[var(--cyc-muted)]">
          Pick a talk from the agenda to see the abstract.
        </p>
      </WidgetShell>
    );
  }

  return (
    <SpeakerProfile.Host app={activeApp} hostContext={hostContext}>
      <WidgetShell
        kicker="CYC26 / Session"
        title={session.title}
        hostContext={hostContext}
      >
        <div className="flex flex-wrap items-center gap-2">
          <TrackChip track={session.track} />
          <span
            className="font-mono text-[0.75rem] font-bold uppercase"
            style={{ color: roomColor(session.room) }}
          >
            {session.room}
          </span>
          <span className="font-mono text-[0.75rem] text-[var(--cyc-muted)]">
            {formatClock(session.start)}
            {session.end ? ` – ${formatClock(session.end)}` : ''}
          </span>
        </div>
        {session.abstract ? (
          <p className="mt-4 text-[0.9375rem] leading-7">{session.abstract}</p>
        ) : null}
        {speakers.length > 0 ? (
          <ul className="mt-4 grid gap-2">
            {speakers.map((speaker) => (
              <li key={speaker.id}>
                <SpeakerProfile.Open
                  speaker={speaker}
                  className="flex w-full items-center gap-3 rounded-[8px] border border-[var(--cyc-line)] bg-white p-2 text-left hover:border-[var(--cyc-blue)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyc-blue)] dark:border-white/10 dark:bg-[var(--cyc-navy)]"
                >
                  <SpeakerPhoto
                    name={speaker.name}
                    photoUrl={speaker.photoUrl}
                    className="size-12 rounded-[6px]"
                  />
                  <span>
                    <strong className="block">{speaker.name}</strong>
                    <span className="text-[0.75rem] text-[var(--cyc-muted)]">
                      {speaker.title}
                      {speaker.company ? ` / ${speaker.company}` : ''}
                    </span>
                  </span>
                </SpeakerProfile.Open>
              </li>
            ))}
          </ul>
        ) : null}
      </WidgetShell>
    </SpeakerProfile.Host>
  );
}

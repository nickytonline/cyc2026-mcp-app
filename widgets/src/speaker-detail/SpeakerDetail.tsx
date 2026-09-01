'use client';

import type { GetSpeakerOutput } from 'mcp-app-server/types';
import { TrackChip } from '../components/cyc/TrackChip';
import { SpeakerPhoto } from '../components/cyc/SpeakerPhoto';
import { WidgetShell } from '../components/cyc/WidgetShell';
import { useWidgetApp } from '../hooks/useWidgetApp';
import { formatClock } from '../utils/cyc';
import type { AppLike } from '../types/mcp-app';

export default function SpeakerDetail({
  app,
}: {
  app?: AppLike<GetSpeakerOutput>;
}) {
  const { toolOutput, hostContext, activeApp } = useWidgetApp(
    'SpeakerDetail',
    app
  );
  const speaker = toolOutput?.speaker;
  const sessions = toolOutput?.sessions ?? [];

  if (!speaker) {
    return (
      <WidgetShell
        kicker="CYC26 / Speaker"
        title="Speaker"
        hostContext={hostContext}
      >
        <p className="text-sm text-[var(--cyc-muted)]">
          Ask for a speaker by name to load their card.
        </p>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell
      kicker="CYC26 / Speaker"
      title={speaker.name}
      hostContext={hostContext}
    >
      <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
        <SpeakerPhoto
          name={speaker.name}
          photoUrl={speaker.photoUrl}
          className="aspect-[4/5] w-full rounded-[6px]"
        />
        <div>
          <TrackChip track={speaker.track} />
          <p className="mt-2 text-sm text-[var(--cyc-muted)]">
            {speaker.title}
            {speaker.company ? ` / ${speaker.company}` : ''}
          </p>
          {speaker.bio ? (
            <p className="mt-3 text-[0.9375rem] leading-7 text-[var(--cyc-ink)] dark:text-white/90">
              {speaker.bio}
            </p>
          ) : null}
        </div>
      </div>
      {sessions.length > 0 ? (
        <div className="mt-4 border-t border-[var(--cyc-line)] pt-4 dark:border-white/10">
          <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--cyc-blue)]">
            On the program
          </p>
          <ul className="mt-2 grid gap-2">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  className="w-full rounded-[8px] border border-[var(--cyc-line)] bg-white p-3 text-left dark:border-white/10 dark:bg-[var(--cyc-navy)]"
                  onClick={() => {
                    void activeApp.callServerTool({
                      name: 'view_schedule_item',
                      arguments: { id: session.id },
                    });
                  }}
                >
                  <strong className="block text-[var(--cyc-ink)] dark:text-white">
                    {session.title}
                  </strong>
                  <span className="mt-1 block font-mono text-[0.75rem] text-[var(--cyc-muted)]">
                    {formatClock(session.start)} / {session.room}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </WidgetShell>
  );
}

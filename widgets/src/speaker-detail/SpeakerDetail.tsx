'use client';

import type { GetSpeakerOutput } from 'mcp-app-server/types';
import { TrackChip } from '../components/cyc/TrackChip';
import { SpeakerPhoto } from '../components/cyc/SpeakerPhoto';
import { WidgetShell } from '../components/cyc/WidgetShell';
import {
  WidgetChromeProvider,
  widgetChromeFromApp,
} from '../components/cyc/widget-chrome';
import { useWidgetApp } from '../hooks/useWidgetApp';
import { SpeakerAskPanel } from '../components/cyc/speaker-profile';
import { formatClock } from '../utils/cyc';
import type { AppLike } from '../types/mcp-app';

export default function SpeakerDetail({
  app,
}: {
  app?: AppLike<GetSpeakerOutput>;
}) {
  const widget = useWidgetApp('SpeakerDetail', app);
  const { toolOutput, hostContext, activeApp } = widget;
  const speaker = toolOutput?.speaker;
  const sessions = toolOutput?.sessions ?? [];

  if (!speaker) {
    return (
      <WidgetChromeProvider value={widgetChromeFromApp(widget)}>
        <WidgetShell
          kicker="CYC26 / Speaker"
          title="Speaker"
          hostContext={hostContext}
        >
          <p className="text-sm text-[var(--cyc-muted)]">
            Ask for a speaker by id to load their card.
          </p>
        </WidgetShell>
      </WidgetChromeProvider>
    );
  }

  return (
    <WidgetChromeProvider value={widgetChromeFromApp(widget)}>
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
              <p className="mt-3 text-[0.9375rem] leading-7 text-[var(--cyc-ink)]">
                {speaker.bio}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4">
          <SpeakerAskPanel speaker={speaker} app={activeApp} />
        </div>
        {sessions.length > 0 ? (
          <div className="mt-4 border-t border-[var(--cyc-line)] pt-4">
            <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--cyc-blue-text)]">
              On the program
            </p>
            <ul className="mt-2 grid gap-2">
              {sessions.map((session) => (
                <li key={session.id}>
                  <button
                    type="button"
                    className="w-full rounded-[8px] border border-[var(--cyc-line)] bg-[var(--cyc-paper)] p-3 text-left"
                    onClick={() => {
                      void activeApp.callServerTool({
                        name: 'view_schedule_item',
                        arguments: { id: session.id },
                      });
                    }}
                  >
                    <strong className="block text-[var(--cyc-ink)]">
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
    </WidgetChromeProvider>
  );
}

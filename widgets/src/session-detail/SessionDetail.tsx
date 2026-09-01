'use client';

import type { ViewScheduleItemOutput } from 'mcp-app-server/types';
import {
  SessionAskForm,
  sessionQuestion,
} from '../components/cyc/session-profile';
import { SessionSpeakerByline } from '../components/cyc/SpeakerPhoto';
import { RoomLabel, TrackChip } from '../components/cyc/TrackChip';
import { WidgetShell } from '../components/cyc/WidgetShell';
import {
  WidgetChromeProvider,
  widgetChromeFromApp,
} from '../components/cyc/widget-chrome';
import { useWidgetApp } from '../hooks/useWidgetApp';
import { formatClock } from '../utils/cyc';
import type { AppLike } from '../types/mcp-app';

export default function SessionDetail({
  app,
}: {
  app?: AppLike<ViewScheduleItemOutput>;
}) {
  const widget = useWidgetApp('SessionDetail', app);
  const { toolOutput, hostContext, activeApp } = widget;
  const session = toolOutput?.session;
  const speakers = toolOutput?.speakers ?? session?.speakers ?? [];

  if (!session) {
    return (
      <WidgetChromeProvider value={widgetChromeFromApp(widget)}>
        <WidgetShell
          kicker="CYC26 / Session"
          title="Session"
          hostContext={hostContext}
        >
        <p className="text-sm text-[var(--cyc-muted)]">
          Ask for a session by id to load the abstract.
        </p>
      </WidgetShell>
      </WidgetChromeProvider>
    );
  }

  return (
    <WidgetChromeProvider value={widgetChromeFromApp(widget)}>
      <WidgetShell
        kicker="CYC26 / Session"
        title={session.title}
        hostContext={hostContext}
        fill
      >
      <div
        className="cyc-scroll min-h-0 flex-1 pr-1"
        tabIndex={0}
        aria-label="Session"
      >
        <div className="flex flex-wrap items-center gap-2">
          <TrackChip track={session.track} />
          <RoomLabel room={session.room} className="text-[0.75rem]" />
          <span className="font-mono text-[0.75rem] text-[var(--cyc-muted)]">
            {formatClock(session.start)}
            {session.end ? ` – ${formatClock(session.end)}` : ''}
          </span>
        </div>
        <SessionSpeakerByline speakers={speakers} className="mt-2" />
        {session.abstract ? (
          <p className="mt-4 text-[0.9375rem] leading-7">{session.abstract}</p>
        ) : null}
        <div className="mt-4">
          <SessionAskForm
            session={session}
            onAsk={async (question) => {
              await activeApp.sendMessage({
                role: 'user',
                content: [
                  { type: 'text', text: sessionQuestion(session, question) },
                ],
              });
            }}
          />
        </div>
      </div>
    </WidgetShell>
    </WidgetChromeProvider>
  );
}

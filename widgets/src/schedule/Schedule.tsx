'use client';

import { useRef, useState } from 'react';
import type { GetScheduleOutput } from 'mcp-app-server/types';
import { TrackChip } from '../components/cyc/TrackChip';
import { SpeakerProfile } from '../components/cyc/speaker-profile';
import { WidgetShell } from '../components/cyc/WidgetShell';
import { useWidgetApp } from '../hooks/useWidgetApp';
import { formatClock, roomColor } from '../utils/cyc';
import type { AppLike } from '../types/mcp-app';
import { DayPicker } from './DayPicker';

function isSchedule(value: unknown): value is GetScheduleOutput {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as GetScheduleOutput).day === 'number' &&
    Array.isArray((value as GetScheduleOutput).slots)
  );
}

function isSearchAgenda(value: GetScheduleOutput): boolean {
  return typeof value.query === 'string';
}

export default function Schedule({
  app,
}: {
  app?: AppLike<GetScheduleOutput>;
}) {
  const { toolOutput, hostContext, activeApp } = useWidgetApp('Schedule', app);
  const [view, setView] = useState<GetScheduleOutput | null>(null);
  const [pendingDay, setPendingDay] = useState<number | null>(null);
  const requestRef = useRef(0);
  const hostSchedule = isSchedule(toolOutput) ? toolOutput : null;
  const schedule = view ?? hostSchedule;
  const slots = schedule?.slots ?? [];
  const events = schedule?.events ?? [];
  const title = schedule?.label || 'Agenda';
  const selectedDay = pendingDay ?? schedule?.day ?? 1;

  async function selectDay(day: number) {
    if (schedule && day === schedule.day && !isSearchAgenda(schedule)) return;
    const requestId = ++requestRef.current;
    setPendingDay(day);
    try {
      const result = await activeApp.callServerTool<GetScheduleOutput>({
        name: 'get_schedule',
        arguments: {
          day,
          ...(schedule?.appliedTrack ? { track: schedule.appliedTrack } : {}),
          ...(schedule?.appliedRoom ? { room: schedule.appliedRoom } : {}),
        },
      });
      if (requestId !== requestRef.current) return;
      if (isSchedule(result.structuredContent)) {
        setView(result.structuredContent);
      }
    } finally {
      if (requestId === requestRef.current) setPendingDay(null);
    }
  }

  return (
    <SpeakerProfile.Host app={activeApp} hostContext={hostContext}>
      <WidgetShell
        kicker="03 / Two days, six tracks"
        title={title}
        hostContext={hostContext}
        fill
      >
        <div className="mb-3 shrink-0">
          <DayPicker
            days={schedule?.days}
            selected={selectedDay}
            pending={pendingDay !== null}
            onChange={(day) => {
              void selectDay(day);
            }}
          />
        </div>
        <div
          className="cyc-scroll min-h-0 flex-1 pr-1"
          tabIndex={0}
          aria-label="Agenda"
        >
          {events.length > 0 ? (
            <ul className="mb-3 grid gap-2">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="rounded-[8px] border border-[var(--cyc-line)] bg-white p-3 dark:border-white/10 dark:bg-[var(--cyc-navy)]"
                >
                  <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-[var(--cyc-blue)]">
                    Social
                  </p>
                  <h2 className="font-bold">{event.title}</h2>
                  <p className="text-[0.75rem] text-[var(--cyc-muted)]">
                    {event.when}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
          <ol className="grid gap-4">
            {slots.map((slot) => (
              <li key={`${slot.start}-${slot.end}`}>
                <p className="mb-2 font-mono text-[0.75rem] font-bold text-[var(--cyc-blue)]">
                  {formatClock(slot.start)}
                  {slot.end ? ` – ${formatClock(slot.end)}` : ''}
                </p>
                <ul className="grid gap-2">
                  {slot.sessions.map((session) => (
                    <li
                      key={session.id}
                      className="overflow-hidden rounded-[8px] border border-[var(--cyc-line)] bg-white shadow-[0_8px_24px_rgba(6,24,48,0.05)] dark:border-white/10 dark:bg-[var(--cyc-navy)]"
                    >
                      <button
                        type="button"
                        className="w-full p-3 text-left hover:bg-[var(--cyc-cloud)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyc-blue)] dark:hover:bg-white/5"
                        onClick={() => {
                          void activeApp.callServerTool({
                            name: 'view_schedule_item',
                            arguments: { id: session.id },
                          });
                        }}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <TrackChip track={session.track} />
                          <span
                            className="font-mono text-[0.6875rem] font-bold uppercase"
                            style={{ color: roomColor(session.room) }}
                          >
                            {session.room}
                          </span>
                        </div>
                        <h2 className="mt-1 text-[0.9375rem] font-bold leading-snug">
                          {session.title}
                        </h2>
                      </button>
                      {session.speakers.length > 0 ? (
                        <div className="flex flex-wrap gap-1 border-t border-[var(--cyc-line)] px-3 py-2 dark:border-white/10">
                          {session.speakers.map((speaker) => (
                            <SpeakerProfile.Open
                              key={speaker.id}
                              speaker={speaker}
                              className="rounded-[8px] px-2 py-1 text-[0.75rem] font-bold text-[var(--cyc-blue)] hover:bg-[var(--cyc-cloud)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyc-blue)] dark:hover:bg-white/5"
                            >
                              {speaker.name}
                            </SpeakerProfile.Open>
                          ))}
                        </div>
                      ) : (
                        <p className="border-t border-[var(--cyc-line)] px-3 py-2 text-[0.75rem] text-[var(--cyc-muted)] dark:border-white/10">
                          {session.speakerNames.join(', ')}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          {slots.length === 0 && events.length === 0 ? (
            <p className="text-sm text-[var(--cyc-muted)]">
              No sessions matched that filter.
            </p>
          ) : null}
        </div>
      </WidgetShell>
    </SpeakerProfile.Host>
  );
}

'use client';

import { useState } from 'react';
import type { GetScheduleOutput } from 'mcp-app-server/types';
import { RoomLabel, TrackChip } from '../components/cyc/TrackChip';
import { CycHost } from '../components/cyc/cyc-host';
import { SessionProfile } from '../components/cyc/session-profile';
import { SessionSpeakerByline } from '../components/cyc/SpeakerPhoto';
import { WidgetShell } from '../components/cyc/WidgetShell';
import { useWidgetApp } from '../hooks/useWidgetApp';
import { formatClock } from '../utils/cyc';
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

export default function Schedule({
  app,
}: {
  app?: AppLike<GetScheduleOutput>;
}) {
  const { toolOutput, hostContext, activeApp } = useWidgetApp('Schedule', app);
  const [pickedDay, setPickedDay] = useState<number | null>(null);
  const schedule = isSchedule(toolOutput) ? toolOutput : null;
  const searching =
    Boolean(schedule && typeof schedule.query === 'string') &&
    pickedDay === null;
  const selectedDay = pickedDay ?? (searching ? -1 : (schedule?.day ?? 1));
  const dayEntry = schedule?.days?.find((entry) => entry.day === selectedDay);
  const slots = searching
    ? (schedule?.slots ?? [])
    : (dayEntry?.slots ?? schedule?.slots ?? []);
  const events = searching ? [] : (dayEntry?.events ?? schedule?.events ?? []);
  const title = searching
    ? (schedule?.label ?? 'Agenda')
    : (dayEntry?.label ?? schedule?.label ?? 'Agenda');

  return (
    <CycHost app={activeApp} hostContext={hostContext}>
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
            onChange={setPickedDay}
          />
        </div>
        <div
          key={searching ? 'search' : `day-${selectedDay}`}
          className="cyc-scroll min-h-0 flex-1 pr-1"
          tabIndex={0}
          aria-label="Agenda"
        >
          {events.length > 0 ? (
            <ul className="mb-3 grid gap-2">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="rounded-[8px] border border-[var(--cyc-line)] bg-[var(--cyc-paper)] p-3"
                >
                  <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-[var(--cyc-blue-text)]">
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
                <p className="mb-2 font-mono text-[0.75rem] font-bold text-[var(--cyc-blue-text)]">
                  {formatClock(slot.start)}
                  {slot.end ? ` – ${formatClock(slot.end)}` : ''}
                </p>
                <ul className="grid gap-2">
                  {slot.sessions.map((session) => (
                    <li key={session.id}>
                      <SessionProfile.Open
                        session={session}
                        className="w-full overflow-hidden rounded-[8px] border border-[var(--cyc-line)] bg-[var(--cyc-paper)] text-left shadow-[0_8px_24px_rgba(6,24,48,0.05)] hover:border-[var(--cyc-blue)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyc-blue)]"
                      >
                        <div className="p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <TrackChip track={session.track} />
                            <RoomLabel room={session.room} />
                          </div>
                          <h2 className="mt-1 text-[0.9375rem] font-bold leading-snug">
                            {session.title}
                          </h2>
                        </div>
                        <div className="border-t border-[var(--cyc-line)] px-3 py-2">
                          <SessionSpeakerByline speakers={session.speakers} />
                        </div>
                      </SessionProfile.Open>
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
    </CycHost>
  );
}

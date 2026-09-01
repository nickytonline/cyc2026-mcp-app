import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  GetScheduleOutput,
  RoomInfo,
  SessionCard,
  SessionRecord,
  SocialEvent,
  SpeakerCard,
  SpeakerRecord,
  TrackInfo,
} from './types.js';

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);
const DATA_DIR = path.join(ROOT_DIR, 'data');

function readJson<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf-8')) as T;
}

const speakers: SpeakerRecord[] = readJson('speakers.json');
const speakerById = new Map(speakers.map((speaker) => [speaker.id, speaker]));
const sessions: SessionRecord[] = readJson('sessions.json');
const scheduleFile: {
  timezone: string;
  days: Array<{
    day: number;
    date: string;
    label: string;
    slots: Array<{
      start: string | null;
      end: string | null;
      sessionIds: string[];
    }>;
  }>;
} = readJson('schedule.json');
const events: SocialEvent[] = readJson<SocialEvent[]>('events.json').map(
  (event) => ({
    ...event,
    day: dayFromEvent(event),
  })
);
const meta: { tracks: TrackInfo[]; rooms: RoomInfo[] } =
  readJson('tracks.json');

function dayFromEvent(event: SocialEvent): number {
  const when = event.when.toLowerCase();
  if (when.includes('september 2')) return 0;
  if (when.includes('september 3')) return 1;
  if (when.includes('september 4')) return 2;
  if (event.title.toLowerCase().includes('day[0]')) return 0;
  if (event.title.toLowerCase().includes('day[1]')) return 1;
  if (
    event.title.toLowerCase().includes('day[2]') ||
    event.title.toLowerCase().includes('closing')
  )
    return 2;
  return 1;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesTrack(value: string, track?: string): boolean {
  if (!track) return true;
  const wanted = normalize(track);
  const have = normalize(value);
  if (have === wanted) return true;
  if (
    (have === 'java' && wanted !== 'java') ||
    (wanted === 'java' && have !== 'java')
  ) {
    return false;
  }
  if (wanted === 'js' && have === 'javascript') return true;
  if (wanted.includes('javascript') && have === 'javascript') return true;
  if (wanted.includes('frontend') && have === 'javascript') return true;
  if ((wanted === 'ai' || wanted.includes('artificial')) && have === 'ai')
    return true;
  if (wanted.includes('cloud') && have === 'cloud') return true;
  if (wanted.includes('workshop') && have === 'workshops') return true;
  if (wanted.includes('leader') || wanted.includes('startup')) {
    return have === 'leadership';
  }
  return have.includes(wanted) || wanted.includes(have);
}

function matchesAnyTrack(value: string, tracks: string[]): boolean {
  if (tracks.length === 0) return true;
  return tracks.some((track) => matchesTrack(value, track));
}

function requestedTracks(track?: string | string[]): string[] {
  if (track == null || track === '') return [];
  const values = Array.isArray(track) ? track : track.split(/[,|]/);
  return values.map((value) => value.trim()).filter(Boolean);
}

function toSpeakerCard(speaker: SpeakerRecord): SpeakerCard {
  return {
    id: speaker.id,
    sequence: speaker.sequence,
    isKeynote: speaker.isKeynote,
    name: speaker.name,
    title: speaker.title,
    company: speaker.company,
    track: speaker.track,
    talkTitle: speaker.talkTitle,
    photoUrl: speaker.photoUrl,
  };
}

function withSpeakerPhoto(person: SessionRecord['speakers'][number]) {
  return {
    id: person.id,
    name: person.name,
    photoUrl: speakerById.get(person.id)?.photoUrl ?? null,
  };
}

function toSessionCard(session: SessionRecord): SessionCard {
  const people = session.speakers.map(withSpeakerPhoto);
  return {
    id: session.id,
    title: session.title,
    track: session.track,
    room: session.room,
    start: session.start,
    end: session.end,
    day: session.day,
    speakers: people,
    speakerNames: people.map((person) => person.name),
  };
}

export function listSpeakers(options: {
  track?: string | string[];
  query?: string;
  limit?: number;
}): {
  speakers: SpeakerCard[];
  total: number;
  showing: number;
  tracks: TrackInfo[];
  appliedTracks: string[];
} {
  const query = options.query ? normalize(options.query) : '';
  const appliedTracks = requestedTracks(options.track);
  const filtered = speakers.filter((speaker) => {
    if (!matchesAnyTrack(speaker.track, appliedTracks)) return false;
    if (!query) return true;
    const haystack = [
      speaker.name,
      speaker.company,
      speaker.title,
      speaker.talkTitle,
      speaker.track,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
  const limit = options.limit ?? 20;
  const sorted = filtered.toSorted((left, right) =>
    left.name.localeCompare(right.name, 'en', { sensitivity: 'base' })
  );
  return {
    speakers: sorted.slice(0, limit).map(toSpeakerCard),
    total: sorted.length,
    showing: Math.min(limit, sorted.length),
    tracks: meta.tracks,
    appliedTracks,
  };
}

export function conferenceDays(
  options: {
    track?: string;
    room?: string;
  } = {}
): GetScheduleOutput['days'] {
  return [0, 1, 2].map((day) => {
    const agenda = agendaForDay(day, options);
    return { day, ...agenda };
  });
}

function agendaForDay(
  day: number,
  options: { track?: string; room?: string }
): {
  date: string;
  label: string;
  slots: GetScheduleOutput['slots'];
  events: GetScheduleOutput['events'];
} {
  const metaDay = scheduleFile.days.find((entry) => entry.day === day);
  const roomFilter = options.room ? normalize(options.room) : '';
  const slots =
    metaDay?.slots.map((slot) => {
      const items = slot.sessionIds
        .map((id) => sessions.find((session) => session.id === id))
        .filter((session): session is SessionRecord => Boolean(session))
        .filter((session) => matchesTrack(session.track, options.track))
        .filter((session) =>
          roomFilter ? normalize(session.room).includes(roomFilter) : true
        )
        .map(toSessionCard);
      return {
        start: slot.start,
        end: slot.end,
        sessions: items,
      };
    }) ?? [];

  return {
    date: metaDay?.date ?? ['2026-09-02', '2026-09-03', '2026-09-04'][day],
    label: metaDay?.label ?? `Day ${day}`,
    slots: slots.filter((slot) => slot.sessions.length > 0),
    events: events.filter((event) => event.day === day),
  };
}

export function getSpeaker(id: string): SpeakerRecord | undefined {
  const needle = id.trim();
  if (!needle) return undefined;
  return speakers.find(
    (speaker) => speaker.id === needle || speaker.slug === needle
  );
}

export function sessionsForSpeaker(speaker: SpeakerRecord): SessionCard[] {
  const ids = new Set(speaker.sessionIds ?? []);
  return sessions
    .filter(
      (session) =>
        ids.has(session.id) ||
        session.speakers.some((person) => person.id === speaker.id)
    )
    .map(toSessionCard);
}

function parseDay(day: number | string): number | undefined {
  if (typeof day === 'number') {
    return day === 0 || day === 1 || day === 2 ? day : undefined;
  }
  const trimmed = String(day).trim();
  if (trimmed === '') return undefined;
  if (trimmed === '0' || trimmed === '1' || trimmed === '2') {
    return Number(trimmed);
  }
  if (trimmed.startsWith('2026-09-02') || /day\s*0/i.test(trimmed)) return 0;
  if (trimmed.startsWith('2026-09-03') || /day\s*1/i.test(trimmed)) return 1;
  if (trimmed.startsWith('2026-09-04') || /day\s*2/i.test(trimmed)) return 2;
  const numeric = Number(trimmed);
  if (numeric === 0 || numeric === 1 || numeric === 2) return numeric;
  return undefined;
}

export function getSchedule(options: {
  day: number | string;
  track?: string;
  room?: string;
}): GetScheduleOutput | undefined {
  const day = parseDay(options.day);
  if (day === undefined) return undefined;
  const days = conferenceDays({
    track: options.track,
    room: options.room,
  });
  const current = days.find((entry) => entry.day === day);
  if (!current) return undefined;

  return {
    day,
    date: current.date,
    label: current.label,
    timezone: scheduleFile.timezone,
    days,
    slots: current.slots,
    events: current.events,
    appliedTrack: options.track,
    appliedRoom: options.room,
  };
}

export function getSession(id: string): SessionRecord | undefined {
  const needle = id.trim();
  if (!needle) return undefined;
  return sessions.find(
    (session) => session.id === needle || session.slug === needle
  );
}

export function speakersForSession(session: SessionRecord): SpeakerCard[] {
  return session.speakers
    .map((person) => speakers.find((speaker) => speaker.id === person.id))
    .filter((speaker): speaker is SpeakerRecord => Boolean(speaker))
    .map(toSpeakerCard);
}

export function searchSessions(options: {
  query: string;
  track?: string;
  limit?: number;
}): { sessions: SessionCard[]; total: number } {
  const query = normalize(options.query);
  const filtered = sessions.filter((session) => {
    if (!matchesTrack(session.track, options.track)) return false;
    const haystack = [
      session.title,
      session.abstract,
      session.track,
      session.room,
      ...session.speakers.map((person) => person.name),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
  const limit = options.limit ?? 12;
  return {
    sessions: filtered.slice(0, limit).map(toSessionCard),
    total: filtered.length,
  };
}

export function listEvents(day?: number | string): SocialEvent[] {
  if (day === undefined || day === null || day === '') return events;
  const resolved = parseDay(day);
  if (resolved === undefined) return [];
  return events.filter((event) => event.day === resolved);
}

export function listTracks(): { tracks: TrackInfo[]; rooms: RoomInfo[] } {
  return { tracks: meta.tracks, rooms: meta.rooms };
}

export function formatSessionLine(
  session: SessionCard | SessionRecord
): string {
  const when = session.start
    ? new Date(session.start).toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'TBA';
  const speakers =
    'speakerNames' in session
      ? session.speakerNames.join(', ')
      : session.speakers.map((person) => person.name).join(', ');
  return `${when} · ${session.room || 'TBA'} · ${session.track} — ${session.title}${speakers ? ` (${speakers})` : ''}`;
}

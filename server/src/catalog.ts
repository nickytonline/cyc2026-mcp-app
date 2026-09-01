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
const events: SocialEvent[] = readJson('events.json').map((event) => ({
  ...event,
  day: dayFromEvent(event),
}));
const meta: { tracks: TrackInfo[]; rooms: RoomInfo[] } = readJson('tracks.json');

function dayFromEvent(event: SocialEvent): number {
  const when = event.when.toLowerCase();
  if (when.includes('september 2')) return 0;
  if (when.includes('september 3')) return 1;
  if (when.includes('september 4')) return 2;
  if (event.title.toLowerCase().includes('day[0]')) return 0;
  if (event.title.toLowerCase().includes('day[1]')) return 1;
  if (event.title.toLowerCase().includes('day[2]') || event.title.toLowerCase().includes('closing'))
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

function toSessionCard(session: SessionRecord): SessionCard {
  return {
    id: session.id,
    title: session.title,
    track: session.track,
    room: session.room,
    start: session.start,
    end: session.end,
    day: session.day,
    speakerNames: session.speakers.map((person) => person.name),
  };
}

export function listSpeakers(options: {
  track?: string;
  query?: string;
  limit?: number;
}): { speakers: SpeakerCard[]; total: number; showing: number } {
  const query = options.query ? normalize(options.query) : '';
  const filtered = speakers.filter((speaker) => {
    if (!matchesTrack(speaker.track, options.track)) return false;
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
  return {
    speakers: filtered.slice(0, limit).map(toSpeakerCard),
    total: filtered.length,
    showing: Math.min(limit, filtered.length),
  };
}

export function getSpeaker(options: {
  id?: string;
  name?: string;
}): SpeakerRecord | undefined {
  if (options.id) {
    const id = normalize(options.id);
    const exact = speakers.find(
      (speaker) => speaker.id === options.id || speaker.slug === options.id
    );
    if (exact) return exact;
    const partial = speakers.find(
      (speaker) =>
        speaker.id.includes(id) ||
        speaker.slug.includes(id) ||
        normalize(speaker.name).includes(id)
    );
    if (partial) return partial;
  }
  if (options.name) {
    const name = normalize(options.name);
    return speakers.find(
      (speaker) =>
        normalize(speaker.name) === name ||
        normalize(speaker.name).includes(name)
    );
  }
  return undefined;
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

function resolveDay(day?: number | string): number {
  if (day === undefined || day === null || day === '') return 1;
  if (typeof day === 'number') return day;
  const trimmed = String(day).trim();
  if (trimmed === '0' || trimmed === '1' || trimmed === '2') {
    return Number(trimmed);
  }
  if (trimmed.startsWith('2026-09-02') || /day\s*0/i.test(trimmed)) return 0;
  if (trimmed.startsWith('2026-09-03') || /day\s*1/i.test(trimmed)) return 1;
  if (trimmed.startsWith('2026-09-04') || /day\s*2/i.test(trimmed)) return 2;
  const numeric = Number(trimmed);
  if (numeric === 0 || numeric === 1 || numeric === 2) return numeric;
  return 1;
}

export function getSchedule(options: {
  day?: number | string;
  track?: string;
  room?: string;
}): GetScheduleOutput {
  const day = resolveDay(options.day);
  const metaDay = scheduleFile.days.find((entry) => entry.day === day);
  const roomFilter = options.room ? normalize(options.room) : '';

  const slots =
    metaDay?.slots.map((slot) => {
      const items = slot.sessionIds
        .map((id) => sessions.find((session) => session.id === id))
        .filter((session): session is SessionRecord => Boolean(session))
        .filter((session) => matchesTrack(session.track, options.track))
        .filter((session) =>
          roomFilter
            ? normalize(session.room).includes(roomFilter)
            : true
        )
        .map(toSessionCard);
      return {
        start: slot.start,
        end: slot.end,
        sessions: items,
      };
    }) ?? [];

  return {
    day,
    date: metaDay?.date ?? ['2026-09-02', '2026-09-03', '2026-09-04'][day],
    label: metaDay?.label ?? `Day ${day}`,
    timezone: scheduleFile.timezone,
    slots: slots.filter((slot) => slot.sessions.length > 0),
    events: events.filter((event) => event.day === day),
  };
}

export function getSession(id: string): SessionRecord | undefined {
  const needle = normalize(id);
  return sessions.find(
    (session) =>
      session.id === id ||
      session.slug === id ||
      normalize(session.id).includes(needle) ||
      normalize(session.title).includes(needle)
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

export function listEvents(day?: number): SocialEvent[] {
  if (day === undefined) return events;
  return events.filter((event) => event.day === day);
}

export function listTracks(): { tracks: TrackInfo[]; rooms: RoomInfo[] } {
  return { tracks: meta.tracks, rooms: meta.rooms };
}

export function formatSessionLine(session: SessionCard | SessionRecord): string {
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

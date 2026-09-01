import { describe, expect, it } from 'vitest';
import {
  getSchedule,
  getSession,
  getSpeaker,
  listSpeakers,
  searchSessions,
} from '../src/catalog.js';
import {
  GetScheduleInputSchema,
  GetSpeakerInputSchema,
  ListSpeakersInputSchema,
  ViewScheduleItemInputSchema,
} from '../src/types.js';

describe('catalog', () => {
  it('lists speakers and can filter by track', () => {
    const all = listSpeakers({ limit: 5 });
    expect(all.total).toBeGreaterThan(50);
    expect(all.speakers).toHaveLength(5);

    const ai = listSpeakers({ track: 'AI', limit: 40 });
    expect(ai.total).toBeGreaterThan(10);
    expect(ai.speakers.every((speaker) => speaker.track === 'AI')).toBe(true);
    expect(ai.appliedTracks).toEqual(['AI']);

    const mixed = listSpeakers({ track: ['AI', 'JavaScript'], limit: 80 });
    expect(
      mixed.speakers.every(
        (speaker) => speaker.track === 'AI' || speaker.track === 'JavaScript'
      )
    ).toBe(true);
    expect(mixed.tracks.length).toBeGreaterThan(0);
  });

  it('lists speakers alphabetically', () => {
    const names = listSpeakers({ limit: 200 }).speakers.map(
      (speaker) => speaker.name
    );
    expect(names).toEqual(
      names.toSorted((left, right) =>
        left.localeCompare(right, 'en', { sensitivity: 'base' })
      )
    );
    expect(listSpeakers({ limit: 5 }).speakers.map((speaker) => speaker.name)).toEqual(
      names.slice(0, 5)
    );
  });

  it('finds a speaker by exact slug', () => {
    const bySlug = getSpeaker('nick-taylor');
    expect(bySlug?.name).toBe('Nick Taylor');
    expect(getSpeaker('Nick Taylor')).toBeUndefined();
    expect(getSpeaker('nick')).toBeUndefined();
  });

  it('returns a day schedule and rejects unknown days', () => {
    const day1 = getSchedule({ day: 1 });
    expect(day1?.label).toMatch(/day 1/i);
    expect(day1?.slots.length).toBeGreaterThan(0);
    expect(day1?.days).toHaveLength(3);
    expect(getSchedule({ day: '2026-09-03' })?.day).toBe(1);
    expect(getSchedule({ day: 9 })).toBeUndefined();
    expect(getSchedule({ day: 'Friday' })).toBeUndefined();
  });

  it('finds a session by exact slug', () => {
    const bySlug = getSession(
      'build-your-first-mcp-app-hwylh8wvaanptgcbow'
    );
    expect(bySlug?.title).toBe('Build your First MCP App');
    expect(getSession('Build your First MCP App')).toBeUndefined();
    expect(getSession('mcp')).toBeUndefined();
  });

  it('searches sessions', () => {
    const found = searchSessions({ query: 'MCP', limit: 10 });
    expect(found.total).toBeGreaterThan(0);
    expect(found.sessions.some((session) => /mcp/i.test(session.title))).toBe(
      true
    );
  });
});

describe('GetScheduleInputSchema', () => {
  it('requires a day and keeps track and room optional', () => {
    expect(GetScheduleInputSchema.parse({ day: 1 }).day).toBe(1);
    expect(GetScheduleInputSchema.parse({ day: '0' }).day).toBe('0');
    expect(
      GetScheduleInputSchema.parse({ day: 2, track: 'AI', room: 'Room 2A' })
        .track
    ).toBe('AI');
    expect(() => GetScheduleInputSchema.parse({})).toThrow();
  });
});

describe('ViewScheduleItemInputSchema', () => {
  it('requires an id', () => {
    expect(
      ViewScheduleItemInputSchema.parse({
        id: 'build-your-first-mcp-app-hwylh8wvaanptgcbow',
      }).id
    ).toBe('build-your-first-mcp-app-hwylh8wvaanptgcbow');
    expect(() => ViewScheduleItemInputSchema.parse({})).toThrow();
    expect(() =>
      ViewScheduleItemInputSchema.parse({ title: 'Build your First MCP App' })
    ).toThrow();
  });
});

describe('GetSpeakerInputSchema', () => {
  it('requires an id and rejects name-only lookup', () => {
    expect(GetSpeakerInputSchema.parse({ id: 'nick-taylor' }).id).toBe(
      'nick-taylor'
    );
    expect(() => GetSpeakerInputSchema.parse({})).toThrow();
    expect(() =>
      GetSpeakerInputSchema.parse({ name: 'Nick Taylor' })
    ).toThrow();
  });
});

describe('ListSpeakersInputSchema', () => {
  it('accepts optional filters', () => {
    expect(ListSpeakersInputSchema.parse({ track: 'AI' }).track).toBe('AI');
    expect(
      ListSpeakersInputSchema.parse({ track: ['AI', 'JavaScript'] }).track
    ).toEqual(['AI', 'JavaScript']);
    expect(() => ListSpeakersInputSchema.parse({ limit: 0 })).toThrow();
  });
});

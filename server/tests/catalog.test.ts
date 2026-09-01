import { describe, expect, it } from 'vitest';
import { getSpeaker, listSpeakers, searchSessions } from '../src/catalog.js';
import { GetSpeakerInputSchema, ListSpeakersInputSchema } from '../src/types.js';

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

  it('finds a speaker by exact slug', () => {
    const bySlug = getSpeaker('nick-taylor');
    expect(bySlug?.name).toBe('Nick Taylor');
    expect(getSpeaker('Nick Taylor')).toBeUndefined();
    expect(getSpeaker('nick')).toBeUndefined();
  });

  it('searches sessions', () => {
    const found = searchSessions({ query: 'MCP', limit: 10 });
    expect(found.total).toBeGreaterThan(0);
    expect(
      found.sessions.some((session) => /mcp/i.test(session.title))
    ).toBe(true);
  });
});

describe('GetSpeakerInputSchema', () => {
  it('requires an id and rejects name-only lookup', () => {
    expect(GetSpeakerInputSchema.parse({ id: 'nick-taylor' }).id).toBe(
      'nick-taylor'
    );
    expect(() => GetSpeakerInputSchema.parse({})).toThrow();
    expect(() => GetSpeakerInputSchema.parse({ name: 'Nick Taylor' })).toThrow();
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

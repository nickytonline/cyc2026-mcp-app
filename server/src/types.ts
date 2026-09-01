import { z } from 'zod';

export interface WidgetDescriptor {
  id: string;
  title: string;
  uri: string;
}

export interface SpeakerRecord {
  id: string;
  slug: string;
  sequence: number;
  isKeynote: boolean;
  name: string;
  title: string;
  company: string;
  track: string;
  talkTitle: string;
  photoUrl: string | null;
  url: string;
  bio?: string;
  sessionIds?: string[];
}

export interface SpeakerCard {
  id: string;
  sequence: number;
  isKeynote: boolean;
  name: string;
  title: string;
  company: string;
  track: string;
  talkTitle: string;
  photoUrl: string | null;
}

export interface SessionSpeaker {
  id: string;
  name: string;
  photoUrl?: string | null;
}

export interface SessionRecord {
  id: string;
  slug: string;
  title: string;
  abstract: string;
  track: string;
  room: string;
  start: string | null;
  end: string | null;
  day: number | null;
  isSocial: boolean;
  speakers: SessionSpeaker[];
  url: string;
}

export interface SessionCard {
  id: string;
  title: string;
  track: string;
  room: string;
  start: string | null;
  end: string | null;
  day: number | null;
  speakers: SessionSpeaker[];
  speakerNames: string[];
}

export interface SocialEvent {
  id: string;
  title: string;
  when: string;
  description: string;
  url: string;
  day?: number;
}

export interface TrackInfo {
  id: string;
  name: string;
  shortName: string;
  color: string;
  blurb: string;
}

export interface RoomInfo {
  id: string;
  name: string;
  color: string;
}

export const ListSpeakersInputSchema = z.object({
  track: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe(
      'One track or several: AI, JavaScript, Cloud, Java, Leadership, Workshops, Keynote. Omit for all tracks.'
    ),
  query: z
    .string()
    .optional()
    .describe('Search speaker name, company, or talk title'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(120)
    .optional()
    .describe('Max speakers to return (default 20)'),
});
export type ListSpeakersInput = z.infer<typeof ListSpeakersInputSchema>;

export interface ListSpeakersOutput {
  speakers: SpeakerCard[];
  total: number;
  showing: number;
  tracks: TrackInfo[];
  appliedTracks: string[];
  [key: string]: unknown;
}

export const GetSpeakerInputSchema = z.object({
  id: z
    .string()
    .min(1)
    .describe('Speaker id or slug from list_speakers, e.g. nick-taylor'),
});
export type GetSpeakerInput = z.infer<typeof GetSpeakerInputSchema>;

export interface GetSpeakerOutput {
  speaker: SpeakerRecord;
  sessions: SessionCard[];
  [key: string]: unknown;
}

export const GetScheduleInputSchema = z.object({
  day: z
    .union([z.number(), z.string().min(1)])
    .describe(
      'Required conference day: 0 = Sept 2 (socials), 1 = Sept 3, 2 = Sept 4, or a date like 2026-09-03'
    ),
  track: z.string().optional().describe('Filter by track'),
  room: z.string().optional().describe('Filter by room, e.g. Room 2A'),
});
export type GetScheduleInput = z.infer<typeof GetScheduleInputSchema>;

export interface ScheduleSlot {
  start: string | null;
  end: string | null;
  sessions: SessionCard[];
}

export interface ScheduleDayOption {
  day: number;
  date: string;
  label: string;
  slots: ScheduleSlot[];
  events: SocialEvent[];
}

export interface GetScheduleOutput {
  day: number;
  date: string;
  label: string;
  timezone: string;
  days: ScheduleDayOption[];
  slots: ScheduleSlot[];
  events: SocialEvent[];
  appliedTrack?: string;
  appliedRoom?: string;
  [key: string]: unknown;
}

export const ViewScheduleItemInputSchema = z.object({
  id: z
    .string()
    .min(1)
    .describe(
      'Session id or slug from get_schedule, e.g. build-your-first-mcp-app-hwylh8wvaanptgcbow'
    ),
});
export type ViewScheduleItemInput = z.infer<typeof ViewScheduleItemInputSchema>;

export interface ViewScheduleItemOutput {
  session: SessionRecord;
  speakers: SpeakerCard[];
  [key: string]: unknown;
}

export const SearchSessionsInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe('Search titles, abstracts, and speaker names'),
  track: z.string().optional().describe('Optional track filter'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(25)
    .optional()
    .describe('Max results (default 12)'),
});
export type SearchSessionsInput = z.infer<typeof SearchSessionsInputSchema>;

export interface SearchSessionsOutput {
  query: string;
  sessions: SessionCard[];
  total: number;
  [key: string]: unknown;
}

export const ListEventsInputSchema = z.object({
  day: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Optional day filter: 0, 1, or 2'),
});
export type ListEventsInput = z.infer<typeof ListEventsInputSchema>;

export interface ListEventsOutput {
  events: SocialEvent[];
  [key: string]: unknown;
}

export const ListTracksInputSchema = z.object({});
export type ListTracksInput = z.infer<typeof ListTracksInputSchema>;

export interface ListTracksOutput {
  tracks: TrackInfo[];
  rooms: RoomInfo[];
  [key: string]: unknown;
}

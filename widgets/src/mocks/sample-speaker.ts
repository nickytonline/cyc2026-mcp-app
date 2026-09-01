import type {
  GetScheduleOutput,
  GetSpeakerOutput,
  ListSpeakersOutput,
  ScheduleDayOption,
  SpeakerCard,
  TrackInfo,
  ViewScheduleItemOutput,
} from 'mcp-app-server/types';
import type { ToolResultPayload } from '../types/mcp-app';

export const sampleTracks: TrackInfo[] = [
  {
    id: 'ai',
    name: 'Artificial Intelligence',
    shortName: 'AI',
    color: '#0868f7',
    blurb: '',
  },
  {
    id: 'javascript',
    name: 'Fullstack JavaScript',
    shortName: 'JavaScript',
    color: '#079455',
    blurb: '',
  },
  {
    id: 'keynote',
    name: 'Keynote',
    shortName: 'Keynote',
    color: '#0868f7',
    blurb: '',
  },
];

export const nickSpeakerCard: SpeakerCard = {
  id: 'nick-taylor',
  sequence: 52,
  isKeynote: false,
  name: 'Nick Taylor',
  title: 'Developer Advocate',
  company: 'Pomerium',
  track: 'JavaScript',
  talkTitle: 'Build your First MCP App',
  photoUrl: null,
};

export const anupamaSpeakerCard: SpeakerCard = {
  id: 'anupama-pathirage',
  sequence: 4,
  isKeynote: false,
  name: 'Anupama Pathirage',
  title: 'Director of Engineering',
  company: 'WSO2',
  track: 'AI',
  talkTitle: 'Building Intelligent Integration Flows',
  photoUrl: null,
};

export const nickSpeakerDetail: GetSpeakerOutput = {
  speaker: {
    ...nickSpeakerCard,
    slug: 'nick-taylor',
    url: 'https://www.commityourcode.com/speakers/nick-taylor',
    bio: 'Nick is a Microsoft MVP, GitHub Star, and Developer Advocate at Pomerium.',
    sessionIds: ['build-your-first-mcp-app'],
  },
  sessions: [
    {
      id: 'build-your-first-mcp-app',
      title: 'Build your First MCP App',
      track: 'JavaScript',
      room: 'Room 2D',
      start: '2026-09-03T14:30:00-05:00',
      end: '2026-09-03T14:55:00-05:00',
      day: 1,
      speakers: [{ id: 'nick-taylor', name: 'Nick Taylor' }],
      speakerNames: ['Nick Taylor'],
    },
  ],
};

export const pickleballEvent = {
  id: 'day-0-pickleball-at-ace',
  title: 'Day[0] Pickleball at Ace!',
  when: 'September 2nd 1:00pm - 3:00pm',
  description: 'Kick off CYC at Ace Pickleball Club in Frisco.',
  url: 'https://www.commityourcode.com/events',
  day: 0,
};

const nickDayOneSlot = {
  start: '2026-09-03T14:30:00-05:00',
  end: '2026-09-03T14:55:00-05:00',
  sessions: [
    {
      id: 'build-your-first-mcp-app',
      title: 'Build your First MCP App',
      track: 'JavaScript',
      room: 'Room 2D',
      start: '2026-09-03T14:30:00-05:00',
      end: '2026-09-03T14:55:00-05:00',
      day: 1,
      speakers: [{ id: 'nick-taylor', name: 'Nick Taylor' }],
      speakerNames: ['Nick Taylor'],
    },
  ],
};

const closingDayTwoSlot = {
  start: '2026-09-04T16:00:00-05:00',
  end: '2026-09-04T16:30:00-05:00',
  sessions: [
    {
      id: 'closing-ceremony',
      title: 'Closing Ceremony & Networking',
      track: 'Keynote',
      room: 'Main Hall',
      start: '2026-09-04T16:00:00-05:00',
      end: '2026-09-04T16:30:00-05:00',
      day: 2,
      speakers: [{ id: 'nick-taylor', name: 'Nick Taylor' }],
      speakerNames: ['Nick Taylor'],
    },
  ],
};

export const scheduleDays: ScheduleDayOption[] = [
  {
    day: 0,
    date: '2026-09-02',
    label: 'Day 0',
    slots: [],
    events: [pickleballEvent],
  },
  {
    day: 1,
    date: '2026-09-03',
    label: 'Day 1',
    slots: [nickDayOneSlot],
    events: [],
  },
  {
    day: 2,
    date: '2026-09-04',
    label: 'Day 2',
    slots: [closingDayTwoSlot],
    events: [],
  },
];

export const nickSchedule: GetScheduleOutput = {
  day: 1,
  date: '2026-09-03',
  label: 'Day 1',
  timezone: 'America/Chicago',
  days: scheduleDays,
  events: [],
  slots: [nickDayOneSlot],
};

export const nickSessionDetail: ViewScheduleItemOutput = {
  session: {
    id: 'build-your-first-mcp-app-hwylh8wvaanptgcbow',
    slug: 'build-your-first-mcp-app-hwylh8wvaanptgcbow',
    title: 'Build your First MCP App',
    abstract:
      'Remote Model Context Protocol (MCP) servers expose tools, but did you know those tools can return UI, not just text? Using the MCP Apps extension to the MCP protocol, an MCP app can deliver interactive experiences directly inside MCP hosts like Claude.ai and ChatGPT. We will break down what makes an MCP app, how it all comes together, then live code one from scratch.',
    track: 'JavaScript',
    room: 'Room 2D',
    start: '2026-09-03T14:30:00-05:00',
    end: '2026-09-03T14:55:00-05:00',
    day: 1,
    isSocial: false,
    speakers: [{ id: 'nick-taylor', name: 'Nick Taylor' }],
    url: 'https://www.commityourcode.com/sessions/build-your-first-mcp-app-hwylh8wvaanptgcbow',
  },
  speakers: [nickSpeakerCard],
};

const allCards = [anupamaSpeakerCard, nickSpeakerCard];

export const nickSpeakersList: ListSpeakersOutput = {
  showing: 2,
  total: 109,
  speakers: allCards,
  tracks: sampleTracks,
  appliedTracks: [],
};

export async function mockConferenceTools(params: {
  name: string;
  arguments?: Record<string, unknown>;
}): Promise<ToolResultPayload<unknown>> {
  if (params.name === 'get_speaker') {
    return { content: [], structuredContent: nickSpeakerDetail };
  }
  if (params.name === 'list_speakers') {
    const raw = params.arguments?.track;
    const tracks = Array.isArray(raw)
      ? raw.map(String)
      : raw
        ? [String(raw)]
        : [];
    const speakers = (
      tracks.length === 0
        ? allCards
        : allCards.filter((speaker) => tracks.includes(speaker.track))
    ).toSorted((left, right) =>
      left.name.localeCompare(right.name, 'en', { sensitivity: 'base' })
    );
    return {
      content: [],
      structuredContent: {
        speakers,
        showing: speakers.length,
        total: speakers.length,
        tracks: sampleTracks,
        appliedTracks: tracks,
      } satisfies ListSpeakersOutput,
    };
  }
  if (params.name === 'get_schedule') {
    const day = Number(params.arguments?.day);
    const current = scheduleDays.find((entry) => entry.day === day) ?? scheduleDays[1];
    return {
      content: [],
      structuredContent: {
        ...nickSchedule,
        day: current.day,
        date: current.date,
        label: current.label,
        slots: current.slots,
        events: current.events,
      } satisfies GetScheduleOutput,
    };
  }
  return {
    content: [
      {
        type: 'text',
        text: `Mock response: ${JSON.stringify(params.arguments ?? {})}`,
      },
    ],
  };
}

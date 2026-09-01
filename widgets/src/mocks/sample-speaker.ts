import type {
  GetSpeakerOutput,
  ListSpeakersOutput,
  SpeakerCard,
  TrackInfo,
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

const allCards = [nickSpeakerCard, anupamaSpeakerCard];

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
    const speakers =
      tracks.length === 0
        ? allCards
        : allCards.filter((speaker) => tracks.includes(speaker.track));
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
  return {
    content: [
      {
        type: 'text',
        text: `Mock response: ${JSON.stringify(params.arguments ?? {})}`,
      },
    ],
  };
}

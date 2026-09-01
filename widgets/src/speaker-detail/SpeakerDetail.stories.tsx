import type { Meta, StoryObj } from '@storybook/react';
import { createMockApp } from '../mocks/mock-app';
import SpeakerDetail from './SpeakerDetail';
import type { GetSpeakerOutput } from 'mcp-app-server/types';

const sample: GetSpeakerOutput = {
  speaker: {
    id: 'nick-taylor',
    slug: 'nick-taylor',
    sequence: 52,
    isKeynote: false,
    name: 'Nick Taylor',
    title: 'Developer Advocate',
    company: 'Pomerium',
    track: 'JavaScript',
    talkTitle: 'Build your First MCP App',
    photoUrl: null,
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

const meta = {
  title: 'Widgets/SpeakerDetail',
  component: SpeakerDetail,
} satisfies Meta<typeof SpeakerDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SpeakerDetail
      app={createMockApp<GetSpeakerOutput>({ toolOutput: sample })}
    />
  ),
};

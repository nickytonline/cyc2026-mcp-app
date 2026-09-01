import type { Meta, StoryObj } from '@storybook/react';
import { createMockApp } from '../mocks/mock-app';
import SpeakersList from './SpeakersList';
import type { ListSpeakersOutput } from 'mcp-app-server/types';

const sample: ListSpeakersOutput = {
  showing: 2,
  total: 109,
  speakers: [
    {
      id: 'nick-taylor',
      sequence: 52,
      isKeynote: false,
      name: 'Nick Taylor',
      title: 'Developer Advocate',
      company: 'Pomerium',
      track: 'JavaScript',
      talkTitle: 'Build your First MCP App',
      photoUrl: null,
    },
    {
      id: 'kevin-j-scott',
      sequence: 1,
      isKeynote: true,
      name: 'Kevin J. Scott',
      title: 'Chief Technology Officer',
      company: 'PGA of America',
      track: 'Keynote',
      talkTitle: 'Keynote',
      photoUrl: null,
    },
  ],
};

const meta = {
  title: 'Widgets/SpeakersList',
  component: SpeakersList,
} satisfies Meta<typeof SpeakersList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SpeakersList app={createMockApp<ListSpeakersOutput>({ toolOutput: sample })} />
  ),
};

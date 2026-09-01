import type { Meta, StoryObj } from '@storybook/react';
import { createMockApp } from '../mocks/mock-app';
import SessionDetail from './SessionDetail';
import type { ViewScheduleItemOutput } from 'mcp-app-server/types';

const sample: ViewScheduleItemOutput = {
  session: {
    id: 'build-your-first-mcp-app',
    slug: 'build-your-first-mcp-app',
    title: 'Build your First MCP App',
    abstract:
      'Remote MCP servers expose tools, but those tools can return UI, not just text.',
    track: 'JavaScript',
    room: 'Room 2D',
    start: '2026-09-03T14:30:00-05:00',
    end: '2026-09-03T14:55:00-05:00',
    day: 1,
    isSocial: false,
    speakers: [{ id: 'nick-taylor', name: 'Nick Taylor' }],
    url: 'https://www.commityourcode.com/sessions/build-your-first-mcp-app-hwylh8wvaanptgcbow',
  },
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
  ],
};

const meta = {
  title: 'Widgets/SessionDetail',
  component: SessionDetail,
} satisfies Meta<typeof SessionDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SessionDetail
      app={createMockApp<ViewScheduleItemOutput>({ toolOutput: sample })}
    />
  ),
};

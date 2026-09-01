import type { Meta, StoryObj } from '@storybook/react';
import { createMockApp } from '../mocks/mock-app';
import Schedule from './Schedule';
import type { GetScheduleOutput } from 'mcp-app-server/types';

const sample: GetScheduleOutput = {
  day: 1,
  date: '2026-09-03',
  label: 'Day 1',
  timezone: 'America/Chicago',
  events: [],
  slots: [
    {
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
          speakerNames: ['Nick Taylor'],
        },
      ],
    },
  ],
};

const meta = {
  title: 'Widgets/Schedule',
  component: Schedule,
} satisfies Meta<typeof Schedule>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Schedule app={createMockApp<GetScheduleOutput>({ toolOutput: sample })} />
  ),
};

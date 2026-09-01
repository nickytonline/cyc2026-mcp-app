import type { Meta, StoryObj } from '@storybook/react';
import { createMockApp } from '../mocks/mock-app';
import EventsList from './EventsList';
import type { ListEventsOutput } from 'mcp-app-server/types';

const sample: ListEventsOutput = {
  events: [
    {
      id: 'day-0-pickleball-at-ace',
      title: 'Day[0] Pickleball at Ace!',
      when: 'September 2nd 1:00pm - 3:00pm',
      description: 'Kick off CYC at Ace Pickleball Club in Frisco.',
      url: 'https://www.commityourcode.com/events',
      day: 0,
    },
  ],
};

const meta = {
  title: 'Widgets/EventsList',
  component: EventsList,
} satisfies Meta<typeof EventsList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <EventsList app={createMockApp<ListEventsOutput>({ toolOutput: sample })} />
  ),
};

export const Dark: Story = {
  render: () => (
    <EventsList
      app={createMockApp<ListEventsOutput>({
        toolOutput: sample,
        hostContext: {
          theme: 'dark',
          displayMode: 'inline',
          containerDimensions: { width: 800, maxWidth: 800, maxHeight: 720 },
        },
      })}
    />
  ),
};

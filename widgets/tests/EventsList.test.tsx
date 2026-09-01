import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventsList from '../src/events-list/EventsList.js';
import { createMockApp } from '../src/mocks/mock-app.js';
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

describe('EventsList', () => {
  it('renders a contained scrolling events list', async () => {
    render(
      <EventsList app={createMockApp({ toolOutput: sample })} />
    );

    expect(await screen.findByText('Day[0] Pickleball at Ace!')).toBeTruthy();
    const region = screen.getByRole('list', { name: 'Events' });
    expect(region.className).toContain('cyc-scroll');
  });
});

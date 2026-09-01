import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Schedule from '../src/schedule/Schedule.js';
import { createMockApp } from '../src/mocks/mock-app.js';
import {
  mockConferenceTools,
  nickSchedule,
} from '../src/mocks/sample-speaker.js';

describe('Schedule', () => {
  it('renders a contained scrolling agenda', async () => {
    render(
      <Schedule
        app={createMockApp({
          toolOutput: nickSchedule,
          callServerTool: mockConferenceTools,
        })}
      />
    );

    expect(await screen.findByText('Build your First MCP App')).toBeTruthy();
    const region = screen.getByLabelText('Agenda');
    expect(region.className).toContain('cyc-scroll');
  });

  it('opens a speaker profile from a session card', async () => {
    const user = userEvent.setup();
    render(
      <Schedule
        app={createMockApp({
          toolOutput: nickSchedule,
          callServerTool: mockConferenceTools,
          hostContext: {
            theme: 'light',
            displayMode: 'inline',
            containerDimensions: { width: 800, maxWidth: 800, maxHeight: 720 },
          },
        })}
      />
    );

    await user.click(
      await screen.findByRole('button', { name: 'Nick Taylor' })
    );
    expect(
      await screen.findByText(
        'Nick is a Microsoft MVP, GitHub Star, and Developer Advocate at Pomerium.'
      )
    ).toBeTruthy();
  });
});

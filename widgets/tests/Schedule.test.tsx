import { describe, it, expect, vi } from 'vitest';
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
    expect(screen.getByRole('radio', { name: /Day 1/i }).getAttribute('aria-checked')).toBe(
      'true'
    );
    expect(
      screen.getByRole('button', { name: /Build your First MCP App/i }).querySelector('img')
        ?.getAttribute('src')
    ).toContain('nick-taylor.jpg');
  });

  it('switches the current agenda when a day is picked', async () => {
    const user = userEvent.setup();
    const callServerTool = vi.fn(mockConferenceTools);
    render(
      <Schedule
        app={createMockApp({
          toolOutput: nickSchedule,
          callServerTool,
        })}
      />
    );

    expect(await screen.findByText('Build your First MCP App')).toBeTruthy();
    await user.click(screen.getByRole('radio', { name: /Day 0/i }));
    expect(await screen.findByText('Day[0] Pickleball at Ace!')).toBeTruthy();
    expect(screen.queryByText('Build your First MCP App')).toBeNull();
    expect(screen.getByRole('radio', { name: /Day 0/i }).getAttribute('aria-checked')).toBe(
      'true'
    );
    expect(callServerTool).not.toHaveBeenCalled();
  });

  it('opens a session overlay from the whole card', async () => {
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
      await screen.findByRole('button', { name: /Build your First MCP App/i })
    );
    expect(
      await screen.findByText(/Remote Model Context Protocol/)
    ).toBeTruthy();
    expect(screen.getByLabelText('Ask about this session')).toBeTruthy();
    expect(
      screen.getByRole('dialog').querySelector('img')?.getAttribute('src')
    ).toContain('nick-taylor.jpg');
    expect(
      screen.queryByText(
        'Nick is a Microsoft MVP, GitHub Star, and Developer Advocate at Pomerium.'
      )
    ).toBeNull();
    expect(screen.queryByLabelText('Ask about this speaker')).toBeNull();
  });

  it('toggles fullscreen from the widget header', async () => {
    const user = userEvent.setup();
    const mockApp = createMockApp({
      toolOutput: nickSchedule,
      callServerTool: mockConferenceTools,
      hostContext: {
        theme: 'light',
        displayMode: 'inline',
        availableDisplayModes: ['inline', 'fullscreen'],
        containerDimensions: { width: 800, maxWidth: 800, maxHeight: 720 },
      },
    });

    render(<Schedule app={mockApp} />);
    await screen.findByText('Build your First MCP App');

    await user.click(screen.getByRole('button', { name: 'Full screen' }));
    expect(mockApp.getHostContext()?.displayMode).toBe('fullscreen');
  });
});

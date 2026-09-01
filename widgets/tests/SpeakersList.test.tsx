import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SpeakersList from '../src/speakers-list/SpeakersList.js';
import { createMockApp } from '../src/mocks/mock-app.js';
import {
  mockConferenceTools,
  nickSpeakersList,
} from '../src/mocks/sample-speaker.js';

describe('SpeakersList', () => {
  it('renders speaker cards with photos and talks', async () => {
    render(
      <SpeakersList
        app={createMockApp({
          toolOutput: nickSpeakersList,
          callServerTool: mockConferenceTools,
        })}
      />
    );

    expect(await screen.findByText('Nick Taylor')).toBeTruthy();
    expect(screen.getByText('Build your First MCP App')).toBeTruthy();
    expect(screen.queryByText('052')).toBeNull();
    const region = screen.getByRole('list', { name: 'Speakers' });
    expect(region.className).toContain('cyc-scroll');
  });

  it('opens a speaker profile with sessions', async () => {
    const user = userEvent.setup();
    render(
      <SpeakersList
        app={createMockApp({
          toolOutput: nickSpeakersList,
          callServerTool: mockConferenceTools,
          hostContext: {
            theme: 'light',
            displayMode: 'inline',
            containerDimensions: { width: 800, maxWidth: 800, maxHeight: 720 },
          },
        })}
      />
    );

    await user.click(await screen.findByRole('button', { name: /Nick Taylor/i }));
    expect(
      await screen.findByText(
        'Nick is a Microsoft MVP, GitHub Star, and Developer Advocate at Pomerium.'
      )
    ).toBeTruthy();
    expect(screen.getByText('On the program')).toBeTruthy();
    expect(screen.getByLabelText('Ask about this speaker')).toBeTruthy();
    const details = screen.getByRole('region', { name: 'Speaker details' });
    expect(details.className).toContain('cyc-scroll');
    expect(details.textContent).toContain('Microsoft MVP');
  });

  it('filters speakers by track', async () => {
    const user = userEvent.setup();
    render(
      <SpeakersList
        app={createMockApp({
          toolOutput: nickSpeakersList,
          callServerTool: mockConferenceTools,
        })}
      />
    );

    await user.click(await screen.findByRole('button', { name: /All tracks/i }));
    await user.click(await screen.findByRole('menuitemcheckbox', { name: 'AI' }));
    expect(await screen.findByText('Anupama Pathirage')).toBeTruthy();
    expect(screen.queryByText('Nick Taylor')).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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
    expect(screen.queryByText(/Showing \d+ of/)).toBeNull();
    const names = screen
      .getAllByRole('heading', { level: 2 })
      .map((node) => node.textContent);
    expect(names.slice(0, 2)).toEqual(['Anupama Pathirage', 'Nick Taylor']);
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

    await user.click(
      await screen.findByRole('button', { name: /Nick Taylor/i })
    );
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

  it('expands a talk inline in the compact speaker drawer', async () => {
    const user = userEvent.setup();
    render(
      <SpeakersList
        app={createMockApp({
          toolOutput: nickSpeakersList,
          callServerTool: mockConferenceTools,
          hostContext: {
            theme: 'light',
            displayMode: 'inline',
            containerDimensions: { width: 390, maxWidth: 390, maxHeight: 720 },
          },
        })}
      />
    );

    await user.click(
      await screen.findByRole('button', { name: /Nick Taylor/i })
    );
    const speakerDetails = await screen.findByRole('region', {
      name: 'Speaker details',
    });
    await user.click(
      within(speakerDetails).getByText('Build your First MCP App')
    );
    expect(
      await within(speakerDetails).findByText(/Remote Model Context Protocol/)
    ).toBeTruthy();
    expect(
      within(speakerDetails).getByLabelText('Ask about this session')
    ).toBeTruthy();
    expect(screen.getByLabelText('Ask about this speaker')).toBeTruthy();
    expect(
      screen.getByText(
        'Nick is a Microsoft MVP, GitHub Star, and Developer Advocate at Pomerium.'
      )
    ).toBeTruthy();
  });

  it('expands a talk inline from On the program', async () => {
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

    await user.click(
      await screen.findByRole('button', { name: /Nick Taylor/i })
    );
    const speakerDetails = await screen.findByRole('region', {
      name: 'Speaker details',
    });
    await user.click(
      within(speakerDetails).getByText('Build your First MCP App')
    );
    expect(
      await within(speakerDetails).findByText(/Remote Model Context Protocol/)
    ).toBeTruthy();
    expect(
      within(speakerDetails).getByLabelText('Ask about this session')
    ).toBeTruthy();
    expect(screen.getByLabelText('Ask about this speaker')).toBeTruthy();
    expect(
      screen.getByText(
        'Nick is a Microsoft MVP, GitHub Star, and Developer Advocate at Pomerium.'
      )
    ).toBeTruthy();
  });

  it('toggles a navy dark theme without waiting on the host', async () => {
    const user = userEvent.setup();
    render(
      <SpeakersList
        app={createMockApp({
          toolOutput: nickSpeakersList,
          callServerTool: mockConferenceTools,
        })}
      />
    );

    const toggle = await screen.findByRole('button', {
      name: 'Switch to dark theme',
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    await user.click(toggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    await user.click(
      screen.getByRole('button', { name: 'Switch to light theme' })
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('keeps the speaker overlay on the widget dark theme', async () => {
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

    await user.click(
      await screen.findByRole('button', { name: 'Switch to dark theme' })
    );
    await user.click(
      await screen.findByRole('button', { name: /Nick Taylor/i })
    );
    expect(
      await screen.findByText(
        'Nick is a Microsoft MVP, GitHub Star, and Developer Advocate at Pomerium.'
      )
    ).toBeTruthy();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByRole('dialog').className).toContain('dark');
  });

  it('follows the host dark theme until the widget toggle overrides it', async () => {
    const user = userEvent.setup();
    render(
      <SpeakersList
        app={createMockApp({
          toolOutput: nickSpeakersList,
          callServerTool: mockConferenceTools,
          hostContext: {
            theme: 'dark',
            displayMode: 'inline',
            containerDimensions: { width: 800, maxWidth: 800, maxHeight: 720 },
          },
        })}
      />
    );

    expect(
      await screen.findByRole('button', { name: 'Switch to light theme' })
    ).toBeTruthy();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    await user.click(
      screen.getByRole('button', { name: 'Switch to light theme' })
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
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

    const trigger = await screen.findByRole('button', { name: /All tracks/i });
    expect(trigger.className).toContain('hover:text-[var(--cyc-ink)]');
    await user.click(trigger);
    await user.click(
      await screen.findByRole('menuitemcheckbox', { name: 'AI' })
    );
    expect(await screen.findByText('Anupama Pathirage')).toBeTruthy();
    expect(screen.queryByText('Nick Taylor')).toBeNull();
  });

  it('toggles fullscreen from the widget header', async () => {
    const user = userEvent.setup();
    const mockApp = createMockApp({
      toolOutput: nickSpeakersList,
      callServerTool: mockConferenceTools,
      hostContext: {
        theme: 'light',
        displayMode: 'inline',
        availableDisplayModes: ['inline', 'fullscreen'],
        containerDimensions: { width: 800, maxWidth: 800, maxHeight: 720 },
      },
    });

    render(<SpeakersList app={mockApp} />);
    await screen.findByText('Nick Taylor');

    const fullscreenButton = screen.getByRole('button', {
      name: 'Full screen',
    });
    await user.click(fullscreenButton);

    expect(mockApp.getHostContext()?.displayMode).toBe('fullscreen');
    expect(
      screen.getByRole('button', { name: 'Exit full screen' })
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Exit full screen' }));
    expect(mockApp.getHostContext()?.displayMode).toBe('inline');
  });
});

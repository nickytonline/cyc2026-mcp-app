import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SpeakersList from '../src/speakers-list/SpeakersList.js';
import { createMockApp } from '../src/mocks/mock-app.js';
import type { ListSpeakersOutput } from 'mcp-app-server/types';

describe('SpeakersList', () => {
  it('renders numbered speaker cards', async () => {
    render(
      <SpeakersList
        app={createMockApp<ListSpeakersOutput>({
          toolOutput: {
            showing: 1,
            total: 1,
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
          },
        })}
      />
    );

    expect(await screen.findByText('Nick Taylor')).toBeTruthy();
    expect(screen.getByText('Build your First MCP App')).toBeTruthy();
    expect(screen.getByText('052')).toBeTruthy();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SessionDetail from '../src/session-detail/SessionDetail.js';
import { createMockApp } from '../src/mocks/mock-app.js';
import {
  mockConferenceTools,
  nickSessionDetail,
} from '../src/mocks/sample-speaker.js';

describe('SessionDetail', () => {
  it('renders a contained session card', async () => {
    render(
      <SessionDetail
        app={createMockApp({
          toolOutput: nickSessionDetail,
          callServerTool: mockConferenceTools,
        })}
      />
    );

    expect(await screen.findByText('Build your First MCP App')).toBeTruthy();
    const region = screen.getByLabelText('Session');
    expect(region.className).toContain('cyc-scroll');
  });

  it('opens a speaker profile from the session', async () => {
    const user = userEvent.setup();
    render(
      <SessionDetail
        app={createMockApp({
          toolOutput: nickSessionDetail,
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
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('shows session info and an ask-about-session field', async () => {
    render(
      <SessionDetail
        app={createMockApp({
          toolOutput: nickSessionDetail,
          callServerTool: mockConferenceTools,
        })}
      />
    );

    expect(await screen.findByText(/Remote Model Context Protocol/)).toBeTruthy();
    expect(screen.getByText('Nick Taylor')).toBeTruthy();
    expect(screen.getByLabelText('Ask about this session')).toBeTruthy();
    expect(
      screen.getByLabelText('Session').querySelector('img')?.getAttribute('src')
    ).toContain('nick-taylor.jpg');
    expect(screen.queryByRole('button', { name: /Nick Taylor/i })).toBeNull();
    expect(screen.queryByLabelText('Ask about this speaker')).toBeNull();
  });
});

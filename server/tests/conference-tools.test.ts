import { describe, expect, it } from 'vitest';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { registerConferenceTools } from '../src/conference-tools.js';
import type { WidgetDescriptor } from '../src/types.js';

const widgets = {
  speakersList: {
    id: 'speakers-list',
    title: 'Speakers',
    uri: 'ui://speakers-list',
  },
  speakerDetail: {
    id: 'speaker-detail',
    title: 'Speaker',
    uri: 'ui://speaker-detail',
  },
  schedule: { id: 'schedule', title: 'Schedule', uri: 'ui://schedule' },
  sessionDetail: {
    id: 'session-detail',
    title: 'Session',
    uri: 'ui://session-detail',
  },
  eventsList: { id: 'events-list', title: 'Events', uri: 'ui://events-list' },
} satisfies Record<string, WidgetDescriptor>;

const silentLogger = {
  info: () => undefined,
  error: () => undefined,
};

function createHandler() {
  return createMcpHandler(
    () => {
      const server = new McpServer({
        name: 'cyc2026-test',
        version: '1.0.0',
      });
      const extAppsServer = server as unknown as Parameters<
        typeof registerAppTool
      >[0];
      registerConferenceTools(extAppsServer, widgets, silentLogger);
      return server;
    },
    { legacy: 'stateless' }
  );
}

function createLegacyRequest(body: unknown): Request {
  return new Request('http://localhost/mcp', {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function readResponseBody(response: Response): Promise<unknown> {
  const body = await response.text();
  const eventData = body.split('\n').find((line) => line.startsWith('data: '));

  return JSON.parse(eventData ? eventData.slice('data: '.length) : body);
}

describe('conference tool registration', () => {
  it('survives a legacy inspector initialize handshake', async () => {
    const handler = createHandler();

    const response = await handler.fetch(
      createLegacyRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          capabilities: {},
          clientInfo: { name: 'mcp-inspector', version: '1.0.0' },
        },
      })
    );

    expect(response.status).toBe(200);
    const body = (await readResponseBody(response)) as {
      result?: { serverInfo?: { name?: string } };
    };
    expect(body.result?.serverInfo?.name).toBe('cyc2026-test');

    await handler.close();
  });

  it('lists every conference tool including text-only list_tracks', async () => {
    const handler = createHandler();

    const response = await handler.fetch(
      createLegacyRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      })
    );

    expect(response.status).toBe(200);
    const body = (await readResponseBody(response)) as {
      result?: { tools?: Array<{ name: string }> };
    };
    expect(body.result?.tools?.map((tool) => tool.name)).toEqual([
      'list_speakers',
      'get_speaker',
      'get_schedule',
      'view_schedule_item',
      'search_sessions',
      'list_events',
      'list_tracks',
    ]);

    await handler.close();
  });
});

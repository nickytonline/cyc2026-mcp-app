import type { ServerContext } from '@modelcontextprotocol/server';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import {
  GetScheduleInputSchema,
  GetSpeakerInputSchema,
  ListEventsInputSchema,
  ListSpeakersInputSchema,
  ListTracksInputSchema,
  SearchSessionsInputSchema,
  ViewScheduleItemInputSchema,
  type WidgetDescriptor,
} from './types.js';
import { clientCanRenderUi } from './ui-capability.js';
import {
  formatSessionLine,
  getSchedule,
  getSession,
  getSpeaker,
  listEvents,
  listSpeakers,
  listTracks,
  searchSessions,
  sessionsForSpeaker,
  speakersForSession,
} from './catalog.js';

type ExtAppsServer = Parameters<typeof registerAppTool>[0];

interface ToolLogger {
  info: (obj: Record<string, unknown>, msg?: string) => void;
  error: (obj: Record<string, unknown>, msg?: string) => void;
}

function validationError(message: string) {
  return {
    content: [{ type: 'text' as const, text: `Error: ${message}` }],
    isError: true as const,
  };
}

function result(
  text: string,
  structured: Record<string, unknown>,
  canRenderUi: boolean
) {
  if (!canRenderUi) {
    return { content: [{ type: 'text' as const, text }] };
  }
  return {
    content: [{ type: 'text' as const, text }],
    structuredContent: structured,
  };
}

export function registerConferenceTools(
  extAppsServer: ExtAppsServer,
  widgets: Record<string, WidgetDescriptor>,
  serverLogger: ToolLogger
) {
  registerAppTool(
    extAppsServer,
    'list_speakers',
    {
      title: 'List CYC26 speakers',
      description:
        'List Commit Your Code 2026 speakers. Filter by track (AI, JavaScript, Cloud, Java, Leadership, Workshops) or search by name, company, or talk title.',
      inputSchema: ListSpeakersInputSchema.shape,
      _meta: { ui: { resourceUri: widgets.speakersList.uri } },
    },
    async (args, ctx) => {
      const parsed = ListSpeakersInputSchema.safeParse(args);
      if (!parsed.success) {
        return validationError(
          parsed.error.issues.map((issue) => issue.message).join(', ')
        );
      }
      const output = listSpeakers(parsed.data);
      serverLogger.info(
        { toolName: 'list_speakers', total: output.total },
        'Tool invoked'
      );
      const lines = output.speakers
        .map(
          (speaker) =>
            `${String(speaker.sequence).padStart(3, '0')} ${speaker.name} · ${speaker.track} — ${speaker.talkTitle}`
        )
        .join('\n');
      const text = `Showing ${output.showing} of ${output.total} CYC26 speakers.\n${lines}`;
      return result(
        text,
        output,
        clientCanRenderUi(ctx as unknown as ServerContext)
      );
    }
  );

  registerAppTool(
    extAppsServer,
    'get_speaker',
    {
      title: 'Get a CYC26 speaker',
      description:
        'Get one Commit Your Code speaker by slug (e.g. nick-taylor) or name, including bio and their session.',
      inputSchema: GetSpeakerInputSchema.shape,
      _meta: { ui: { resourceUri: widgets.speakerDetail.uri } },
    },
    async (args, ctx) => {
      const parsed = GetSpeakerInputSchema.safeParse(args);
      if (!parsed.success) {
        return validationError(
          parsed.error.issues.map((issue) => issue.message).join(', ')
        );
      }
      if (!parsed.data.id && !parsed.data.name) {
        return validationError('Provide id or name');
      }
      const speaker = getSpeaker(parsed.data);
      if (!speaker) {
        return validationError('Speaker not found');
      }
      const sessions = sessionsForSpeaker(speaker);
      const text = [
        `${speaker.name} — ${speaker.title}${speaker.company ? ` · ${speaker.company}` : ''}`,
        speaker.track,
        speaker.talkTitle,
        speaker.bio,
        ...sessions.map(formatSessionLine),
      ]
        .filter(Boolean)
        .join('\n');
      return result(
        text,
        { speaker, sessions },
        clientCanRenderUi(ctx as unknown as ServerContext)
      );
    }
  );

  registerAppTool(
    extAppsServer,
    'get_schedule',
    {
      title: 'Get the CYC26 schedule',
      description:
        'Get the Commit Your Code agenda for a day. day=0 is Sept 2 (socials), 1 is Sept 3, 2 is Sept 4. Optional track or room filters.',
      inputSchema: GetScheduleInputSchema.shape,
      _meta: { ui: { resourceUri: widgets.schedule.uri } },
    },
    async (args, ctx) => {
      const parsed = GetScheduleInputSchema.safeParse(args);
      if (!parsed.success) {
        return validationError(
          parsed.error.issues.map((issue) => issue.message).join(', ')
        );
      }
      const output = getSchedule(parsed.data);
      const sessionLines = output.slots.flatMap((slot) =>
        slot.sessions.map(formatSessionLine)
      );
      const eventLines = output.events.map(
        (event) => `${event.when} — ${event.title}`
      );
      const text = [
        `${output.label} (${output.date}, ${output.timezone})`,
        ...eventLines,
        ...sessionLines,
      ].join('\n');
      return result(
        text || `${output.label} has no matching sessions.`,
        output,
        clientCanRenderUi(ctx as unknown as ServerContext)
      );
    }
  );

  registerAppTool(
    extAppsServer,
    'view_schedule_item',
    {
      title: 'View a CYC26 session',
      description:
        'Get one session by id/slug: title, abstract, time, room, track, and speakers.',
      inputSchema: ViewScheduleItemInputSchema.shape,
      _meta: { ui: { resourceUri: widgets.sessionDetail.uri } },
    },
    async (args, ctx) => {
      const parsed = ViewScheduleItemInputSchema.safeParse(args);
      if (!parsed.success) {
        return validationError(
          parsed.error.issues.map((issue) => issue.message).join(', ')
        );
      }
      const session = getSession(parsed.data.id);
      if (!session) {
        return validationError('Session not found');
      }
      const sessionSpeakers = speakersForSession(session);
      const text = [
        session.title,
        formatSessionLine(session),
        session.abstract,
        session.url,
      ]
        .filter(Boolean)
        .join('\n\n');
      return result(
        text,
        { session, speakers: sessionSpeakers },
        clientCanRenderUi(ctx as unknown as ServerContext)
      );
    }
  );

  registerAppTool(
    extAppsServer,
    'search_sessions',
    {
      title: 'Search CYC26 sessions',
      description:
        'Search talks by title, abstract, or speaker name. Optional track filter.',
      inputSchema: SearchSessionsInputSchema.shape,
      _meta: { ui: { resourceUri: widgets.schedule.uri } },
    },
    async (args, ctx) => {
      const parsed = SearchSessionsInputSchema.safeParse(args);
      if (!parsed.success) {
        return validationError(
          parsed.error.issues.map((issue) => issue.message).join(', ')
        );
      }
      const found = searchSessions(parsed.data);
      const lines = found.sessions.map(formatSessionLine).join('\n');
      const text = `Found ${found.total} session(s) for "${parsed.data.query}". Showing ${found.sessions.length}.\n${lines}`;
      return result(
        text,
        {
          query: parsed.data.query,
          ...found,
          day: 1,
          date: '',
          label: `Search: ${parsed.data.query}`,
          timezone: 'America/Chicago',
          slots: [
            {
              start: null,
              end: null,
              sessions: found.sessions,
            },
          ],
          events: [],
        },
        clientCanRenderUi(ctx as unknown as ServerContext)
      );
    }
  );

  registerAppTool(
    extAppsServer,
    'list_events',
    {
      title: 'List CYC26 social events',
      description:
        'List pickleball, parties, morning connect, and closing ceremony. Optional day filter (0, 1, or 2).',
      inputSchema: ListEventsInputSchema.shape,
      _meta: { ui: { resourceUri: widgets.eventsList.uri } },
    },
    async (args, ctx) => {
      const parsed = ListEventsInputSchema.safeParse(args);
      if (!parsed.success) {
        return validationError(
          parsed.error.issues.map((issue) => issue.message).join(', ')
        );
      }
      const eventList = listEvents(parsed.data.day);
      const text = eventList
        .map((event) => `${event.when} — ${event.title}\n${event.description}`)
        .join('\n\n');
      return result(
        text,
        { events: eventList },
        clientCanRenderUi(ctx as unknown as ServerContext)
      );
    }
  );

  registerAppTool(
    extAppsServer,
    'list_tracks',
    {
      title: 'List CYC26 tracks',
      description:
        'List the six technical tracks, keynote, and campus rooms for Commit Your Code 2026.',
      inputSchema: ListTracksInputSchema.shape,
    },
    async (args) => {
      const parsed = ListTracksInputSchema.safeParse(args ?? {});
      if (!parsed.success) {
        return validationError(
          parsed.error.issues.map((issue) => issue.message).join(', ')
        );
      }
      const output = listTracks();
      const text = [
        ...output.tracks.map(
          (track) => `${track.shortName}: ${track.name} — ${track.blurb}`
        ),
        '',
        'Rooms: ' + output.rooms.map((room) => room.name).join(', '),
      ].join('\n');
      return {
        content: [{ type: 'text' as const, text }],
        structuredContent: output,
      };
    }
  );
}

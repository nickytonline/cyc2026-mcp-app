import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { config } from 'dotenv';
import pino from 'pino';
import pinoHttp from 'pino-http';
import {
  createMcpHandler,
  McpServer,
  type ProtocolEra,
  type ServerContext,
} from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';
import { type WidgetDescriptor } from './types.js';
import { registerConferenceTools } from './conference-tools.js';
import {
  buildDevBootstrapHtml,
  buildProductionWidgetHtml,
  clientMatches,
  CYC_PHOTO_DOMAINS,
  getClientIdentity,
  GOOGLE_FONTS_DOMAINS,
  inlineWidgetAssets,
  parseClientList,
  resolveWidgetOrigin,
  shouldInlineWidgetHtml,
} from './widget-html.js';

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const ASSETS_DIR = path.resolve(ROOT_DIR, 'assets');

const PORT = Number(process.env.PORT || '8080');
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const WIDGET_PORT = Number(process.env.WIDGET_PORT || '4444');
const configuredBaseUrl = (process.env.BASE_URL || '').trim();
const BASE_URL = configuredBaseUrl || `http://localhost:${WIDGET_PORT}`;
const INLINE_DEV_MODE = process.env.INLINE_DEV_MODE === 'true';
const IS_DEV = (process.env.NODE_ENV || 'development') === 'development';
// Clients that get fully inlined widget HTML in dev (comma-separated,
// case-insensitive substring match on the client's name/title). claude.ai
// can't load a Vite dev module graph from an external origin, so it gets the
// auto-rebuilt inlined bundle instead. Unidentified clients are also inlined.
const WIDGET_INLINE_CLIENTS = parseClientList(
  process.env.WIDGET_INLINE_CLIENTS,
  ['claude']
);
// Experimental: clients that get dev-server modules via a dynamic import()
// bootstrap instead of inlined HTML. Hosts rendering widgets in srcdoc
// iframes don't execute static <script src> tags but may allow dynamic
// loading from resourceDomains origins. Takes precedence over
// WIDGET_INLINE_CLIENTS so e.g. WIDGET_BOOTSTRAP_CLIENTS=claude can trial
// no-build dev against claude.ai (requires BASE_URL to be an https tunnel).
const WIDGET_BOOTSTRAP_CLIENTS = parseClientList(
  process.env.WIDGET_BOOTSTRAP_CLIENTS,
  []
);

const logger = pino({
  level: LOG_LEVEL,
  transport:
    NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

const SPEAKERS_LIST_WIDGET: WidgetDescriptor = {
  id: 'speakers-list',
  title: 'CYC26 Speakers',
  uri: 'ui://speakers-list',
};
const SPEAKER_DETAIL_WIDGET: WidgetDescriptor = {
  id: 'speaker-detail',
  title: 'CYC26 Speaker',
  uri: 'ui://speaker-detail',
};
const SCHEDULE_WIDGET: WidgetDescriptor = {
  id: 'schedule',
  title: 'CYC26 Schedule',
  uri: 'ui://schedule',
};
const SESSION_DETAIL_WIDGET: WidgetDescriptor = {
  id: 'session-detail',
  title: 'CYC26 Session',
  uri: 'ui://session-detail',
};
const EVENTS_LIST_WIDGET: WidgetDescriptor = {
  id: 'events-list',
  title: 'CYC26 Events',
  uri: 'ui://events-list',
};

const WIDGETS: WidgetDescriptor[] = [
  SPEAKERS_LIST_WIDGET,
  SPEAKER_DETAIL_WIDGET,
  SCHEDULE_WIDGET,
  SESSION_DETAIL_WIDGET,
  EVENTS_LIST_WIDGET,
];

/** Inlined widget HTML cache — invalidated by the assets watcher on rebuilds */
const inlinedHtmlCache = new Map<string, string>();

function buildInlinedHtml(widgetId: string): string | null {
  const htmlPath = path.join(ASSETS_DIR, `${widgetId}.html`);
  if (!fs.existsSync(htmlPath)) {
    logger.warn({ htmlPath }, 'Cannot inline: HTML file not found');
    return null;
  }
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const inlined = inlineWidgetAssets(html, ASSETS_DIR, logger);
  logger.info(
    { widgetId, originalLength: html.length, inlinedLength: inlined.length },
    'Inlined widget HTML'
  );
  return inlined;
}

function getInlinedHtml(widgetId: string): string {
  const cached = inlinedHtmlCache.get(widgetId);
  if (cached) {
    return cached;
  }
  const html = buildInlinedHtml(widgetId);
  if (!html) {
    throw new Error(
      `No built assets for widget "${widgetId}" in ${ASSETS_DIR}. ` +
        'In dev, the watch build from "npm run dev" produces them a few seconds after startup; ' +
        'otherwise run "npm run build:widgets".'
    );
  }
  inlinedHtmlCache.set(widgetId, html);
  return html;
}

/**
 * Watch built assets so inlined HTML is refreshed whenever the widget watch
 * build (`vite build --watch`, part of `npm run dev`) emits new files. The
 * assets directory may not exist yet on first startup — retry until it does.
 */
function watchAssetsForInlining(widgetIds: string[]) {
  if (!fs.existsSync(ASSETS_DIR)) {
    setTimeout(() => watchAssetsForInlining(widgetIds), 2000).unref();
    return;
  }

  fs.watch(ASSETS_DIR, (eventType, filename) => {
    if (filename?.endsWith('.html')) {
      const widgetId = filename.replace('.html', '');
      if (widgetIds.includes(widgetId)) {
        logger.info({ widgetId, eventType }, 'Asset changed, re-inlining');
        const html = buildInlinedHtml(widgetId);
        if (html) {
          inlinedHtmlCache.set(widgetId, html);
        } else {
          inlinedHtmlCache.delete(widgetId);
        }
      }
    }
  });
  logger.info('Watching assets directory for rebuild changes');
}

/**
 * Read widget HTML - from Vite dev server in development, from assets in production
 */
async function readWidgetHtml(widgetId: string): Promise<string> {
  if (NODE_ENV === 'development' && !INLINE_DEV_MODE) {
    try {
      const url = new URL(`${widgetId}.html`, BASE_URL).href;
      logger.debug({ url }, 'Fetching widget HTML from Vite dev server');
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          {
            status: response.status,
            statusText: response.statusText,
            errorText,
            url,
          },
          'Vite dev server returned error'
        );
        throw new Error(`Failed to fetch widget HTML: ${response.statusText}`);
      }
      const html = await response.text();
      logger.debug(
        { url, htmlLength: html.length },
        'Successfully fetched widget HTML'
      );
      return html;
    } catch (err) {
      logger.warn(
        { err, widgetId, widgetPort: WIDGET_PORT },
        'Failed to fetch from Vite dev server, falling back to built assets'
      );
    }
  }

  if (BASE_URL) {
    const url = new URL(`${widgetId}.html`, BASE_URL).href;
    logger.debug({ url }, 'Fetching widget HTML from BASE_URL');
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch widget HTML from ${url}: ${response.statusText}`
      );
    }
    const html = await response.text();
    if (NODE_ENV === 'production') {
      const css = fs
        .readdirSync(ASSETS_DIR)
        .filter((file) => file.endsWith('.css'))
        .map((file) => fs.readFileSync(path.join(ASSETS_DIR, file), 'utf-8'))
        .join('\n');
      return buildProductionWidgetHtml(html, widgetId, BASE_URL, css);
    }
    return html;
  }

  if (!fs.existsSync(ASSETS_DIR)) {
    throw new Error(
      `Widget assets not found. Expected directory ${ASSETS_DIR}. Run "npm run build:widgets" before starting the server.`
    );
  }

  const htmlPath = path.join(ASSETS_DIR, `${widgetId}.html`);

  if (!fs.existsSync(htmlPath)) {
    throw new Error(`Widget HTML not found: ${htmlPath}`);
  }

  return fs.readFileSync(htmlPath, 'utf-8');
}

/**
 * Create an MCP server instance with CYC26 conference tools
 */
function createMcpServer(protocolEra: ProtocolEra): McpServer {
  const server = new McpServer({
    name: 'cyc2026',
    version: '1.0.0',
  });

  // ext-apps 1.x is typed against the v1 SDK; bridge the v2 McpServer once
  // here. Only registerTool/registerResource are called, and those are
  // call-compatible at runtime. Drop this when ext-apps targets the v2 SDK.
  const extAppsServer = server as unknown as Parameters<
    typeof registerAppTool
  >[0] &
    Parameters<typeof registerAppResource>[0];

  const serverLogger = logger.child({ protocolEra });

  for (const widget of WIDGETS) {
    const resourceUri = widget.uri;
    registerAppResource(
      extAppsServer,
      resourceUri,
      resourceUri,
      { mimeType: RESOURCE_MIME_TYPE },
      async (_uri, extra) => {
        serverLogger.debug({ resourceUri }, 'Resource callback called');
        const widgetId = widget.id;
        const serverContext = extra as unknown as ServerContext;
        const clientInfo = getClientIdentity(serverContext);
        try {
          const useBootstrap =
            IS_DEV &&
            !INLINE_DEV_MODE &&
            clientMatches(clientInfo, WIDGET_BOOTSTRAP_CLIENTS);
          const useInline =
            !useBootstrap &&
            (INLINE_DEV_MODE ||
              (IS_DEV &&
                shouldInlineWidgetHtml({
                  clientInfo,
                  inlineClients: WIDGET_INLINE_CLIENTS,
                })));

          const resourceDomains: string[] = [...CYC_PHOTO_DOMAINS];
          const connectDomains: string[] = [];
          let finalHtml: string;

          if (useBootstrap) {
            const widgetOrigin = resolveWidgetOrigin(BASE_URL, WIDGET_PORT);
            finalHtml = buildDevBootstrapHtml(widgetId, widgetOrigin.origin);
            resourceDomains.push(widgetOrigin.origin);
            connectDomains.push(widgetOrigin.origin, widgetOrigin.wsOrigin);
          } else if (useInline) {
            finalHtml = getInlinedHtml(widgetId);
            resourceDomains.push(...GOOGLE_FONTS_DOMAINS);
          } else {
            finalHtml = await readWidgetHtml(widgetId);
            const widgetOrigin = resolveWidgetOrigin(BASE_URL, WIDGET_PORT);
            resourceDomains.push(widgetOrigin.origin);
            if (IS_DEV) {
              connectDomains.push(widgetOrigin.origin, widgetOrigin.wsOrigin);
              if (widgetOrigin.isLocalhost) {
                const altOrigin = `http://127.0.0.1:${WIDGET_PORT}`;
                resourceDomains.push(altOrigin);
                connectDomains.push(
                  altOrigin,
                  altOrigin.replace('http://', 'ws://')
                );
              }
            }
          }

          const cspMeta = {
            ui: {
              csp: {
                resourceDomains: [...new Set(resourceDomains)],
                connectDomains: [...new Set(connectDomains)],
              },
            },
          };

          serverLogger.info(
            {
              resourceUri,
              widgetId,
              clientInfo,
              useInline,
              useBootstrap,
              cspMeta,
            },
            'Widget resource loaded'
          );

          return {
            contents: [
              {
                uri: resourceUri,
                mimeType: RESOURCE_MIME_TYPE,
                text: finalHtml,
                _meta: cspMeta,
              },
            ],
          };
        } catch (err) {
          serverLogger.error(
            { err, resourceUri, widgetId },
            'Failed to load widget'
          );
          throw err;
        }
      }
    );
  }

  registerConferenceTools(
    extAppsServer,
    {
      speakersList: SPEAKERS_LIST_WIDGET,
      speakerDetail: SPEAKER_DETAIL_WIDGET,
      schedule: SCHEDULE_WIDGET,
      sessionDetail: SESSION_DETAIL_WIDGET,
      eventsList: EVENTS_LIST_WIDGET,
    },
    serverLogger
  );

  return server;
}

/**
 * Main server setup
 */
async function main() {
  if (NODE_ENV === 'production' && !configuredBaseUrl) {
    logger.fatal('BASE_URL must be set in production');
    process.exit(1);
  }

  logger.info(
    {
      port: PORT,
      nodeEnv: NODE_ENV,
      logLevel: LOG_LEVEL,
      assetsDir: ASSETS_DIR,
      baseUrl: BASE_URL,
      inlineDevMode: INLINE_DEV_MODE,
    },
    'Starting CYC26 MCP app server'
  );

  const widgetIds = WIDGETS.map((widget) => widget.id);

  // Inlined HTML can be requested per-client in dev (and always when
  // INLINE_DEV_MODE forces it), so keep the inline cache fresh as the
  // widget watch build emits new assets.
  if (IS_DEV || INLINE_DEV_MODE) {
    watchAssetsForInlining(widgetIds);
  }

  const app = express();

  app.use(pinoHttp({ logger }));

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', CORS_ORIGIN);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, MCP-Protocol-Version, Mcp-Method, Mcp-Name'
    );

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    next();
  });

  app.use(express.json());

  app.use('/assets', express.static(ASSETS_DIR));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const handler = createMcpHandler(({ era }) => createMcpServer(era), {
    legacy: 'stateless',
    onerror: (err) => {
      logger.error({ err }, 'Error handling MCP request');
    },
  });
  const nodeHandler = toNodeHandler(handler, {
    onerror: (err) => {
      logger.error({ err }, 'Error adapting MCP request for Node');
    },
  });

  app.all('/mcp', (req, res) => {
    logger.info({ method: req.method, ip: req.ip }, 'MCP request');

    nodeHandler(req, res, req.body).catch((err: unknown) => {
      logger.error({ err }, 'Unhandled error serving MCP request');
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      } else {
        res.end();
      }
    });
  });

  const httpServer = createServer(app);

  const shutdown = async () => {
    logger.info('Shutting down server...');

    httpServer.close(() => {
      logger.info('HTTP server closed');
    });

    await handler.close();

    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  httpServer.listen(PORT, () => {
    logger.info(
      {
        port: PORT,
        mcpEndpoint: `http://localhost:${PORT}/mcp`,
        healthEndpoint: `http://localhost:${PORT}/health`,
      },
      'Server started successfully'
    );
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});

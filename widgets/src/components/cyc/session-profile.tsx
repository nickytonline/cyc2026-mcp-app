'use client';

import {
  createContext,
  use,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import type { SessionCard, ViewScheduleItemOutput } from 'mcp-app-server/types';
import { useCompactSurface } from '../../hooks/useCompactSurface';
import { formatClock, roomColor } from '../../utils/cyc';
import type { AppLike, HostContext } from '../../types/mcp-app';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '../ui/drawer';
import { SessionSpeakerByline } from './SpeakerPhoto';
import { TrackChip } from './TrackChip';

type SessionAskTarget = Pick<SessionCard, 'id' | 'title' | 'track' | 'room'>;

type SessionApp = Pick<
  AppLike<unknown>,
  'callServerTool' | 'sendMessage' | 'updateModelContext'
>;

interface SessionProfileState {
  preview: SessionCard | null;
  detail: ViewScheduleItemOutput | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
}

interface SessionProfileActions {
  open: (preview: SessionCard) => void;
  close: () => void;
  ask: (question: string) => Promise<void>;
}

interface SessionProfileContextValue {
  state: SessionProfileState;
  actions: SessionProfileActions;
  meta: {
    app: SessionApp;
    hostContext?: HostContext | null;
  };
}

const SessionProfileContext = createContext<SessionProfileContextValue | null>(
  null
);

export function useSessionProfile() {
  const value = use(SessionProfileContext);
  if (!value) {
    throw new Error('SessionProfile.Provider is required');
  }
  return value;
}

export function sessionQuestion(preview: SessionAskTarget, question: string) {
  return `${question.trim()}\n\nContext: the CYC26 session "${preview.title}" (${preview.track}, ${preview.room}).`;
}

export function SessionProfileProvider({
  app,
  hostContext,
  children,
}: {
  app: SessionApp;
  hostContext?: HostContext | null;
  children: ReactNode;
}) {
  const [state, setState] = useState<SessionProfileState>({
    preview: null,
    detail: null,
    status: 'idle',
  });
  const requestIdRef = useRef(0);

  const actions: SessionProfileActions = {
    open: (preview) => {
      const id = ++requestIdRef.current;
      setState({ preview, detail: null, status: 'loading' });
      void app
        .updateModelContext({
          content: [
            {
              type: 'text',
              text: `The attendee opened the CYC26 session "${preview.title}".`,
            },
          ],
          structuredContent: {
            sessionId: preview.id,
            title: preview.title,
            track: preview.track,
            room: preview.room,
          },
        })
        .catch(() => undefined);
      void app
        .callServerTool<ViewScheduleItemOutput>({
          name: 'view_schedule_item',
          arguments: { id: preview.id },
        })
        .then((result) => {
          if (id !== requestIdRef.current) return;
          const detail = result.structuredContent;
          if (!detail?.session) {
            setState({ preview, detail: null, status: 'error' });
            return;
          }
          setState({ preview, detail, status: 'ready' });
        })
        .catch(() => {
          if (id !== requestIdRef.current) return;
          setState({ preview, detail: null, status: 'error' });
        });
    },
    close: () => {
      requestIdRef.current += 1;
      setState({ preview: null, detail: null, status: 'idle' });
    },
    ask: async (question) => {
      const preview = state.preview;
      if (!preview) return;
      await app.sendMessage({
        role: 'user',
        content: [{ type: 'text', text: sessionQuestion(preview, question) }],
      });
      requestIdRef.current += 1;
      setState({ preview: null, detail: null, status: 'idle' });
    },
  };

  return (
    <SessionProfileContext
      value={{ state, actions, meta: { app, hostContext } }}
    >
      {children}
    </SessionProfileContext>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SessionProfileBody({
  preview,
  detail,
  status,
  onAsk,
}: {
  preview: SessionCard;
  detail: ViewScheduleItemOutput | null;
  status: SessionProfileState['status'];
  onAsk: (question: string) => Promise<void>;
}) {
  const askId = useId();
  const session = detail?.session;
  const room = session?.room ?? preview.room;
  const start = session?.start ?? preview.start;
  const end = session?.end ?? preview.end;
  const speakers =
    detail?.speakers?.length ? detail.speakers : preview.speakers;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--cyc-cloud)] text-[var(--cyc-ink)] dark:bg-[var(--cyc-navy-soft)] dark:text-white">
      <div className="shrink-0 border-b border-[var(--cyc-line)] px-4 py-4 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          <TrackChip track={session?.track ?? preview.track} />
          <span
            className="font-mono text-[0.6875rem] font-bold uppercase"
            style={{ color: roomColor(room) }}
          >
            {room}
          </span>
        </div>
        <p className="mt-2 font-mono text-[0.75rem] text-[var(--cyc-muted)]">
          {preview.day != null ? `Day ${preview.day} · ` : ''}
          {formatClock(start)}
          {end ? ` – ${formatClock(end)}` : ''}
        </p>
        <SessionSpeakerByline speakers={speakers} className="mt-2" />
      </div>
      <div
        className="cyc-scroll min-h-0 flex-1 px-4 py-4"
        tabIndex={0}
        role="region"
        aria-label="Session details"
      >
        {status === 'loading' ? (
          <div className="grid gap-2" aria-hidden="true">
            <div className="h-3 animate-pulse rounded bg-[var(--cyc-line)] dark:bg-white/10" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-[var(--cyc-line)] dark:bg-white/10" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--cyc-line)] dark:bg-white/10" />
          </div>
        ) : null}
        {status === 'error' ? (
          <p className="text-sm text-[var(--cyc-muted)]" role="alert">
            Couldn’t load this session. Close and try again.
          </p>
        ) : null}
        {session?.abstract ? (
          <p className="text-[0.9375rem] leading-7">{session.abstract}</p>
        ) : null}
        <div className={session?.abstract ? 'mt-4' : undefined}>
          <SessionAskForm
            id={askId}
            session={preview}
            onAsk={onAsk}
            disabled={status === 'loading'}
          />
        </div>
      </div>
    </div>
  );
}

export function SessionAskForm({
  id,
  session,
  onAsk,
  disabled,
}: {
  id?: string;
  session: SessionAskTarget;
  onAsk: (question: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = question.trim();
    if (!next || sending) return;
    setSending(true);
    setFailed(false);
    try {
      await onAsk(next);
    } catch {
      setFailed(true);
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="border-t border-[var(--cyc-line)] pt-4 dark:border-white/10"
    >
      <label
        htmlFor={id ?? `ask-session-${session.id}`}
        className="block font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--cyc-blue)]"
      >
        Ask about this session
      </label>
      <p className="mt-1 text-[0.75rem] text-[var(--cyc-muted)]">
        The answer comes back in chat — not a reprint of the website.
      </p>
      <div className="mt-2 flex gap-2">
        <input
          id={id ?? `ask-session-${session.id}`}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={disabled || sending}
          placeholder="Should I see this talk?"
          className="min-w-0 flex-1 rounded-[8px] border border-[var(--cyc-line)] bg-white px-3 py-2 text-sm text-[var(--cyc-ink)] outline-none placeholder:text-[var(--cyc-muted)] focus-visible:border-[var(--cyc-blue)] focus-visible:ring-2 focus-visible:ring-[var(--cyc-blue)]/30 disabled:opacity-60 dark:border-white/10 dark:bg-[var(--cyc-navy)] dark:text-white"
        />
        <button
          type="submit"
          disabled={disabled || sending || question.trim().length === 0}
          className="rounded-[8px] bg-[var(--cyc-blue)] px-3 py-2 text-sm font-bold text-white hover:bg-[var(--cyc-blue-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyc-blue)] disabled:opacity-50"
        >
          {sending ? 'Sending' : 'Ask'}
        </button>
      </div>
      {failed ? (
        <p className="mt-2 text-[0.75rem] text-[var(--cyc-muted)]" role="alert">
          Couldn’t send that question. Try again.
        </p>
      ) : null}
    </form>
  );
}

function SessionProfileHeader({
  title,
  onClose,
  showClose,
}: {
  title: string;
  onClose: () => void;
  showClose: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 bg-[var(--cyc-navy)] px-5 py-4 text-white">
      <div className="min-w-0">
        <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7db3ff]">
          CYC26 / Session
        </p>
        <p className="mt-1 text-[1.25rem] font-bold leading-tight tracking-tight">
          {title}
        </p>
      </div>
      {showClose ? (
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-[8px] text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="Close session"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  );
}

export function SessionProfileDialog() {
  const {
    state: { preview, detail, status },
    actions,
    meta: { hostContext },
  } = useSessionProfile();
  const compact = useCompactSurface(hostContext);
  const open = preview !== null;
  const theme = hostContext?.theme ?? 'light';
  const title = preview?.title ?? 'Session';
  const role = preview
    ? `${preview.track} / ${preview.room}`
    : 'Commit Your Code 2026 session';

  const body = preview ? (
    <SessionProfileBody
      preview={preview}
      detail={detail}
      status={status}
      onAsk={actions.ask}
    />
  ) : null;

  if (compact) {
    return (
      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (!next) actions.close();
        }}
      >
        <DrawerContent className={theme === 'dark' ? 'dark' : undefined}>
          <DrawerHeader className="p-0">
            <SessionProfileHeader
              title={title}
              onClose={actions.close}
              showClose={false}
            />
            <DrawerTitle className="sr-only">{title}</DrawerTitle>
            <DrawerDescription className="sr-only">{role}</DrawerDescription>
          </DrawerHeader>
          {body}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) actions.close();
      }}
    >
      <DialogContent
        showClose={false}
        className={theme === 'dark' ? 'dark flex flex-col p-0' : 'flex flex-col p-0'}
        aria-describedby={undefined}
      >
        <DialogHeader className="p-0">
          <SessionProfileHeader
            title={title}
            onClose={actions.close}
            showClose
          />
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">{role}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}

function SessionOpen({
  session,
  className,
  children,
}: {
  session: SessionCard;
  className?: string;
  children?: ReactNode;
}) {
  const { actions, state } = useSessionProfile();
  const open = state.preview?.id === session.id;

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      className={className}
      onClick={() => actions.open(session)}
    >
      {children}
    </button>
  );
}

export const SessionProfile = {
  Provider: SessionProfileProvider,
  Dialog: SessionProfileDialog,
  Open: SessionOpen,
};

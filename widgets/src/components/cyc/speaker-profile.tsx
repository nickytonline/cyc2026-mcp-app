'use client';

import {
  createContext,
  use,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import type {
  GetSpeakerOutput,
  SessionCard,
  ViewScheduleItemOutput,
} from 'mcp-app-server/types';
import { useCompactSurface } from '../../hooks/useCompactSurface';
import { formatClock } from '../../utils/cyc';
import type { AppLike, HostContext } from '../../types/mcp-app';
import { SessionAskForm, sessionQuestion } from './session-profile';

type SpeakerApp = Pick<
  AppLike<unknown>,
  'callServerTool' | 'sendMessage' | 'updateModelContext'
>;
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
import { SpeakerPhoto } from './SpeakerPhoto';
import { TrackChip } from './TrackChip';

export interface SpeakerPreview {
  id: string;
  name: string;
  title?: string;
  company?: string;
  photoUrl?: string | null;
  track?: string;
  talkTitle?: string;
}

interface SpeakerProfileState {
  preview: SpeakerPreview | null;
  detail: GetSpeakerOutput | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
}

interface SpeakerProfileActions {
  open: (preview: SpeakerPreview) => void;
  close: () => void;
  ask: (question: string) => Promise<void>;
  viewSession: (session: SessionCard) => void;
}

interface SpeakerProfileContextValue {
  state: SpeakerProfileState;
  actions: SpeakerProfileActions;
  meta: {
    app: SpeakerApp;
    hostContext?: HostContext | null;
  };
}

const SpeakerProfileContext = createContext<SpeakerProfileContextValue | null>(
  null
);

function useSpeakerProfile() {
  const value = use(SpeakerProfileContext);
  if (!value) {
    throw new Error('SpeakerProfile.Provider is required');
  }
  return value;
}

function speakerQuestion(preview: SpeakerPreview, question: string) {
  const talk = preview.talkTitle ? ` (${preview.talkTitle})` : '';
  const track = preview.track ? ` on the ${preview.track} track` : '';
  return `${question.trim()}\n\nContext: ${preview.name}${track} at Commit Your Code 2026${talk}.`;
}

function SpeakerProfileProvider({
  app,
  hostContext,
  onViewSession,
  children,
}: {
  app: SpeakerApp;
  hostContext?: HostContext | null;
  onViewSession?: (session: SessionCard) => void;
  children: ReactNode;
}) {
  const [state, setState] = useState<SpeakerProfileState>({
    preview: null,
    detail: null,
    status: 'idle',
  });
  const requestIdRef = useRef(0);

  const actions: SpeakerProfileActions = {
    open: (preview) => {
      const id = ++requestIdRef.current;
      setState({ preview, detail: null, status: 'loading' });
      void app
        .updateModelContext({
          content: [
            {
              type: 'text',
              text: `The attendee opened ${preview.name}'s CYC26 speaker card${preview.talkTitle ? `: ${preview.talkTitle}` : ''}.`,
            },
          ],
          structuredContent: {
            speakerId: preview.id,
            name: preview.name,
            talkTitle: preview.talkTitle,
            track: preview.track,
          },
        })
        .catch(() => undefined);
      void app
        .callServerTool<GetSpeakerOutput>({
          name: 'get_speaker',
          arguments: { id: preview.id },
        })
        .then((result) => {
          if (id !== requestIdRef.current) return;
          const detail = result.structuredContent;
          if (!detail?.speaker) {
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
      const preview = state.preview ?? state.detail?.speaker;
      if (!preview) return;
      await app.sendMessage({
        role: 'user',
        content: [{ type: 'text', text: speakerQuestion(preview, question) }],
      });
      requestIdRef.current += 1;
      setState({ preview: null, detail: null, status: 'idle' });
    },
    viewSession: (session) => {
      requestIdRef.current += 1;
      setState({ preview: null, detail: null, status: 'idle' });
      if (onViewSession) {
        onViewSession(session);
        return;
      }
      void app.callServerTool({
        name: 'view_schedule_item',
        arguments: { id: session.id },
      });
    },
  };

  return (
    <SpeakerProfileContext
      value={{ state, actions, meta: { app, hostContext } }}
    >
      {children}
    </SpeakerProfileContext>
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

function SpeakerProfileIdentity({
  preview,
  speaker,
}: {
  preview: SpeakerPreview;
  speaker?: GetSpeakerOutput['speaker'];
}) {
  return (
    <div className="flex gap-3">
      <SpeakerPhoto
        name={preview.name}
        photoUrl={speaker?.photoUrl ?? preview.photoUrl ?? null}
        className="size-16 shrink-0 rounded-[6px] object-cover sm:size-20"
      />
      <div className="min-w-0 flex-1">
        <TrackChip track={speaker?.track ?? preview.track ?? 'CYC26'} />
        <p className="mt-1 text-sm text-[var(--cyc-muted)]">
          {speaker?.title ?? preview.title}
          {(speaker?.company ?? preview.company)
            ? ` / ${speaker?.company ?? preview.company}`
            : ''}
        </p>
      </div>
    </div>
  );
}

function SpeakerProfileBody({
  preview,
  speaker,
  sessions,
  status,
  onAsk,
}: {
  preview: SpeakerPreview;
  speaker?: GetSpeakerOutput['speaker'];
  sessions: SessionCard[];
  status: SpeakerProfileState['status'];
  onAsk: (question: string) => Promise<void>;
}) {
  const askId = useId();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--cyc-cloud)] text-[var(--cyc-ink)] dark:bg-[var(--cyc-navy-soft)] dark:text-white">
      <div className="shrink-0 border-b border-[var(--cyc-line)] px-4 py-4 dark:border-white/10">
        <SpeakerProfileIdentity preview={preview} speaker={speaker} />
      </div>
      <div
        className="cyc-scroll min-h-0 flex-1 px-4 py-4"
        tabIndex={0}
        role="region"
        aria-label="Speaker details"
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
            Couldn’t load this speaker. Close and try again.
          </p>
        ) : null}
        {speaker?.bio ? (
          <p className="text-[0.9375rem] leading-7">{speaker.bio}</p>
        ) : null}
        {status === 'ready' ? (
          <div
            className={
              speaker?.bio
                ? 'mt-4 border-t border-[var(--cyc-line)] pt-4 dark:border-white/10'
                : undefined
            }
          >
            <p className="mb-2 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--cyc-blue)]">
              On the program
            </p>
            <SessionList sessions={sessions} />
          </div>
        ) : null}
        <div className={speaker?.bio || status === 'ready' ? 'mt-4' : undefined}>
          <SpeakerAskForm
            id={askId}
            speaker={preview}
            onAsk={onAsk}
            disabled={status === 'loading'}
          />
        </div>
      </div>
    </div>
  );
}

function SpeakerProfileHeader({
  name,
  onClose,
  showClose,
}: {
  name: string;
  onClose: () => void;
  showClose: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 bg-[var(--cyc-navy)] px-5 py-4 text-white">
      <div className="min-w-0">
        <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7db3ff]">
          CYC26 / Speaker
        </p>
        <p className="mt-1 text-[1.25rem] font-bold leading-tight tracking-tight">
          {name}
        </p>
      </div>
      {showClose ? (
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-[8px] text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="Close speaker"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  );
}

function SpeakerProfileDialog() {
  const {
    state: { preview, detail, status },
    actions,
    meta: { hostContext },
  } = useSpeakerProfile();
  const compact = useCompactSurface(hostContext);
  const speaker = detail?.speaker;
  const sessions = detail?.sessions ?? [];
  const open = preview !== null;
  const theme = hostContext?.theme ?? 'light';
  const title = preview?.name ?? 'Speaker';
  const role = preview?.title
    ? `${preview.title}${preview.company ? ` / ${preview.company}` : ''}`
    : 'Commit Your Code 2026 speaker';

  const body = preview ? (
    <SpeakerProfileBody
      preview={preview}
      speaker={speaker}
      sessions={sessions}
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
            <SpeakerProfileHeader
              name={title}
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
          <SpeakerProfileHeader
            name={title}
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

function SpeakerAskForm({
  id,
  speaker,
  onAsk,
  disabled,
}: {
  id?: string;
  speaker: SpeakerPreview;
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
        htmlFor={id ?? `ask-${speaker.id}`}
        className="block font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--cyc-blue)]"
      >
        Ask about this speaker
      </label>
      <p className="mt-1 text-[0.75rem] text-[var(--cyc-muted)]">
        The answer comes back in chat — not a reprint of the website.
      </p>
      <div className="mt-2 flex gap-2">
        <input
          id={id ?? `ask-${speaker.id}`}
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

function SessionTalkDetails({ session }: { session: SessionCard }) {
  const { actions, meta } = useSpeakerProfile();
  const [abstract, setAbstract] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle'
  );

  async function handleToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    if (!event.currentTarget.open) return;
    if (status === 'loading' || status === 'ready') return;
    setStatus('loading');
    try {
      const result = await meta.app.callServerTool<ViewScheduleItemOutput>({
        name: 'view_schedule_item',
        arguments: { id: session.id },
      });
      const next = result.structuredContent?.session?.abstract ?? null;
      if (!result.structuredContent?.session) {
        setStatus('error');
        return;
      }
      setAbstract(next);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  return (
    <details
      className="group overflow-hidden rounded-[8px] border border-[var(--cyc-line)] bg-white open:border-[var(--cyc-blue)] dark:border-white/10 dark:bg-[var(--cyc-navy)]"
      onToggle={(event) => void handleToggle(event)}
    >
      <summary className="flex cursor-pointer list-none items-start gap-2 p-3 text-left marker:content-none hover:bg-[var(--cyc-cloud)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyc-blue)] dark:hover:bg-white/5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <strong className="block text-[var(--cyc-ink)] dark:text-white">
            {session.title}
          </strong>
          <span className="mt-1 block font-mono text-[0.75rem] text-[var(--cyc-muted)]">
            {session.day != null ? `Day ${session.day} · ` : ''}
            {formatClock(session.start)} / {session.room}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className="mt-1 size-4 shrink-0 text-[var(--cyc-muted)] transition-transform group-open:rotate-180"
          aria-hidden="true"
        >
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="border-t border-[var(--cyc-line)] px-3 py-3 dark:border-white/10">
        {status === 'loading' ? (
          <div className="grid gap-2" aria-hidden="true">
            <div className="h-3 animate-pulse rounded bg-[var(--cyc-line)] dark:bg-white/10" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-[var(--cyc-line)] dark:bg-white/10" />
          </div>
        ) : null}
        {status === 'error' ? (
          <p className="text-sm text-[var(--cyc-muted)]" role="alert">
            Couldn’t load this session. Close and try again.
          </p>
        ) : null}
        {abstract ? (
          <p className="text-[0.9375rem] leading-7">{abstract}</p>
        ) : null}
        {status === 'ready' ? (
          <SessionAskForm
            session={session}
            onAsk={async (question) => {
              await meta.app.sendMessage({
                role: 'user',
                content: [
                  { type: 'text', text: sessionQuestion(session, question) },
                ],
              });
              actions.close();
            }}
          />
        ) : null}
      </div>
    </details>
  );
}

function SessionList({ sessions }: { sessions: SessionCard[] }) {
  if (sessions.length === 0) {
    return (
      <p className="text-[0.8125rem] text-[var(--cyc-muted)]">
        No sessions are on the program yet.
      </p>
    );
  }

  return (
    <ul className="grid gap-2">
      {sessions.map((session) => (
        <li key={session.id}>
          <SessionTalkDetails session={session} />
        </li>
      ))}
    </ul>
  );
}

function SpeakerOpen({
  speaker,
  className,
  children,
}: {
  speaker: SpeakerPreview;
  className?: string;
  children?: ReactNode;
}) {
  const { actions, state } = useSpeakerProfile();
  const open = state.preview?.id === speaker.id;

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      className={className}
      onClick={() => actions.open(speaker)}
    >
      {children}
    </button>
  );
}

export function SpeakerProfileHost({
  app,
  hostContext,
  onViewSession,
  children,
}: {
  app: SpeakerApp;
  hostContext?: HostContext | null;
  onViewSession?: (session: SessionCard) => void;
  children: ReactNode;
}) {
  return (
    <SpeakerProfileProvider
      app={app}
      hostContext={hostContext}
      onViewSession={onViewSession}
    >
      {children}
      <SpeakerProfileDialog />
    </SpeakerProfileProvider>
  );
}

export function SpeakerAskPanel({
  speaker,
  app,
}: {
  speaker: SpeakerPreview;
  app: SpeakerApp;
}) {
  return (
    <SpeakerAskForm
      speaker={speaker}
      onAsk={async (question) => {
        await app.sendMessage({
          role: 'user',
          content: [{ type: 'text', text: speakerQuestion(speaker, question) }],
        });
      }}
    />
  );
}

export const SpeakerProfile = {
  Provider: SpeakerProfileProvider,
  Dialog: SpeakerProfileDialog,
  Open: SpeakerOpen,
  Host: SpeakerProfileHost,
  Ask: SpeakerAskPanel,
};

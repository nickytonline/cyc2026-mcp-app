'use client';

import type { ReactNode } from 'react';
import type { AppLike, HostContext } from '../../types/mcp-app';
import { CycThemeProvider } from './cyc-theme';
import {
  SessionProfile,
  SessionProfileProvider,
  useSessionProfile,
} from './session-profile';
import { SpeakerProfile } from './speaker-profile';
import { WidgetChromeProvider, type WidgetChromeValue } from './widget-chrome';

type ProfileApp = Pick<
  AppLike<unknown>,
  'callServerTool' | 'sendMessage' | 'updateModelContext'
>;

function ProfileBridge({
  app,
  hostContext,
  children,
}: {
  app: ProfileApp;
  hostContext?: HostContext | null;
  children: ReactNode;
}) {
  const { actions } = useSessionProfile();
  return (
    <SpeakerProfile.Host
      app={app}
      hostContext={hostContext}
      onViewSession={(session) => actions.open(session)}
    >
      {children}
      <SessionProfile.Dialog />
    </SpeakerProfile.Host>
  );
}

export function CycHost({
  app,
  hostContext,
  chrome,
  children,
}: {
  app: ProfileApp;
  hostContext?: HostContext | null;
  chrome?: WidgetChromeValue;
  children: ReactNode;
}) {
  const tree = (
    <CycThemeProvider hostTheme={hostContext?.theme}>
      <SessionProfileProvider app={app} hostContext={hostContext}>
        <ProfileBridge app={app} hostContext={hostContext}>
          {children}
        </ProfileBridge>
      </SessionProfileProvider>
    </CycThemeProvider>
  );

  if (!chrome) return tree;

  return <WidgetChromeProvider value={chrome}>{tree}</WidgetChromeProvider>;
}

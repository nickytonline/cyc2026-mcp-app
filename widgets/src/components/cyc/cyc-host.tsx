'use client';

import type { ReactNode } from 'react';
import type { AppLike, HostContext } from '../../types/mcp-app';
import {
  SessionProfile,
  SessionProfileProvider,
  useSessionProfile,
} from './session-profile';
import { SpeakerProfile } from './speaker-profile';

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
  children,
}: {
  app: ProfileApp;
  hostContext?: HostContext | null;
  children: ReactNode;
}) {
  return (
    <SessionProfileProvider app={app} hostContext={hostContext}>
      <ProfileBridge app={app} hostContext={hostContext}>
        {children}
      </ProfileBridge>
    </SessionProfileProvider>
  );
}

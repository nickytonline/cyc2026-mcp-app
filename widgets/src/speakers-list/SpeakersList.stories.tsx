import type { Meta, StoryObj } from '@storybook/react';
import { createMockApp } from '../mocks/mock-app';
import { mockConferenceTools, nickSpeakersList } from '../mocks/sample-speaker';
import SpeakersList from './SpeakersList';

const meta = {
  title: 'Widgets/SpeakersList',
  component: SpeakersList,
} satisfies Meta<typeof SpeakersList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SpeakersList
      app={createMockApp({
        toolOutput: nickSpeakersList,
        callServerTool: mockConferenceTools,
      })}
    />
  ),
};

export const CompactDrawer: Story = {
  render: () => (
    <div className="mx-auto max-w-[390px]">
      <SpeakersList
        app={createMockApp({
          toolOutput: nickSpeakersList,
          callServerTool: mockConferenceTools,
          hostContext: {
            theme: 'light',
            displayMode: 'inline',
            containerDimensions: { width: 390, maxWidth: 390, maxHeight: 720 },
          },
        })}
      />
    </div>
  ),
};

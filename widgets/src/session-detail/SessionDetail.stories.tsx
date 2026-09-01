import type { Meta, StoryObj } from '@storybook/react';
import { createMockApp } from '../mocks/mock-app';
import {
  mockConferenceTools,
  nickSessionDetail,
} from '../mocks/sample-speaker';
import SessionDetail from './SessionDetail';
import type { ViewScheduleItemOutput } from 'mcp-app-server/types';

const meta = {
  title: 'Widgets/SessionDetail',
  component: SessionDetail,
} satisfies Meta<typeof SessionDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SessionDetail
      app={createMockApp<ViewScheduleItemOutput>({
        toolOutput: nickSessionDetail,
        callServerTool: mockConferenceTools,
      })}
    />
  ),
};

export const Compact: Story = {
  render: () => (
    <div className="mx-auto max-w-[390px]">
      <SessionDetail
        app={createMockApp<ViewScheduleItemOutput>({
          toolOutput: nickSessionDetail,
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

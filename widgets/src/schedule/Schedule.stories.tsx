import type { Meta, StoryObj } from '@storybook/react';
import { createMockApp } from '../mocks/mock-app';
import { mockConferenceTools, nickSchedule } from '../mocks/sample-speaker';
import Schedule from './Schedule';
import type { GetScheduleOutput } from 'mcp-app-server/types';

const meta = {
  title: 'Widgets/Schedule',
  component: Schedule,
} satisfies Meta<typeof Schedule>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Schedule
      app={createMockApp<GetScheduleOutput>({
        toolOutput: nickSchedule,
        callServerTool: mockConferenceTools,
      })}
    />
  ),
};

export const CompactDrawer: Story = {
  render: () => (
    <div className="mx-auto max-w-[390px]">
      <Schedule
        app={createMockApp<GetScheduleOutput>({
          toolOutput: nickSchedule,
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

export const Crowded: Story = {
  render: () => {
    const slots = Array.from({ length: 12 }, (_, index) => {
      const hour = 9 + index;
      const start = `2026-09-03T${String(hour).padStart(2, '0')}:00:00-05:00`;
      const end = `2026-09-03T${String(hour).padStart(2, '0')}:25:00-05:00`;
      return {
        start,
        end,
        sessions: nickSchedule.slots[0].sessions.map((session) => ({
          ...session,
          id: `${session.id}-${index}`,
          title: `${session.title} ${index + 1}`,
          start,
          end,
        })),
      };
    });
    return (
      <Schedule
        app={createMockApp<GetScheduleOutput>({
          toolOutput: { ...nickSchedule, slots },
          callServerTool: mockConferenceTools,
        })}
      />
    );
  },
};

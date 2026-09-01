import type { Preview } from '@storybook/react';
import '@fontsource/geist-sans';
import '@fontsource/geist-mono';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme;

      return (
        <div
          className={
            theme === 'dark'
              ? 'min-h-screen bg-[var(--cyc-navy)] p-8'
              : 'min-h-screen bg-[var(--cyc-cloud)] p-8'
          }
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;

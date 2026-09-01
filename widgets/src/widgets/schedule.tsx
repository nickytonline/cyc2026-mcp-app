import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Schedule from '../schedule/Schedule';
import '../index.css';

const rootElement = document.getElementById('schedule-root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <Schedule />
    </StrictMode>
  );
}

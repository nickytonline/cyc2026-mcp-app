import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import EventsList from '../events-list/EventsList';
import '../index.css';

const rootElement = document.getElementById('events-list-root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <EventsList />
    </StrictMode>
  );
}

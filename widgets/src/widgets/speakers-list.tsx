import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SpeakersList from '../speakers-list/SpeakersList';
import '../index.css';

const rootElement = document.getElementById('speakers-list-root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <SpeakersList />
    </StrictMode>
  );
}

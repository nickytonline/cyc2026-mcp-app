import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SpeakerDetail from '../speaker-detail/SpeakerDetail';
import '../index.css';

const rootElement = document.getElementById('speaker-detail-root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <SpeakerDetail />
    </StrictMode>
  );
}

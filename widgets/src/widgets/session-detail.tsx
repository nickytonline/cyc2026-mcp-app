import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SessionDetail from '../session-detail/SessionDetail';
import '../index.css';

const rootElement = document.getElementById('session-detail-root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <SessionDetail />
    </StrictMode>
  );
}

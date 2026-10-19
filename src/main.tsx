import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/atmosphere.css';
import './styles/global.css';
import App from './App';
import { initSound } from './audio/sound.js';
import { initSoundHooks, initSections } from './audio/hooks.js';
import { refreshSections } from './lib/sections.js';
import { migrateOldSoundStorage } from './utils/audio';

const container = document.getElementById('root')!;

if (container.hasChildNodes()) {
  hydrateRoot(
    container,
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

if (typeof window !== 'undefined') {
  migrateOldSoundStorage();
  initSound();
  initSoundHooks();
  initSections();
  refreshSections();
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}


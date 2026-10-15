import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { TrainingProvider } from './store/TrainingProvider.tsx';
import './styles/tokens.css';
import './styles/type.css';
import './styles/base.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TrainingProvider>
      <App />
    </TrainingProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  });
}

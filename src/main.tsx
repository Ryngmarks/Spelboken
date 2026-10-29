import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// Throwaway movement prototype (WO-05): ?proto=a|b mounts it instead of the app.
const proto = new URLSearchParams(location.search).get('proto');
if (proto === 'a' || proto === 'b') {
  void import('./prototype/Prototype').then(({ Prototype }) =>
    createRoot(document.getElementById('root')!).render(<Prototype variant={proto} />),
  );
} else createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

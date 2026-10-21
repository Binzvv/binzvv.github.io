import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter-tight/wght.css';
import '@fontsource-variable/archivo/wdth.css';
import './styles/base.css';
import App from './App.jsx';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

// Line-splitting needs final font metrics, so wait (briefly) for both
// families before the first render.
const fonts = [
  '600 1em "Inter Tight Variable"',
  '800 1em "Archivo Variable"',
  '400 1em "Archivo Variable"',
].map((f) => document.fonts.load(f));
const timeout = new Promise((r) => setTimeout(r, 1500));

Promise.race([Promise.all(fonts), timeout]).finally(() => {
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});

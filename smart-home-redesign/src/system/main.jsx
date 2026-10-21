import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter-tight/wght.css';
import '../styles/base.css';
import '../directions/apple/apple.css';
import './styleguide.css';
import StyleGuide from './StyleGuide.jsx';

document.fonts
  .load('600 1em "Inter Tight Variable"')
  .catch(() => {})
  .finally(() => {
    createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <StyleGuide />
      </React.StrictMode>,
    );
  });

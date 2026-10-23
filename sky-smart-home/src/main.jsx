import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Sky Text is proprietary, so the files aren't bundled: drop the licensed
// woff2 files into public/fonts. Declared here so the paths follow the base
// URL; a missing file fails silently and the font stack falls through.
const SKY_FACES = [
  ['Sky Text Web', 'SkyText-Regular', 400],
  ['Sky Text Web', 'SkyText-Medium', 500],
  ['Sky Text Headline Web', 'SkyTextHeadline-Medium', 500],
];
const fontStyle = document.createElement('style');
fontStyle.textContent = SKY_FACES.map(
  ([family, file, weight]) =>
    `@font-face{font-family:'${family}';src:url('${import.meta.env.BASE_URL}fonts/${file}.woff2') format('woff2');font-weight:${weight};font-display:swap}`,
).join('');
document.head.appendChild(fontStyle);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

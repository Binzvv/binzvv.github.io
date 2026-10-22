import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '@fontsource-variable/inter/opsz.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/chrome.css';
import './styles/scenes.css';
import { App } from './App';

gsap.registerPlugin(ScrollTrigger);
gsap.config({ force3D: true });
ScrollTrigger.config({ ignoreMobileResize: true });

createRoot(document.getElementById('root')!).render(<App />);

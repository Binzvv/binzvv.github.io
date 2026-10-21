import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';
import { EASE } from '../directions/apple/tokens.js';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase, useGSAP);

// Shared curves. "cine" is a long, soft deceleration for the cinematic
// direction; "spring" overshoots slightly for the playful one.
CustomEase.create('cine', EASE.cine);
CustomEase.create('cineInOut', EASE.cineInOut);
CustomEase.create('ui', EASE.ui);

ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger, SplitText, useGSAP };

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase, useGSAP);

// Shared curves. "cine" is a long, soft deceleration for the cinematic
// direction; "spring" overshoots slightly for the playful one.
CustomEase.create('cine', 'M0,0 C0.16,1 0.3,1 1,1');
CustomEase.create('cineInOut', 'M0,0 C0.65,0 0.35,1 1,1');

ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger, SplitText, useGSAP };

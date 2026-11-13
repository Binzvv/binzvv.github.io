import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Shared easing vocabulary — tweak here to change the feel site-wide.
gsap.defaults({ ease: 'expo.out', duration: 1.2 })
export const EASE = {
  out: 'expo.out',
  inOut: 'expo.inOut',
  soft: 'power3.out',
  spring: 'elastic.out(1, 0.45)',
}

export const MQ = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
  fine: '(hover: hover) and (pointer: fine)',
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia(MQ.reduced).matches

export const hasFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia(MQ.fine).matches

export { gsap, ScrollTrigger, useGSAP }

import { prefersReducedMotion } from './motion'

export function scrollToHash(e, href) {
  if (!href?.startsWith('#')) return
  e?.preventDefault()
  const target = href === '#top' ? document.body : document.querySelector(href)
  if (!target) return
  const behavior = prefersReducedMotion() ? 'auto' : 'smooth'
  if (href === '#top') window.scrollTo({ top: 0, behavior })
  else target.scrollIntoView({ behavior, block: 'start' })
}

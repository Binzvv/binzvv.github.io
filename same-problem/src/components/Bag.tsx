interface Props { color: string; label: string; branded: boolean; className?: string }

/** Flat coffee-bag illustration. Generic grey when unbranded, art-directed when branded. */
export function Bag({ color, label, branded, className = '' }: Props) {
  if (!branded) {
    return (
      <svg viewBox="0 0 120 150" className={className} aria-hidden="true">
        <path d="M22 26 L98 26 L104 140 L16 140 Z" fill="#cbd2db" />
        <rect x="22" y="14" width="76" height="14" fill="#aab3bf" />
        <rect x="34" y="62" width="52" height="40" fill="#fff" />
        <text x="60" y="80" textAnchor="middle" fontFamily="Arial" fontSize="8" fontWeight="700" fill="#374151">NORTHFIELD</text>
        <text x="60" y="92" textAnchor="middle" fontFamily="Arial" fontSize="6" fill="#6b7280">{label}</text>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 120 150" className={className} aria-hidden="true">
      <path d="M24 24 L96 24 L102 142 L18 142 Z" fill={color} />
      <path d="M24 24 L96 24 L96 32 L24 32 Z" fill="rgba(0,0,0,.18)" />
      <rect x="30" y="56" width="60" height="64" fill="#F3EBDD" />
      <path d="M48 76 A12 12 0 0 1 72 76 Z" fill={color} />
      <line x1="40" y1="77" x2="80" y2="77" stroke={color} strokeWidth="1" />
      <text x="60" y="97" textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontSize="10" fontStyle="italic" fill="#23180F">{label}</text>
      <text x="60" y="110" textAnchor="middle" fontFamily="Inter Tight, sans-serif" fontSize="5" letterSpacing="1.4" fill="#7A6A58">NORTHFIELD</text>
    </svg>
  )
}

/** Brand mark: a sun on the horizon — the first light. */
export function Mark({ className = '', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 14" className={className} aria-hidden="true">
      <path d="M4 12 A8 8 0 0 1 20 12 Z" fill={color} />
      <line x1="0" y1="13" x2="24" y2="13" stroke={color} strokeWidth="1.2" />
    </svg>
  )
}

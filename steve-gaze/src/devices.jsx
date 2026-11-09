// Hand-drawn SVG device illustrations for the orbit. No logos or trademarks,
// just the recognisable silhouettes. `w` is width relative to the head box.

const Screen = ({ id, from, mid, to }) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor={from} />
    <stop offset="0.55" stopColor={mid} />
    <stop offset="1" stopColor={to} />
  </linearGradient>
)

const Sheen = ({ id }) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
    <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
  </linearGradient>
)

export const DEVICES = [
  {
    key: 'imac',
    label: 'iMac',
    w: 0.255, // 1.5x
    svg: (
      <svg viewBox="0 0 120 108">
        <defs>
          <Screen id="imac-s" from="#24407e" mid="#5d86d8" to="#f2b79c" />
          <Sheen id="imac-h" />
          <linearGradient id="imac-chin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b9d3ec" />
            <stop offset="1" stopColor="#97bbe0" />
          </linearGradient>
        </defs>
        <path d="M50 82h20l4 20H46z" fill="#a9c4df" />
        <rect x="38" y="100" width="44" height="5" rx="2.5" fill="#9cb9d8" />
        <rect x="2" y="2" width="116" height="66" rx="4" fill="#eef3f8" />
        <path d="M2 66h116v12a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5z" fill="url(#imac-chin)" />
        <rect x="6.5" y="6.5" width="107" height="57" rx="1.5" fill="url(#imac-s)" />
        <rect x="6.5" y="6.5" width="107" height="57" rx="1.5" fill="url(#imac-h)" />
      </svg>
    ),
  },
  {
    key: 'ipad',
    label: 'iPad',
    w: 0.138, // 1.2x
    svg: (
      <svg viewBox="0 0 80 106">
        <defs>
          <Screen id="ipad-s" from="#f6c38b" mid="#e8728a" to="#5b3f9e" />
          <Sheen id="ipad-h" />
        </defs>
        <rect x="1" y="1" width="78" height="104" rx="8" fill="#1f1f22" stroke="#c7cbd0" strokeWidth="1.6" />
        <circle cx="40" cy="5.6" r="1" fill="#3a3a3e" />
        <rect x="7" y="10" width="66" height="84" rx="1.5" fill="url(#ipad-s)" />
        <rect x="7" y="10" width="66" height="84" rx="1.5" fill="url(#ipad-h)" />
        <circle cx="40" cy="99.5" r="3.2" fill="none" stroke="#45454a" strokeWidth="0.9" />
      </svg>
    ),
  },
  {
    key: 'ipod',
    label: 'iPod',
    w: 0.098, // 1.4x
    svg: (
      <svg viewBox="0 0 60 100">
        <defs>
          <linearGradient id="ipod-b" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#e7e7ea" />
          </linearGradient>
          <linearGradient id="ipod-s" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d9e6f1" />
            <stop offset="1" stopColor="#a7bfd4" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="58" height="98" rx="9" fill="url(#ipod-b)" stroke="#d3d3d7" strokeWidth="1.2" />
        <rect x="7" y="7" width="46" height="35" rx="2" fill="url(#ipod-s)" stroke="#b9c3cc" strokeWidth="0.6" />
        <rect x="11" y="12" width="20" height="2.4" rx="1.2" fill="#6f8aa3" opacity="0.55" />
        <rect x="11" y="17" width="28" height="2.4" rx="1.2" fill="#6f8aa3" opacity="0.4" />
        <rect x="11" y="22" width="24" height="2.4" rx="1.2" fill="#6f8aa3" opacity="0.4" />
        <circle cx="30" cy="70" r="19" fill="#f3f3f5" stroke="#d6d6da" strokeWidth="1" />
        <circle cx="30" cy="70" r="7" fill="#fff" stroke="#d6d6da" strokeWidth="0.8" />
        <text x="30" y="56.2" textAnchor="middle" fontSize="3.6" fontFamily="Helvetica, Arial, sans-serif" fill="#9a9aa0" letterSpacing="0.3">MENU</text>
        <path d="M42.5 68.2v3.6l2.6-1.8zM45.4 68.2v3.6M17.5 68.2v3.6l-2.6-1.8zM14.6 68.2v3.6" stroke="#9a9aa0" strokeWidth="0.7" fill="#9a9aa0" />
        <path d="M27.8 81.5v3.2l2.4-1.6zM31.4 81.5v3.2M32.6 81.5v3.2" stroke="#9a9aa0" strokeWidth="0.7" fill="#9a9aa0" />
      </svg>
    ),
  },
  {
    key: 'iphone',
    label: 'iPhone',
    w: 0.068,
    svg: (
      <svg viewBox="0 0 52 102">
        <defs>
          <Screen id="iphone-s" from="#103c55" mid="#2f8fa8" to="#a7e0c8" />
          <Sheen id="iphone-h" />
        </defs>
        <rect x="1.2" y="1.2" width="49.6" height="99.6" rx="8.5" fill="#121214" stroke="#c4c8cd" strokeWidth="2" />
        <rect x="20" y="7.6" width="12" height="1.8" rx="0.9" fill="#3a3a3e" />
        <rect x="5" y="15" width="42" height="70" rx="1" fill="url(#iphone-s)" />
        <rect x="5" y="15" width="42" height="70" rx="1" fill="url(#iphone-h)" />
        <circle cx="26" cy="92.6" r="4.2" fill="#0c0c0d" stroke="#4a4a4f" strokeWidth="0.8" />
        <rect x="24.2" y="90.8" width="3.6" height="3.6" rx="0.8" fill="none" stroke="#5a5a60" strokeWidth="0.5" />
      </svg>
    ),
  },
  {
    key: 'macbook-air',
    label: 'MacBook Air',
    w: 0.247, // 1.3x
    svg: (
      <svg viewBox="0 0 140 90">
        <defs>
          <Screen id="mba-s" from="#3b2b6b" mid="#a35ea8" to="#f4a87c" />
          <Sheen id="mba-h" />
          <linearGradient id="mba-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e4e6e9" />
            <stop offset="1" stopColor="#b9bdc2" />
          </linearGradient>
        </defs>
        <rect x="14" y="2" width="112" height="75" rx="5" fill="#cfd2d6" />
        <rect x="17" y="5" width="106" height="70" rx="3" fill="#141416" />
        <rect x="20" y="8" width="100" height="64" rx="1" fill="url(#mba-s)" />
        <rect x="20" y="8" width="100" height="64" rx="1" fill="url(#mba-h)" />
        <path d="M2 77h136l-3.4 7.6a5 5 0 0 1-4.6 3H10a5 5 0 0 1-4.6-3z" fill="url(#mba-base)" />
        <rect x="59" y="77" width="22" height="2.6" rx="1.3" fill="#a9adb2" />
      </svg>
    ),
  },
]

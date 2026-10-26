// An image slot: shows licensed Sky imagery when ASSETS provides a path,
// otherwise the art-directed stand-in passed as children.
export default function Slot({ name, src, alt = '', className = '', imgClassName = 'object-cover', children }) {
  return (
    <div className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} overflow-hidden ${className}`} data-slot={name}>
      {src ? <img src={src} alt={alt} className={`absolute inset-0 h-full w-full ${imgClassName}`} loading="lazy" decoding="async" /> : children}
    </div>
  );
}

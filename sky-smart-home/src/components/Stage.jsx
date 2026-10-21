export const CANVAS_W = 1920;
export const CANVAS_H = 1080;

/** A fixed 16:9 canvas, uniformly scaled to fit the browser. */
export default function Stage({ viewport, children }) {
  const scale = Math.min(viewport.w / CANVAS_W, viewport.h / CANVAS_H);
  return (
    <div
      className="absolute left-1/2 top-1/2 overflow-hidden"
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      {children}
    </div>
  );
}

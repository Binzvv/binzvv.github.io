/** One controlled light source, a horizon haze, and fine grain. */
export default function Atmosphere() {
  return (
    <div className="atmo" aria-hidden="true">
      <div className="atmo__light" />
      <div className="atmo__horizon" />
      <div className="atmo__grain" />
    </div>
  );
}

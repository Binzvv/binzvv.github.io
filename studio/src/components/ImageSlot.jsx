// An art-directed frame for a real photograph.
// With `image` set it shows the photo; without, it shows a stand-in "exposure"
// composed in the project's palette plus the brief for what to shoot.
// Grain, crop marks and the label sit on top either way, so real imagery
// inherits the same editorial finish.

export default function ImageSlot({ project }) {
  const { id, title, image, brief, ratio, palette } = project

  return (
    <div className="slot" data-palette={palette}>
      {image ? (
        <img className="slot__img" src={image} alt={title} loading="lazy" />
      ) : (
        <div className="slot__photo" aria-hidden="true">
          <span className="ph ph--a" />
          <span className="ph ph--b" />
          <span className="ph ph--c" />
        </div>
      )}
      <span className="slot__grain" aria-hidden="true" />
      <span className="slot__crop" aria-hidden="true"><i /><i /><i /><i /></span>
      {!image && (
        <span className="slot__label mono" aria-hidden="true">
          <b>IMG/{id} — {ratio}</b>
          <span>{brief}</span>
        </span>
      )}
    </div>
  )
}

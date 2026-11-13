/** Splits a line into word spans so GSAP can stagger them. */
export default function Words({ text }) {
  return text.split(' ').map((word, i, all) => (
    <span key={i} className="w">
      <span className="w__i">{word}</span>
      {i < all.length - 1 ? ' ' : ''}
    </span>
  ));
}

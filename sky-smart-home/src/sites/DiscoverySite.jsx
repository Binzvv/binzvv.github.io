import Placeholder from '../components/Placeholder.jsx';

const Copy = ({ className = '', children }) => <p className={`text-black/55 ${className}`}>{children}</p>;

/** Inspiration-led placeholder site. All copy is placeholder until real content is supplied. */
export default function DiscoverySite() {
  return (
    <div className="min-h-full bg-[#FAF8F4] text-ink">
      <header className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between px-12">
        <span className="text-[17px] font-semibold tracking-[-0.01em]">Smart Home</span>
        <nav className="flex gap-10 text-[14px] text-black/55">
          <span>Ideas</span>
          <span>Rooms</span>
          <span>Stories</span>
          <span>Shop</span>
        </nav>
      </header>

      <section className="mx-auto max-w-[1280px] px-12 pb-24 pt-14">
        <p className="mb-6 text-[14px] uppercase tracking-[0.16em] text-black/40">Discovery</p>
        <h1 className="max-w-[1000px] text-[92px] font-semibold leading-[0.95] tracking-[-0.045em]">
          Headline placeholder for an inspiring story.
        </h1>
      </section>

      <Placeholder tone="sand" shape="arch" label="Hero image — full bleed" className="h-[640px] w-full" />

      <section className="mx-auto grid max-w-[1280px] grid-cols-12 gap-8 px-12 py-32">
        <p className="col-span-3 text-[14px] uppercase tracking-[0.16em] text-black/40">Introduction</p>
        <p className="col-span-9 text-[40px] leading-[1.18] tracking-[-0.025em]">
          An editorial introduction will sit here. Placeholder copy setting the tone for the journey and
          inviting people to imagine what a more connected home could feel like.
        </p>
      </section>

      <section className="mx-auto max-w-[1280px] px-12 pb-32">
        <div className="mb-10 flex items-end justify-between border-t border-black/10 pt-6">
          <h2 className="text-[28px] font-semibold tracking-[-0.02em]">Room by room</h2>
          <span className="text-[14px] text-black/45">Placeholder module</span>
        </div>
        <div className="grid grid-cols-3 gap-8">
          {[
            ['clay', 'sun', 'Living'],
            ['sage', 'arch', 'Kitchen'],
            ['stone', 'disc', 'Bedroom'],
          ].map(([tone, shape, room], i) => (
            <figure key={room}>
              <Placeholder tone={tone} shape={shape} label={`Image 0${i + 1}`} className="aspect-[4/5] w-full" />
              <figcaption className="mt-5">
                <p className="text-[13px] uppercase tracking-[0.16em] text-black/40">{room}</p>
                <p className="mt-2 text-[22px] leading-snug tracking-[-0.015em]">Story title placeholder</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="bg-[#1D1B19] py-40 text-white">
        <div className="mx-auto max-w-[1280px] px-12">
          <p className="max-w-[1050px] text-[72px] font-semibold leading-[1.02] tracking-[-0.04em]">
            A pull statement placeholder, set large.
          </p>
          <p className="mt-10 text-[15px] text-white/40">Attribution placeholder</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] grid-cols-2 items-center gap-20 px-12 py-32">
        <Placeholder tone="clay" shape="horizon" label="Lifestyle image" className="aspect-[4/3] w-full" />
        <div>
          <p className="text-[14px] uppercase tracking-[0.16em] text-black/40">Story</p>
          <h3 className="mt-5 text-[48px] font-semibold leading-[1.02] tracking-[-0.035em]">
            Secondary story headline placeholder.
          </h3>
          <Copy className="mt-6 text-[19px] leading-relaxed">
            Supporting paragraph placeholder. Real copy describing this moment in the journey will replace this
            text.
          </Copy>
          <span className="mt-10 inline-flex items-center gap-3 text-[16px] font-medium">
            Continue to product <span aria-hidden>→</span>
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-12 pb-32">
        <div className="grid grid-cols-2 gap-8">
          <Placeholder tone="stone" shape="slab" label="Image 04" className="aspect-[16/10] w-full" />
          <Placeholder tone="sand" shape="device" label="Image 05" className="aspect-[16/10] w-full" />
        </div>
      </section>

      <footer className="border-t border-black/10">
        <div className="mx-auto flex max-w-[1280px] justify-between px-12 py-12 text-[13px] text-black/40">
          <span>Footer placeholder</span>
          <span>Discovery prototype</span>
        </div>
      </footer>
    </div>
  );
}

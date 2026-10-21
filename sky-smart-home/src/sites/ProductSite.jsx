import Placeholder from '../components/Placeholder.jsx';

const SPECS = ['Dimensions', 'Weight', 'Connectivity', 'Power', 'Compatibility', 'In the box'];
const FAQ = ['Question placeholder one', 'Question placeholder two', 'Question placeholder three'];

/** Information-led placeholder product page. All copy is placeholder until real content is supplied. */
export default function ProductSite() {
  return (
    <div className="min-h-full bg-white text-ink">
      <header className="border-b border-black/[0.06]">
        <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between px-12">
          <span className="text-[17px] font-semibold tracking-[-0.01em]">Smart Home</span>
          <nav className="flex gap-10 text-[14px] text-black/55">
            <span>Products</span>
            <span>Compare</span>
            <span>Support</span>
            <span>Basket</span>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-12 pt-8 text-[13px] text-black/40">Smart Home / Product</div>

      <section className="mx-auto grid max-w-[1280px] grid-cols-12 gap-12 px-12 pb-28 pt-10">
        <div className="col-span-7">
          <Placeholder tone="mist" shape="device" label="Product image" className="aspect-square w-full rounded-[20px]" />
          <div className="mt-4 grid grid-cols-4 gap-4">
            {['device', 'disc', 'slab', 'device'].map((shape, i) => (
              <Placeholder
                key={i}
                tone={i === 0 ? 'steel' : 'mist'}
                shape={shape}
                label=""
                className="aspect-square w-full rounded-[12px]"
              />
            ))}
          </div>
        </div>

        <div className="col-span-5 pt-6">
          <p className="text-[14px] uppercase tracking-[0.16em] text-black/40">Product</p>
          <h1 className="mt-4 text-[64px] font-semibold leading-[0.98] tracking-[-0.04em]">Product name</h1>
          <p className="mt-5 text-[19px] leading-relaxed text-black/55">
            Short product description placeholder. One or two lines explaining what it is.
          </p>
          <p className="mt-8 text-[28px] font-medium tracking-[-0.02em]">£—.—</p>

          <div className="mt-10 border-t border-black/10 pt-6">
            <p className="text-[14px] text-black/55">Finish</p>
            <div className="mt-4 flex gap-3">
              {['#1A1A1A', '#D9D6D0', '#8C8F93'].map((c, i) => (
                <span
                  key={c}
                  className={`h-9 w-9 rounded-full ${i === 0 ? 'ring-2 ring-ink ring-offset-2' : 'ring-1 ring-black/10'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <span className="mt-10 flex h-14 items-center justify-center rounded-full bg-ink text-[16px] font-medium text-white">
            Add to basket
          </span>
          <p className="mt-5 text-[13px] text-black/40">Delivery and returns information placeholder.</p>
        </div>
      </section>

      <section className="bg-[#F6F7F8] py-28">
        <div className="mx-auto grid max-w-[1280px] grid-cols-3 gap-12 px-12">
          {['Feature one', 'Feature two', 'Feature three'].map((f, i) => (
            <div key={f}>
              <span className="text-[13px] tabular-nums text-black/35">0{i + 1}</span>
              <h3 className="mt-4 text-[28px] font-semibold tracking-[-0.025em]">{f}</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-black/55">
                Feature description placeholder. Factual product information will go here.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] grid-cols-12 gap-12 px-12 py-28">
        <h2 className="col-span-4 text-[40px] font-semibold tracking-[-0.035em]">Specifications</h2>
        <dl className="col-span-8">
          {SPECS.map((s) => (
            <div key={s} className="grid grid-cols-2 border-t border-black/10 py-6 text-[17px]">
              <dt className="text-black/55">{s}</dt>
              <dd>Placeholder</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto grid max-w-[1280px] grid-cols-12 gap-12 px-12 pb-32">
        <h2 className="col-span-4 text-[40px] font-semibold tracking-[-0.035em]">Questions</h2>
        <div className="col-span-8">
          {FAQ.map((q) => (
            <div key={q} className="flex items-center justify-between border-t border-black/10 py-7 text-[19px]">
              <span>{q}</span>
              <span className="text-[22px] text-black/35">+</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-black/10">
        <div className="mx-auto flex max-w-[1280px] justify-between px-12 py-12 text-[13px] text-black/40">
          <span>Footer placeholder</span>
          <span>Product prototype</span>
        </div>
      </footer>
    </div>
  );
}

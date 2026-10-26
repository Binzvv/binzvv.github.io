import { DIRECTORY, SKY } from '../content';
import { Arrow, Chevron } from './Icons';
import ConceptBar from './ConceptBar';

// The close: the whole of Sky as one typographic index, then a single
// calm place for deals and existing customers.
export default function Directory() {
  return (
    <>
      <section id="all" data-nav="light" aria-labelledby="all-title" className="bg-flat px-6 pb-24 pt-8 lg:px-8 lg:pb-32 lg:pt-16">
        <div className="mx-auto max-w-[1180px]">
          <h2 id="all-title" className="t-eyebrow text-grey-70">All of Sky</h2>
          <ul className="dir mt-6 border-t border-grey-10">
            {DIRECTORY.map((d) => (
              <li key={d.id} className="dir-row border-b border-grey-10 transition-opacity duration-500 ease-sky">
                <a href={d.href} className="group flex items-center gap-4 py-5 lg:py-7">
                  <span className="font-headline text-[32px] font-medium leading-[40px] tracking-[-0.02em] text-ink transition-transform duration-500 ease-sky group-hover:translate-x-2 group-focus-visible:translate-x-2 lg:w-[44%] lg:text-[56px] lg:leading-[64px]">
                    {d.name}
                  </span>
                  <span className="hidden flex-1 text-[19px] leading-[28px] text-grey-70 transition-[opacity,transform] duration-500 ease-sky lg:block lg:translate-x-[-8px] lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100 lg:group-focus-visible:translate-x-0 lg:group-focus-visible:opacity-100">
                    {d.line}
                  </span>
                  <span className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink transition-[background-color,color,transform] duration-500 ease-sky group-hover:bg-primary group-hover:text-white group-focus-visible:bg-primary group-focus-visible:text-white">
                    <Arrow className="h-5 w-5 transition-transform duration-500 ease-sky group-hover:-rotate-45" />
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-24 grid gap-12 lg:mt-32 lg:grid-cols-2 lg:items-end">
            <div>
              <h2 className="t-h2 text-ink">Find the right Sky for you.</h2>
              <p className="t-lead mt-4 max-w-[36ch] text-grey-70">Today’s TV, broadband and mobile deals, all in one place.</p>
              <a href={`${SKY}/deals`} className="btn btn-primary mt-8 w-full max-w-[320px] sm:w-auto">
                See today’s deals
              </a>
            </div>
            <div className="lg:justify-self-end">
              <p className="text-[15px] text-grey-70">Already with Sky?</p>
              <ul className="mt-3 space-y-2">
                {[
                  ['Sign in to My Sky', `${SKY}/signin`],
                  ['Get help', `${SKY}/help`],
                  ['Check your bill', `${SKY}/help`],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="link">
                      <span className="u">{label}</span> <Chevron />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer data-nav="light" className="bg-grey-5 px-6 pb-12 pt-12 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="t-legal max-w-[80ch] text-grey-70">
            Concept prototype. This is not an official Sky website and is not affiliated with or endorsed by Sky UK Limited. Sky, Sky Glass,
            Sky Stream, Sky Sports and related names belong to their owners. Imagery, product renders and the wordmark are stand-ins for
            licensed assets. No prices or offers are shown because current offers could not be verified.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-grey-70">
            {['Privacy', 'Cookies', 'Accessibility', 'Contact us'].map((l) => (
              <li key={l}>
                <a href={`${SKY}/help`} className="hover:text-ink hover:underline">
                  {l}
                </a>
              </li>
            ))}
          </ul>
          <ConceptBar className="mt-8 flex lg:hidden" />
        </div>
      </footer>
    </>
  );
}

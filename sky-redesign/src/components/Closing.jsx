import { SKY } from '../content';
import { Chevron } from './Icons';
import ConceptBar from './ConceptBar';

// Commerce gets one calm, dedicated moment instead of competing with
// every section above it.
export default function Closing() {
  return (
    <>
      <section id="deals" data-nav="light" aria-labelledby="deals-title" className="bg-flat px-6 pb-24 pt-8 text-center lg:px-8 lg:pb-40">
        <div className="mx-auto max-w-[760px]">
          <h2 id="deals-title" className="t-h2 text-ink">Find the right Sky for you.</h2>
          <p className="t-lead mx-auto mt-4 max-w-[36ch] text-grey-70">Today’s TV, broadband and mobile deals, all in one place.</p>
          <div className="mt-8">
            <a href={`${SKY}/deals`} className="btn btn-primary w-full max-w-[320px] sm:w-auto">
              See today’s deals
            </a>
          </div>
        </div>
        <div className="mx-auto mt-20 max-w-[960px] border-t border-grey-10 pt-10">
          <p className="text-[15px] text-grey-70">Already with Sky?</p>
          <ul className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-10">
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
      </section>

      <footer data-nav="light" className="bg-grey-5 px-6 pb-12 pt-12 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="t-legal max-w-[80ch] text-grey-70">
            Concept prototype. This is not an official Sky website and is not affiliated with or endorsed by Sky UK Limited. Sky, Sky Glass,
            Sky Stream and related names belong to their owners. Product renders, key art and the wordmark are stand-ins for licensed
            assets. No prices or offers are shown because current offers could not be verified.
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

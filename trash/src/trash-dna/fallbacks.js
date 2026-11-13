/**
 * TRASH — DNA: when it doesn't recognise the input.
 *
 * Restraint over invention. A question it can't place gets an honest
 * shrug; a statement gets a short acknowledgement. Picked
 * deterministically, so the same input always gets the same answer.
 */

export const UNKNOWN_QUESTION = [
  ['Honestly? No idea.'],
  ['Not sure. And I’d rather not pretend.'],
  ['I don’t know enough to say something worth hearing.'],
  ['That one’s outside my head.'],
  ['I’ll pass on that one.'],
];

export const UNKNOWN_STATEMENT = [['Fair.'], ['Go on.'], ['Noted. Say more, or don’t.']];

export const NOISE = ['That’s not a thought yet.'];

/** Words that suggest a strategic question about a business, brand or team. */
export const STRATEGIC_SIGNAL =
  /\b(brand|brands|branding|business|customers?|clients?|audiences?|market|marketing|campaigns?|products?|company|companies|startup|strategy|growth|grow|team|agency|launch|sales|revenue|retention|engagement|consumers?|users?|organi[sz]ation|we|our|us)\b/;

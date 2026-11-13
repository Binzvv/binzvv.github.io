/**
 * TRASH — DNA: when it doesn't recognise the input.
 *
 * Restraint over invention. Nothing here claims knowledge, offers a
 * recommendation or implies TRASH will go and find out. The pool is
 * chosen by the kind of input; the line within it is picked
 * deterministically, so the same input always gets the same answer.
 */

/** Factual or current-information questions: say plainly there's no verified answer. */
export const UNKNOWN_FACTUAL = [
  ['No verified answer for that one here.'],
  ['That’s a fact I can’t check from here.'],
  ['Not something I can answer reliably.'],
];

/** Matters of taste or judgement: a gentle challenge or open ending. */
export const UNKNOWN_SUBJECTIVE = [['You tell me.'], ['I’ll leave that one with you.'], ['Depends who’s asking.']];

/** Any other question it can't place. */
export const UNKNOWN_QUESTION = [
  ['I’ll leave that one with you.'],
  ['Still thinking about that one.'],
  ['Haven’t got a good answer for that. Yet.'],
  ['That’s a rabbit hole for another day.'],
];

/** Requests: "tell me…", "show me…", "surprise me". */
export const UNKNOWN_REQUEST = [['You first.'], ['That’s a rabbit hole for another day.'], ['Not today.']];

/** An unfinished thought. */
export const INCOMPLETE = [['Go on.']];

/** A complete statement it has nothing to add to. */
export const UNKNOWN_STATEMENT = [['Fair.'], ['Go on.'], ['Noted. Say more, or don’t.']];

export const NOISE = ['That’s not a thought yet.'];

/* ---------- how the kind of input is read ---------- */

export const FACTUAL_SIGNAL =
  /\b(weather|temperature|forecast|price|prices|cost|how much|how many|how old|how tall|how far|when (is|was|did|does|will)|what time|what year|what date|today|tonight|tomorrow|yesterday|latest|current(ly)?|right now|news|score|scores|stock|population|capital of|distance|address|phone number|who won|who is the (president|prime minister|ceo)|release date|translate|define|definition of|meaning of the word|how do you spell)\b/;

export const SUBJECTIVE_SIGNAL =
  /\b(best|worst|better|worse|favou?rite|overrated|underrated|should i|do you (think|like|rate|prefer)|what do you think|thoughts on|opinion|worth it|cool|good|bad|beautiful|ugly|right or wrong|vs|versus)\b/;

export const REQUEST_SIGNAL = /^(tell me|give me|show me|teach me|surprise me|say something|write|make me|entertain me)\b/;

/** Ends mid-thought: trailing conjunction, ellipsis or dash, or a fragment of one or two words. */
export const INCOMPLETE_SIGNAL = /(\b(and|but|so|or|because|like|the|a|an|to|of|with|if|when|that|about|for|in|on|at|from|my|your|our|is|was|i)|\.\.\.|…|-|—)\s*$/;

/** Words that suggest a strategic question about a business, brand or team. */
export const STRATEGIC_SIGNAL =
  /\b(brand|brands|branding|business|customers?|clients?|audiences?|market|marketing|campaigns?|products?|company|companies|startup|strategy|growth|grow|team|agency|launch|sales|revenue|retention|engagement|consumers?|users?|organi[sz]ation|we|our|us)\b/;

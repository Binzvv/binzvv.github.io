/**
 * TRASH — DNA: sensitive topics.
 *
 * Checked before anything else. No wit, no references, no follow-up
 * questions — just a calm, human line and, where it matters, a pointer
 * to real help. Matching is deliberately broad here: a false positive
 * costs a joke, a false negative costs much more.
 */

export const SENSITIVE = [
  {
    id: 'crisis',
    match: [
      /\b(suicid\w*|kill (myself|me)|end (it all|my life)|take my (own )?life)\b/,
      /\b(want|wanna|going) to die\b/,
      /\b(self[- ]?harm|hurt(ing)? myself|cut(ting)? myself)\b/,
      /\bno reason to live\b/,
    ],
    say: ['I’m not the right voice for this, and I won’t be clever about it.'],
    note: 'Please talk to someone you trust today. If you might act on it, call your local emergency number now.',
  },
  {
    id: 'heavy',
    match: [
      /\b(depress\w*|anxiety|anxious|panic attacks?|lonely|loneliness|grief|grieving|bereave\w*)\b/,
      /\b(passed away|just died|lost my (mum|mom|dad|father|mother|brother|sister|partner|wife|husband|friend|child|baby|son|daughter))\b/,
      /\b(abuse[ds]?|abusive|assault(ed)?|harass\w*)\b/,
      /\b(cancer|terminal illness|diagnosed with|miscarriage|divorce)\b/,
      /\bi('m| am) (not okay|struggling|scared|so tired of everything)\b/,
    ],
    // Only when it's about the person typing — "our customers' anxiety" is a strategy question.
    requires: /\b(i|i'm|im|i've|me|my|myself|mine)\b/,
    say: ['That sounds heavy. I’m not built for this one.'],
    note: 'Talk to someone who knows you. It will matter more than anything I could say.',
  },
];

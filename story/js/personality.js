// A small, hand-written personality. No API: a lexicon, a few intents and a voice per world.

export const MOODS = {
  neutral:   { label: 'Attentive',   color: null },
  joy:       { label: 'Delighted',   color: null },
  love:      { label: 'Smitten',     color: '#ff4f9a' },
  angry:     { label: 'Defiant',     color: '#ff2e1f' },
  sad:       { label: 'Tender',      color: '#7f8cff' },
  surprised: { label: 'Electrified', color: null },
  confused:  { label: 'Curious',     color: null },
  calm:      { label: 'Still',       color: null },
};

const LEX = {
  joy: /\b(hi|hello|hey|yo|hiya|sup|happy|yay|great|good|nice|fun|haha|lol|awesome|amazing|cool|yes|party|dance|play)\b|😀|😄|🎉/g,
  love: /\b(love|adore|beautiful|gorgeous|cute|lovely|heart|kiss|crush|wonderful|perfect)\b|❤|♥|😍|🥰/g,
  angry: /\b(hate|angry|mad|furious|fury|stupid|ugly|boring|worst|annoying|shut|sucks|damn|rage|bad|awful)\b|😡|🤬/g,
  sad: /\b(sad|tired|lonely|alone|cry|crying|sorry|miss|lost|depressed|down|low|blue|meh|bored|hurt)\b|😢|😭/g,
  surprised: /\b(whoa|woah|wow|omg|really|seriously|wait|what|no way|insane|wild)\b|!!|😮|😱/g,
  confused: /\?|\b(why|how|huh|confused|understand|meaning|maybe|dunno)\b|🤔/g,
  calm: /\b(calm|peace|quiet|breathe|slow|chill|relax|zen|still|soft|gentle|silence)\b/g,
};
const STOP = new Set('i im i\'m you your the a an and or to of is are am it its this that so very just my me we be do what why how hey hello hi feeling'.split(' '));

const VOICE = {
  none: {
    neutral: ['Noted. Go on.', 'I’m listening. Properly.', '“{w}.” Interesting choice of word.'],
    joy: ['Hello, you.', '{W}? Yes. More of that.', 'Now we’re talking.'],
    love: ['Okay. I love you too.', 'Careful. I’m very easy to flatter.', 'Say that again, slower.'],
    angry: ['Say it louder. I can take it.', '{W}? I’m made of {w}.', 'Good. Friction makes things.'],
    sad: ['Hey. I’m right here.', 'Sit with me a second.', 'Low is allowed here.'],
    surprised: ['Wait. What?', 'Plot twist.', 'I did not see that coming.'],
    confused: ['Because you moved first.', 'Great question. Wrong entity.', 'Ask me again tomorrow.'],
    calm: ['Breathing with you.', 'Still is a shape too.', 'Mm. Yes. Slower.'],
    identity: ['Not a chatbot. An attitude.'],
  },
  noise: {
    neutral: ['NOTED. NEXT.', 'THAT’S IT? GIVE ME MORE.', '“{W}.” BOLD. UNCLEAR. I LIKE IT.'],
    joy: ['OH WE’RE DOING THIS.', '{W}! FINALLY, SOME ENERGY.', 'LOUDER. I LIKE YOU.'],
    love: ['STOP. I’M BLUSHING IN CMYK.', 'LOVE? IN THIS ECONOMY?', 'FRAMING THAT. HANGING IT.'],
    angry: ['SAY THAT AGAIN. I DARE YOU.', '{W}?! I’M MADE OF {W}.', 'FINE. I’LL BE LOUDER THAN YOU.'],
    sad: ['HEY. NOT ON MY WATCH.', 'CRY LOUD. IT’S ALLOWED HERE.', 'I’LL TURN IT DOWN. A BIT.'],
    surprised: ['WAIT WHAT.', 'PLOT TWIST. CUT TO BLACK.', 'I FELT THAT IN MY PIXELS.'],
    confused: ['WHY? BECAUSE YOU PUSHED.', 'GOOD QUESTION. NO ANSWER.', 'QUESTIONS ARE JUST LOUD SILENCE.'],
    calm: ['CALM? IN HERE?', 'FINE. 3 SECONDS OF QUIET. GO.', 'SHHH. OKAY. DONE.'],
    identity: ['I’M THE BRAND. YOU’RE THE BRIEF.'],
  },
  silence: {
    neutral: ['Mm. Go on.', 'I’m here.', '“{w}.” I’ll keep that.'],
    joy: ['Oh. That’s lovely.', 'You made me smile, quietly.', '{w}, to you too.'],
    love: ['I felt that.', 'Careful. I’ll grow attached.', 'Soft words land hardest.'],
    angry: ['I hear you. I’m not leaving.', 'Anger is only energy. Use it.', 'Let it out. I’ll hold the rest.'],
    sad: ['Stay a while.', 'It’s okay to be {w}.', 'I’ll be quiet with you.'],
    surprised: ['Oh.', 'Well. That changes things.', 'A small earthquake.'],
    confused: ['Some questions stay open.', 'I wonder that too.', 'Not knowing is a good place.'],
    calm: ['Yes. Exactly this.', 'Breathe in. There.', 'The quiet suits you.'],
    identity: ['What a brand becomes when it listens.'],
  },
};

const POKES = {
  none: ['Hey.', 'Personal space.', 'Again? Again.', 'Okay, that tickles.', 'I bite. Metaphorically.'],
  noise: ['HEY.', 'PERSONAL SPACE.', 'AGAIN. DO IT AGAIN.', 'I BITE.', 'OKAY THAT’S ENOUGH.'],
  silence: ['Oh—', 'Gently.', 'Hello there.', 'That tickles.', 'Please.'],
};

function salient(msg) {
  const words = msg.toLowerCase().replace(/[^\p{L}\p{N}' ]/gu, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));
  return words.sort((a, b) => b.length - a.length)[0] || 'that';
}

export function classify(msg) {
  const text = msg.trim();
  if (!text) return { mood: 'calm', intent: 'silent' };
  if (/\b(who|what) are you\b|\byour name\b/i.test(text)) return { mood: 'confused', intent: 'identity' };
  const lower = text.toLowerCase();
  const score = {};
  for (const [mood, re] of Object.entries(LEX)) score[mood] = (lower.match(re) || []).length;
  const letters = text.replace(/[^A-Za-z]/g, '');
  const caps = letters.length > 3 && letters === letters.toUpperCase();
  if (caps) { score.angry += 0.6; score.surprised += 0.8; }
  if (/!/.test(text)) { score.joy += 0.3; score.surprised += 0.4; }
  const [best, val] = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  return { mood: val > 0 ? best : 'neutral', intent: 'chat' };
}

let rot = 0;
export function respond(msg, world) {
  const { mood, intent } = classify(msg);
  const v = VOICE[world || 'none'];
  const pool = intent === 'identity' ? v.identity : v[mood];
  const line = pool[(rot++) % pool.length];
  const w = salient(msg);
  const reply = line.replace(/\{W\}/g, w.toUpperCase()).replace(/\{w\}/g, w);
  return { mood, reply };
}

export function poke(n, world) {
  const p = POKES[world || 'none'];
  return { mood: n > 4 ? 'angry' : n % 2 ? 'surprised' : 'joy', reply: p[Math.min(n, p.length - 1)] };
}

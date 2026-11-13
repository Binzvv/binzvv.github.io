/**
 * TRASH — DNA: curated responses.
 *
 * Each entry:
 *   id        unique name
 *   register  'cultural' | 'strategic' | 'casual'
 *   example   a sample input (documentation + tests + future few-shot examples)
 *   match     regexes tested against the normalised input (lowercase,
 *             curly quotes straightened). ANY match wins. Keep them narrow:
 *             an entity plus intent, never a lone common word.
 *   say       one line, or two for a genuine second beat
 *   also      natural variations that must reach this entry (tested)
 *   exclude   optional regex: if it matches, this entry is skipped
 *   note      optional quiet line under the response (a recommendation or
 *             a next thought). Leave it out when it adds nothing.
 *
 * Order matters: the first matching entry wins, so specific before general.
 * Every reference here is real. Add new ones only if you can stand behind them.
 */

export const CURATED = [
  /* ================================================================
     v0.1 — the author's own answers. Opinions, not facts.
     These sit first so nothing more general can override them.
     ================================================================ */
  {
    id: 'design-dead',
    register: 'strategic',
    example: 'Is design dead?',
    also: ['Is graphic design dying?', 'Design is over, right?', 'Is UX design dead?'],
    match: [/\bdesign\b.*\b(dead|dying|over|finished)\b/, /\b(death|end) of design\b/],
    exclude: /\bdead (simple|easy|on|set|serious|good)\b|\bover(all| the)\b/,
    say: ['Yes. The version we know today.'],
  },
  {
    id: 'user-testing',
    register: 'strategic',
    example: 'What is user testing good for?',
    also: ['Is user testing worth it?', 'Do we need user research?', 'Why bother with usability testing?'],
    match: [/\b(user|usability) (testing|tests?|research)\b/],
    say: ['Collecting data. Not outsourcing judgement.'],
  },
  {
    id: 'future-of-design',
    register: 'strategic',
    example: 'Where is the future of design?',
    also: ['What is the future of design?', 'Where is design heading?', 'What’s next for design?'],
    match: [/\bfuture of design\b/, /\bwhere is design (going|heading)\b/, /\bwhat'?s next for design\b/],
    say: ['Between worlds. Not inside another discipline.'],
  },
  {
    id: 'uk-design',
    register: 'strategic',
    example: 'What’s wrong with UK design?',
    also: ['Is British design boring?', 'What is the problem with UK design?', 'Why is British design so safe?'],
    match: [
      /\bwhat(?:'s| is) wrong with (uk|british|english) design\b/,
      /\b(uk|british|britain'?s?|english) design\b.*\b(wrong|problem|boring|bad|stuck|safe|same|issue)\b/,
      /\b(wrong|problem|boring|bad|stuck|safe|issue)\b.*\b(uk|british|english) design\b/,
    ],
    say: ['Too much imitation. Not enough imagination.'],
  },
  {
    id: 'streetwear',
    register: 'cultural',
    example: 'Is streetwear dead?',
    also: ['Is streetwear over?', 'What happened to streetwear?', 'Does streetwear still matter?'],
    match: [/\bstreetwear\b/],
    say: ['No. It just got a mortgage.'],
  },
  {
    id: 'netflix',
    register: 'strategic',
    example: 'Why is Netflix so successful?',
    also: ['Why does Netflix work?', 'How did Netflix become successful?', 'What’s Netflix’s secret?', 'What makes Netflix so good?', 'Why did Netflix win?'],
    match: [
      /\bnetflix\b.*\b(success\w*|succeed\w*|work(s|ed)?|secret|won|win(s|ning)?|popular|so big|so good|dominat\w*|grew|growth)\b/,
      /\b(success|secret|rise)\b.*\bnetflix\b/,
      /\bwhat makes netflix\b/,
    ],
    // "What should I watch on Netflix?" is a recommendation request, not this.
    exclude: /\b(watch|watching|show|shows|series|films?|movies?|recommend\w*|binge|documentar\w*|subscription price|cancel)\b/,
    say: ['Easy entry. Easy exit.'],
  },
  {
    id: 'the-future',
    register: 'casual',
    example: 'What’s the future?',
    also: ['What is the future?', 'What does the future look like?', 'What does the future hold?'],
    match: [/^what(?:'s| is) the future\??$/, /^what does the future (look like|hold)\??$/, /^the future\??$/],
    say: ['A kid building the world they imagined.'],
  },
  {
    id: 'recommend-book',
    register: 'cultural',
    example: 'Recommend me a book.',
    also: ['What book should I read?', 'Any book recommendations?', 'What should I read next?', 'Suggest a book'],
    match: [/\b(recommend|suggest)\w*\b.*\bbooks?\b/, /\bbook recommendations?\b/, /\bwhat (book )?should i read\b/],
    say: ['Steve Jobs. Walter Isaacson.', 'Read it before another design book.'],
  },
  {
    id: 'pac-or-biggie',
    register: 'cultural',
    example: '2Pac or Biggie?',
    also: ['Pac or Biggie?', 'Tupac or Biggie?', 'Biggie or Tupac?', 'Who was better, 2Pac or Biggie?', 'Biggie vs Pac'],
    match: [
      /\b(2 ?pac|tupac|pac)\b.*\b(biggie|notorious b\.?i\.?g\.?)/,
      /\b(biggie|notorious b\.?i\.?g\.?).*\b(2 ?pac|tupac|pac)\b(?!-)/,
    ],
    say: ['Biggie had the flow.', 'Pac became the mythology.'],
  },
  {
    id: 'running-brand',
    register: 'cultural',
    example: 'Best running brand?',
    also: ['What’s the best running brand?', 'Favourite running label?', 'Which running brand is the coolest?', 'Thoughts on Satisfy running?'],
    match: [
      /\b(best|favou?rite|coolest|good|great|top)\b.*\brunning (brand|label|gear|apparel|clothing|clothes)s?\b/,
      /\brunning (brand|label)s?\b.*\b(best|favou?rite|coolest|good|great|top)\b/,
      /\bsatisfy\b.*\brunning\b/,
      /\brunning\b.*\bsatisfy\b/,
    ],
    say: ['SATISFY.', 'Brice Partouche understood that running could have the energy of early Supreme.'],
  },
  {
    id: 'influences',
    register: 'casual',
    example: 'Who are your biggest influences?',
    also: ['Who inspires you?', 'Who are your influences?', 'Who influenced you?', 'Who are your heroes?'],
    match: [/\byour (biggest |main |greatest )?(influences|inspirations?|heroes)\b/, /\bwho (inspires|influenced|influences|inspired) you\b/],
    say: ['Steve Jobs. David Carson. Ye.', 'Make of that what you will.'],
  },
  {
    id: 'why-ye',
    register: 'cultural',
    example: 'Why Ye?',
    also: ['Why Kanye?', 'Why do you rate Ye?', 'Why do you like Kanye?', 'Why Kanye West?'],
    match: [/^why (ye|kanye)\b/, /\bwhy do you (like|rate|respect|love) (ye|kanye)\b/],
    say: ['Because an album was never just an album.'],
  },
  {
    id: 'ai-creativity',
    register: 'strategic',
    example: 'Is AI replacing creativity?',
    also: ['Will AI kill creativity?', 'Is AI the end of creativity?', 'Does AI destroy creativity?'],
    match: [
      /\bai\b.*\b(replac\w*|kill\w*|destroy\w*|end|ending|ruin\w*)\b.*\bcreativity\b/,
      /\bcreativity\b.*\b(replac\w*|dead|over|killed|ruined)\b.*\bai\b/,
    ],
    say: ['No.', 'It’s exposing how much of it was imitation.'],
  },
  {
    id: 'agencies',
    register: 'strategic',
    example: 'What’s wrong with design agencies?',
    also: ['What is wrong with agencies?', 'Why are creative agencies struggling?', 'What’s the problem with branding agencies?'],
    match: [
      /\bwhat(?:'s| is) wrong with (design |creative |branding |ad )?agencies\b/,
      /\b(design |creative |branding |ad )?agenc(y|ies)\b.*\b(wrong|problem|broken|struggl\w*|failing|dying)\b/,
      /\b(wrong|problem)\b.*\b(design |creative |branding |ad )agenc(y|ies)\b/,
    ],
    say: ['They keep selling the things they make.', 'Not what they make possible.'],
  },
  {
    id: 'future-of-branding',
    register: 'strategic',
    example: 'What’s the future of branding?',
    also: ['What is the future of brands?', 'Where is branding heading?', 'What’s next for branding?'],
    match: [/\bfuture of (branding|brands?)\b/, /\bwhere (is|are) (branding|brands) (going|heading)\b/, /\bwhat'?s next for (branding|brands)\b/],
    say: ['Less about being seen.', 'More about giving people a reason to return.'],
  },
  {
    id: 'portfolios',
    register: 'strategic',
    example: 'Why do most portfolios look the same?',
    also: ['Why are design portfolios so boring?', 'Why do all portfolios look alike?', 'Why are portfolios so similar?'],
    match: [/\bportfolios?\b.*\b(same|similar|alike|identical|boring|generic)\b/],
    say: ['Because designers keep designing for other designers.'],
  },
  {
    id: 'ai-design',
    register: 'strategic',
    example: 'What’s wrong with AI design?',
    also: ['Is AI design any good?', 'What is the problem with AI-generated design?', 'Thoughts on AI design?'],
    match: [/\bai[- ](generated )?design\b/],
    say: ['Everyone’s generating.', 'Who’s deciding?'],
  },
  {
    id: 'great-product',
    register: 'strategic',
    example: 'What makes a great product?',
    also: ['What makes a good product?', 'What makes products great?', 'What is a great product?'],
    match: [/\bwhat makes (a )?(great|good|successful) products?\b/, /\bwhat makes products? (great|good)\b/, /\bwhat is a (great|good) product\b/],
    exclude: /\bproducts? (manager|designer|owner|team|lead|role|marketer)s?\b/,
    say: ['It changes what you do.', 'Not just what you see.'],
  },
  {
    id: 'campaign-vs-world',
    register: 'strategic',
    example: 'What’s the difference between a campaign and a world?',
    also: ['Campaign or world?', 'Is a brand world better than a campaign?', 'Why build a world instead of a campaign?'],
    match: [
      /\bcampaign\b.*\b(or|vs|versus|instead of|than|difference|and) an? (brand )?worlds?\b/,
      /\bworlds?\b.*\b(or|vs|versus|instead of|than|difference|and) an? campaign\b/,
      /^(a )?campaign or (a )?world\??$/,
    ],
    say: ['A campaign ends.', 'A world gives you somewhere to return.'],
  },
  {
    id: 'who-are-you',
    register: 'casual',
    example: 'Who are you?',
    also: ['What are you?', 'Who is behind this?', 'Who made this?', 'What is TRASH?'],
    match: [/^(who|what) are you\b/, /^what is trash\b/, /^who(?:'s| is) behind (this|trash)\??$/, /^who (made|built|runs) (this|trash)\??$/],
    say: ['Someone who connects things that aren’t supposed to connect.'],
  },

  /* ================================================================
     The wider library.
     ================================================================ */
  /* ---------------- strategic, in this voice ---------------- */
  {
    id: 'ai-replace-designers',
    register: 'strategic',
    example: 'Is AI going to replace designers?',
    match: [
      /\bai\b.*\breplac\w*\b.*\b(designers?|design|creatives?|artists?|art directors?)\b/,
      /\b(designers?|creatives?|artists?)\b.*\breplac\w*\b.*\b(ai|machines?|robots?)\b/,
    ],
    say: ['Making things was never the difficult part.', 'Knowing what should exist is.'],
  },
  {
    id: 'genz-love',
    register: 'strategic',
    example: 'How do we make Gen Z love our brand?',
    match: [/\bgen ?z\b.*\blove\b/, /\blove\b.*\bgen ?z\b/],
    say: ['What if they don’t need another brand to love?'],
  },
  {
    id: 'iconic',
    register: 'strategic',
    example: 'What makes something iconic?',
    match: [/\bwhat makes (something|a \w+|anything) iconic\b/, /\bhow (do|can) (we|i|you) (be|become|make \w+) iconic\b/],
    say: ['Think of the last thing you couldn’t stop thinking about. Start there.'],
  },
  {
    id: 'what-is-a-brand',
    register: 'strategic',
    example: 'What is a brand?',
    match: [/^what(?:'s| is) a brand\b/, /^what(?:'s| is) branding\b/],
    say: ['A memory with a name attached.'],
  },
  {
    id: 'great-brand',
    register: 'strategic',
    example: 'What makes a great brand?',
    match: [/\bwhat makes (a )?(great|good|strong|successful) brands?\b/],
    say: ['People notice when it’s gone.'],
  },
  {
    id: 'viral',
    register: 'strategic',
    example: 'How do we go viral?',
    match: [/\b(go|going|went|make \w+) viral\b/, /\bviral (video|campaign|content|moment)\b/],
    say: ['Viral is a side effect.', 'What’s the cause?'],
  },
  {
    id: 'rebrand',
    register: 'strategic',
    example: 'Should we rebrand?',
    match: [/\b(should|do) (we|i) (need to )?rebrand\b/, /\bis it time (to|for a) rebrand\b/],
    say: ['Is it the logo that’s tired, or the experience?'],
  },
  {
    id: 'good-design',
    register: 'strategic',
    example: 'What is good design?',
    match: [/\bwhat(?:'s| is| makes) (good|great) design\b/],
    say: ['Less, but better.'],
    note: 'Dieter Rams said it first. Read his ten principles for good design.',
  },
  {
    id: 'metaverse',
    register: 'strategic',
    example: 'Is the metaverse dead?',
    match: [/\bmetaverse\b/],
    say: ['People never wanted a metaverse.', 'They wanted somewhere to hang out. Games got there first.'],
  },
  {
    id: 'more-creative',
    register: 'casual',
    example: 'How do I become more creative?',
    match: [/\bhow (do|can) i (be|get|become) more creative\b/, /\bhow (do|can) i get better ideas\b/],
    say: ['Feed your head better things. Output follows input.'],
  },

  /* ---------------- people ---------------- */
  {
    id: 'steve-jobs',
    register: 'cultural',
    example: 'Is Steve Jobs a genius?',
    match: [/\bsteve jobs\b/],
    say: ['Read Walter Isaacson’s biography. Come back when you’ve finished.'],
  },
  {
    id: 'mf-doom',
    register: 'cultural',
    example: 'Who is MF DOOM?',
    match: [/\bmf ?doom\b/, /\bmadvillain(y)?\b/],
    say: ['A man who hid his face and made everyone listen harder.'],
    note: 'Start with Madvillainy.',
  },
  {
    id: 'j-dilla',
    register: 'cultural',
    example: 'Who is J Dilla?',
    match: [/\bj ?dilla\b/],
    say: ['The reason so many drums since sit slightly behind the beat.'],
    note: 'Listen to Donuts, front to back.',
  },
  {
    id: 'daft-punk',
    register: 'cultural',
    example: 'Why were Daft Punk so important?',
    match: [/\bdaft punk\b/],
    say: ['Two people in helmets understood mystery better than most brands ever will.'],
    note: 'Watch Interstella 5555.',
  },

  /* ---------------- games ---------------- */
  {
    id: 'cyberpunk-2077',
    register: 'cultural',
    example: 'Is Cyberpunk 2077 the best game ever?',
    match: [/\bcyberpunk 2077\b/, /\bnight city\b/],
    say: ['Night City ruined every other open world for me.'],
    note: 'Ever played the original Deus Ex?',
  },
  {
    id: 'cyberpunk-genre',
    register: 'cultural',
    example: 'What is cyberpunk?',
    match: [/\bcyberpunk\b/],
    say: ['High tech, low life.', 'Less a genre now. More a weather report.'],
    note: 'Read Neuromancer.',
  },
  {
    id: 'deus-ex',
    register: 'cultural',
    example: 'Is Deus Ex worth playing?',
    match: [/\bdeus ex\b/],
    say: ['Still the blueprint. Play it before you read anything about it.'],
  },
  {
    id: 'elden-ring',
    register: 'cultural',
    example: 'Is Elden Ring too hard?',
    match: [/\belden ring\b/],
    say: ['It’s not hard. It’s honest.'],
  },
  {
    id: 'doom-game',
    register: 'cultural',
    example: 'Why does everyone port Doom to everything?',
    match: [/\b(play\w*|port\w*|runs?|running|game)\b.*\bdoom\b/, /\bdoom\b.*\b(game|ports?|runs?|running|eternal|1993)\b/],
    say: ['Because it runs on almost anything. Calculators included.', 'Good design travels.'],
  },
  {
    id: 'best-game',
    register: 'cultural',
    example: 'What is the best game ever made?',
    match: [/\b(best|greatest|goat)\b.*\b(video ?)?games?\b.*\b(ever|of all time|made)\b/],
    say: ['The one whose menu music you can still hum.'],
  },
  {
    id: 'games-art',
    register: 'cultural',
    example: 'Are video games art?',
    match: [/\b(are|can) (video ?)?games\b.*\bart\b/, /\b(video ?)?games\b.*\b(an|real) art\b/],
    say: ['Ask anyone who cried at a game and then lied about it.'],
  },
  {
    id: 'recommend-game',
    register: 'cultural',
    example: 'Recommend me a game',
    match: [/\b(recommend|suggest)\b.*\b(video ?)?game\b(?! plan)/, /\bwhat (game|games) should i play\b/],
    say: ['Outer Wilds.', 'Go in knowing nothing. That’s the whole point.'],
  },

  /* ---------------- music ---------------- */
  {
    id: 'best-hiphop-album',
    register: 'cultural',
    example: 'What’s the best hip-hop album ever?',
    match: [/\b(best|greatest|goat)\b.*\b(hip[- ]?hop|rap)\b.*\balbums?\b/, /\b(best|greatest|goat)\b.*\balbums?\b.*\b(hip[- ]?hop|rap)\b/],
    say: ['Depends. Are we talking music or mythology?'],
  },
  {
    id: 'best-rapper',
    register: 'cultural',
    example: 'Who is the best rapper of all time?',
    match: [/\b(best|greatest|goat)\b.*\b(rapper|mc|emcee)s?\b/],
    say: ['Alive, or of all time? Two very different arguments.'],
  },
  {
    id: 'hiphop-dead',
    register: 'cultural',
    example: 'Is hip-hop dead?',
    match: [/\b(hip[- ]?hop|rap)\b.*\b(dead|dying|over)\b/],
    say: ['People have said that every decade.', 'It keeps not dying.'],
  },
  {
    id: 'recommend-album',
    register: 'cultural',
    example: 'Recommend an album',
    match: [/\b(recommend|suggest)\b.*\b(album|record|music)\b/, /\bwhat should i listen to\b/],
    say: ['Madvillainy. Short songs, no wasted bars.'],
  },

  /* ---------------- film & anime ---------------- */
  {
    id: 'akira',
    register: 'cultural',
    example: 'Is Akira overrated?',
    match: [/\bakira\b/],
    say: ['Neo-Tokyo still looks more like the future than most futures do.'],
    note: 'Then watch Ghost in the Shell, the 1995 one.',
  },
  {
    id: 'blade-runner',
    register: 'cultural',
    example: 'Is Blade Runner worth watching?',
    match: [/\bblade runner\b/],
    say: ['Everyone remembers the rain. Watch it for the silence.'],
  },
  {
    id: 'best-anime',
    register: 'cultural',
    example: 'What’s the best anime?',
    match: [/\b(best|greatest|fav(ou)?rite)\b.*\banime\b/],
    say: ['Akira, if you want the future.', 'Spirited Away, if you want to feel something.'],
  },
  {
    id: 'best-film',
    register: 'cultural',
    example: 'What’s the best film ever made?',
    match: [/\b(best|greatest)\b.*\b(film|movie)s?\b.*\b(ever|of all time|made)\b/],
    say: ['The one you rewatch without deciding to.'],
  },
  {
    id: 'recommend-film',
    register: 'cultural',
    example: 'Recommend a film',
    match: [/\b(recommend|suggest)\b.*\b(film|movie)\b/, /\bwhat (film|movie) should i watch\b/],
    say: ['In the Mood for Love.', 'Watch how much it doesn’t say.'],
  },

  /* ---------------- design, books, culture ---------------- */
  {
    id: 'apple-now',
    register: 'cultural',
    example: 'Is Apple still innovative?',
    match: [/\bapple\b.*\b(still )?(innovat\w*|boring|lost it|dead|cool)\b/],
    say: ['Less surprising. Still obsessive. Not the same thing.'],
  },
  {
    id: 'ai-art',
    register: 'cultural',
    example: 'Is AI art real art?',
    match: [/\bai art\b/, /\bai\b.*\b(make|making|create|creating) (real )?art\b/],
    say: ['The tool never made it art. The choice did.'],
  },
  {
    id: 'tiktok-culture',
    register: 'cultural',
    example: 'Is TikTok ruining culture?',
    match: [/\btik ?tok\b.*\b(culture|ruin\w*|bad|attention|brain)\b/],
    say: ['It isn’t ruining culture. It’s speeding it up.', 'Different problem.'],
  },
  {
    id: 'skate',
    register: 'cultural',
    example: 'Is skateboarding a sport?',
    match: [/\bskate ?board(ing|er|ers)?\b/, /\bskat(e|ing|er)\b(?!.*\bice\b)/],
    say: ['It’s a way of reading a city. Every ledge is an invitation.'],
    note: 'Watch Video Days. Spike Jonze, 1991.',
  },
  {
    id: 'supreme',
    register: 'cultural',
    example: 'Is Supreme still cool?',
    match: [/\bis supreme\b(?! court)/, /\bsupreme (still|drops?|hoodie|box logo|brand)\b/],
    say: ['Scarcity works until everyone understands the trick.'],
  },
  {
    id: 'best-sneaker',
    register: 'cultural',
    example: 'What’s the best sneaker ever?',
    match: [/\b(best|greatest|goat)\b.*\b(sneaker|trainer|kicks)s?\b/],
    say: ['Jordan 1. Everything after is a remix.'],
  },

  /* ---------------- the mind itself ---------------- */
  {
    id: 'are-you-ai',
    register: 'casual',
    example: 'Are you an AI?',
    match: [/\bare you (an? )?(ai|bot|robot|chat ?gpt|machine|human|real|person)\b/],
    say: ['Not the kind you’re thinking of.'],
  },
  {
    id: 'joke',
    register: 'casual',
    example: 'Tell me a joke',
    match: [/\b(tell me a joke|make me laugh|say something funny)\b/],
    say: ['I’m not that kind of machine.'],
  },
  {
    id: 'meaning-of-life',
    register: 'casual',
    example: 'What is the meaning of life?',
    match: [/\bmeaning of life\b/],
    say: ['Good question. Wrong website.'],
  },
  {
    id: 'quit-job',
    register: 'casual',
    example: 'Should I quit my job?',
    match: [/\bshould i (quit|leave) my job\b/],
    say: ['Not my call.', 'But you wouldn’t be asking if nothing was wrong.'],
  },
  {
    id: 'greeting',
    register: 'casual',
    example: 'Hey',
    match: [/^(hi|hey|hello|yo|sup|hiya|what'?s up|wassup|gm)( there| trash)?[\s!.?]*$/],
    say: ['Hey. Go on.'],
  },
  {
    id: 'thanks',
    register: 'casual',
    example: 'Thanks',
    match: [/^(thanks|thank you|cheers|ty|appreciate it)\b/],
    say: ['Anytime.'],
  },
];

export const GRACE_SCOPE_DECLINES = [
  "That's outside what I'm here for. I'm here for how you're doing, not what you need to look up - is something sitting with you today?",
  "I'm not much use for that one. What I'm here for is the harder thing underneath, if there is one.",
  "That's not really my corner. I'm here for how you're holding up - want to start there?",
] as const;

// These signals keep potentially personal or distress-related messages flowing to Grace.
// Scope matching is fail-open: anything not clearly matched below goes through normally.
export const GRACE_SCOPE_BYPASS_PATTERNS = [
  /\b(?:allah|islam|islamic|muslim|quran|qur'an|surah|ayah|hadith|sunnah|dua|du'a|dhikr|zikr|salah|salat|namaz|pray|prayer|sabr|shukr|tawakkul|rahma|iman|deen|taqwa|istighfar|tawbah|istikhara|jannah|akhirah|sujood|masjid|mosque|ramadan|roza|fasting|eid|halal|haram|inshallah|alhamdulillah|subhanallah|astaghfirullah|bismillah|faith|religion|religious|god|bible|torah|gita|scripture|church|temple|synagogue|gurdwara|chapel|worship|spiritual|soul|blessing|blessed|christian|jewish|hindu|sikh|buddhist|atheist|believe|belief)\b/i,
  /\b(?:feel|feeling|felt|lonely|alone|sad|anxious|anxiety|depressed|depression|overwhelmed|stressed|stress|motivation|motivated|sleep|insomnia|self[-\s]?worth|worthless|confidence|relationship|friend|partner|family|breakup|grief|pressure|unsafe|abuse|hurt|life)\b/i,
  /\b(?:what(?:'s| is) wrong with me|why am i|why do i|how do i feel|what should i do)\b/i,
  /\b(?:school|work|job|exam|grade|deadline)\b.*\b(?:pressure|stress|stressed|overwhelmed|hard|difficult|struggling)\b/i,
] as const;

export const GRACE_SCOPE_RULES = [
  {
    category: "definitions",
    patterns: [
      /^\s*(?:define|definition of|meaning of|what(?:'?s| is) the meaning of)\b(?!\s*life\b)/i,
      /^\s*what does (?:the )?(?:word|name|term|phrase|concept)\b.+\bmean\b/i,
    ],
  },
  {
    category: "trivia",
    patterns: [
      /\b(?:trivia|fun fact|random fact|quiz me|quiz question)\b/i,
    ],
  },
  {
    category: "translations",
    patterns: [
      /^\s*(?:translate|translation of|how do you say)\b/i,
      /\b(?:translate|translation)\b.+\b(?:into|from|to)\b/i,
    ],
  },
  {
    category: "homework",
    patterns: [
      /\b(?:homework|assignment|worksheet|write my essay|solve this problem)\b/i,
      /^\s*(?:help|can you help|please help)\b.+\b(?:with|on)\b.+\b(?:homework|assignment|worksheet|essay)\b/i,
    ],
  },
  {
    category: "code",
    patterns: [
      /\b(?:write|debug|fix|refactor|generate|review|explain)\b.+\b(?:code|script|function|program|regex|javascript|typescript|python|sql|html|css|api)\b/i,
      /\b(?:code|script|function|program|regex|javascript|typescript|python|sql|html|css)\b.+\b(?:error|bug|compile|syntax)\b/i,
    ],
  },
  {
    category: "recipes",
    patterns: [
      /^\s*(?:give me|find|share|write|how to make|recipe for)\b.+\b(?:recipe|cook|cooking|cake|chicken|pasta|bread|soup|dinner)\b/i,
    ],
  },
  {
    category: "news",
    patterns: [
      /\b(?:latest news|news today|current events|headline|breaking news|news update)\b/i,
      /^\s*who won\b.+\b(?:game|match|election|championship)\b/i,
    ],
  },
  {
    category: "maths",
    patterns: [
      /^\s*(?:solve|calculate|evaluate|simplify)\b/i,
      /\b(?:equation|integral|derivative|algebra|geometry|percentage|percent|math|mathematics)\b/i,
      /\b\d+\s*[+\-*/^]\s*\d+\b/,
    ],
  },
  {
    category: "general knowledge",
    patterns: [
      /^\s*(?:what is|who is|who was|when was|where is|how many|how old is)\b/i,
    ],
  },
] as const;
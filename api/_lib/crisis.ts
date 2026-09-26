const CRISIS_SIGNAL_PATTERNS = [
  /\b(?:self[-\s]?harm(?:ing)?|harm myself|hurt myself|cut myself|cutting myself|injure myself)\b/i,
  /\b(?:suicid(?:e|al)|kill(?:ing)? myself|end(?:ing)? my life|end(?:ing)? it all|take my own life|ending things|take my own life|want(?: to| na|na) die|wanna die|wish i (?:was|were) dead|wish i (?:was ?n'?t|were ?n'?t) here|better off dead|better off without me|no reason to live|no point (?:in )?living|do ?n'?t want to (?:live|be alive|be here|exist|wake up)|do not want to (?:live|be alive|be here|exist|wake up)|ca ?n'?t go on|cannot go on|not want to be alive|overdos(?:e|ing)|kill me|hurt myself|self destruct|give up on life|disappear forever|not be here anymore|stop existing|go to sleep and not wake up)\b/i,
  /\b(?:abuse|abused|abuser|domestic violence|sexual assault|sexual abuse|rape|raped|molest(?:ed)?|hit me|hurt me|unsafe at home)\b/i,
];

export function hasCrisisSignal(message: string): boolean {
  return CRISIS_SIGNAL_PATTERNS.some((pattern) => pattern.test(message));
}

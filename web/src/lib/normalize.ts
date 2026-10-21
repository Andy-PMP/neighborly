// Guess normalization: case-insensitive, and simple plurals/inflections of the target count as correct.

/** Lowercase, trim, keep letters only. Returns "" when nothing usable is left. */
export function normalize(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z]/g, "");
}

// Irregular form -> base form. Covers targets in data/ where regular rules fail.
const IRREGULAR: Record<string, string> = {
  mice: "mouse",
  teeth: "tooth",
  feet: "foot",
  men: "man",
  women: "woman",
  geese: "goose",
  children: "child",
  knives: "knife",
  leaves: "leaf",
  wolves: "wolf",
  shelves: "shelf",
  thieves: "thief",
  ran: "run",
  sang: "sing",
  sung: "sing",
  swam: "swim",
  swum: "swim",
  flew: "fly",
  flown: "fly",
  froze: "freeze",
  frozen: "freeze",
  stole: "steal",
  stolen: "steal",
  dug: "dig",
  hid: "hide",
  hidden: "hide",
  drove: "drive",
  driven: "drive",
  built: "build",
  taught: "teach",
  wrote: "write",
  written: "write",
  forgot: "forget",
  forgotten: "forget",
  breathed: "breathe",
};

const VOWELS = new Set("aeiou");

/** Regular inflected forms of a base word: plural/3rd person, past, -ing. */
export function inflections(base: string): Set<string> {
  const forms = new Set([base]);
  const last = base.at(-1) ?? "";
  const prev = base.at(-2) ?? "";

  // plural / third person
  if (/(s|x|z|ch|sh)$/.test(base)) forms.add(base + "es");
  else if (last === "y" && !VOWELS.has(prev)) forms.add(base.slice(0, -1) + "ies");
  else forms.add(base + "s");

  // past tense and -ing
  if (last === "e") {
    forms.add(base + "d");
    forms.add(base.slice(0, -1) + "ing");
  } else if (last === "y" && !VOWELS.has(prev)) {
    forms.add(base.slice(0, -1) + "ied");
    forms.add(base + "ing");
  } else {
    forms.add(base + "ed");
    forms.add(base + "ing");
    // short consonant-vowel-consonant words double the final consonant: dig -> digging
    if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(base)) {
      forms.add(base + last + "ed");
      forms.add(base + last + "ing");
    }
  }
  return forms;
}

/** True if the guess is the target or one of its plural/inflected forms. */
export function isCorrect(rawGuess: string, target: string): boolean {
  const guess = normalize(rawGuess);
  if (!guess) return false;
  if (guess === target) return true;
  if (IRREGULAR[guess] === target || IRREGULAR[target] === guess) return true;
  return inflections(target).has(guess);
}

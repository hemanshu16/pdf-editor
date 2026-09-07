export interface PatternMatch {
  label: string;
  start: number;
  end: number;
  sample: string;
}

function luhnValid(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

const PATTERNS: { label: string; re: RegExp; validate?: (m: string) => boolean }[] = [
  { label: 'email', re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  { label: 'SSN', re: /\b\d{3}-\d{2}-\d{4}\b/g },
  {
    label: 'phone',
    re: /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g,
  },
  {
    label: 'card number',
    re: /\b(?:\d[ -]?){13,16}\b/g,
    validate: (m) => luhnValid(m.replace(/[ -]/g, '')),
  },
];

/** Finds sensitive-looking substrings in a line of extracted PDF text. */
export function findSensitiveSpans(text: string): PatternMatch[] {
  const matches: PatternMatch[] = [];
  for (const { label, re, validate } of PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const sample = m[0];
      if (!validate || validate(sample)) {
        matches.push({ label, start: m.index, end: m.index + sample.length, sample });
      }
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }
  matches.sort((a, b) => a.start - b.start);
  return matches;
}

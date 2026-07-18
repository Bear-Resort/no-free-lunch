/* Emphasis markup for dialogue: wrap words in *asterisks* and they land
   gold, oversized, with a pop — Undertale-style punctuation for the ear
   and the eye. The parser strips the asterisks; the typewriter reveals
   plain characters with their emphasis flags. */

export interface EmChar {
  ch: string;
  em: boolean;
}

export function parseEm(text: string): EmChar[] {
  const out: EmChar[] = [];
  let em = false;
  for (const ch of text) {
    if (ch === "*") {
      em = !em;
      continue;
    }
    out.push({ ch, em });
  }
  return out;
}

/** True when this reveal index just entered an emphasized run. */
export function emStartsAt(chars: EmChar[], shown: number): boolean {
  const c = chars[shown - 1];
  if (!c?.em) return false;
  return shown === 1 || !chars[shown - 2].em;
}

export function EmText({ chars, shown }: { chars: EmChar[]; shown: number }) {
  const runs: { text: string; em: boolean }[] = [];
  for (let i = 0; i < Math.min(shown, chars.length); i++) {
    const c = chars[i];
    const last = runs[runs.length - 1];
    if (last && last.em === c.em) last.text += c.ch;
    else runs.push({ text: c.ch, em: c.em });
  }
  return (
    <>
      {runs.map((r, i) =>
        r.em ? (
          <span key={i} className="story-em">
            {r.text}
          </span>
        ) : (
          <span key={i}>{r.text}</span>
        ),
      )}
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import { sfx } from "@/lib/sound";
import { WatchingEyes } from "./Ambience";
import { EmText, emStartsAt, parseEm } from "./EmText";

export interface StoryBeat {
  img?: string;
  speaker?: string;
  text: string;
}

/**
 * Centered, unmissable story panel — pixel frame, typewriter text.
 * Click: finish typing → next beat → onDone. Nothing else is clickable.
 */
export function StoryOverlay({
  beats,
  onDone,
  onSkip,
  onBeat,
  skipLabel = "skip deposition",
}: {
  beats: StoryBeat[];
  onDone: () => void;
  onSkip?: () => void;
  /** Fires when a beat becomes current (including the first). */
  onBeat?: (index: number) => void;
  skipLabel?: string;
}) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const [imgOk, setImgOk] = useState(true);
  const beat = beats[i];
  const chars = useMemo(() => parseEm(beat.text), [beat.text]);
  const complete = shown >= chars.length;

  useEffect(() => {
    setShown(0);
    setImgOk(true);
  }, [i]);

  useEffect(() => {
    onBeat?.(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  useEffect(() => {
    if (complete) return;
    const t = setInterval(() => setShown((n) => n + 1), 26);
    return () => clearInterval(t);
  }, [complete, i]);

  // Each speaker gets a voice; emphasized words land with a thud.
  useEffect(() => {
    if (shown === 0 || complete) return;
    const c = chars[shown - 1];
    if (!c) return;
    if (emStartsAt(chars, shown)) {
      sfx.drill();
      return;
    }
    const pitch =
      (beat.speaker === "JAMES" || beat.speaker === "THE STUDENT"
        ? 430
        : beat.speaker
          ? 220
          : 300) + (c.em ? 90 : 0);
    if (c.ch !== " " && shown % 2 === 0) sfx.blip(pitch);
  }, [shown, complete, beat, chars]);

  const advance = () => {
    if (!complete) setShown(chars.length);
    else if (i < beats.length - 1) setI(i + 1);
    else onDone();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={advance}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") advance();
      }}
      className="fixed inset-0 z-[80] flex cursor-pointer flex-col items-center justify-center bg-black/90 p-6 outline-none backdrop-blur-sm animate-in fade-in duration-500"
    >
      <WatchingEyes
        size={20}
        className="absolute left-1/2 top-[10%] -translate-x-1/2 opacity-25"
      />
      <div className="relative w-[min(92vw,540px)] border-2 border-ink bg-[#0d100a] px-6 py-6 text-left shadow-[0_0_0_4px_#0d100a,0_0_60px_rgba(227,161,62,0.15)]">
        {onSkip && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSkip();
            }}
            className="absolute right-3 top-3 border border-ink-muted/40 px-2 py-0.5 font-pixel text-sm uppercase leading-none text-ink-muted transition-colors hover:border-gold hover:text-gold"
          >
            {skipLabel}
          </button>
        )}
        {beat.speaker && (
          <span className="absolute -top-3 left-4 bg-[#0d100a] px-2 font-pixel text-base leading-none text-gold">
            {beat.speaker}
          </span>
        )}
        {beat.img && imgOk && (
          <img
            src={beat.img}
            alt=""
            onError={() => setImgOk(false)}
            className="mx-auto mb-4 max-h-52 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.8)]"
          />
        )}
        <div className="font-pixel text-2xl leading-tight text-ink">
          <EmText chars={chars} shown={shown} />
          {complete && <span className="caret-blink text-gold">▏</span>}
        </div>
        <div className="mt-4 text-right font-pixel text-sm text-ink-muted">
          {i < beats.length - 1 || !complete ? "click ▼" : "click to continue"}
        </div>
      </div>
    </div>
  );
}

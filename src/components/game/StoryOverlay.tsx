import { useEffect, useState } from "react";
import { sfx } from "@/lib/sound";

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
}: {
  beats: StoryBeat[];
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const [imgOk, setImgOk] = useState(true);
  const beat = beats[i];
  const complete = shown >= beat.text.length;

  useEffect(() => {
    setShown(0);
    setImgOk(true);
  }, [i]);

  useEffect(() => {
    if (complete) return;
    const t = setInterval(() => setShown((n) => n + 1), 26);
    return () => clearInterval(t);
  }, [complete, i]);

  // Each speaker gets a voice: the student chirps, the thing rumbles.
  useEffect(() => {
    if (shown === 0 || complete) return;
    const ch = beat.text[shown - 1];
    const pitch =
      beat.speaker === "THE STUDENT" ? 430 : beat.speaker ? 220 : 300;
    if (ch !== " " && shown % 2 === 0) sfx.blip(pitch);
  }, [shown, complete, beat]);

  const advance = () => {
    if (!complete) setShown(beat.text.length);
    else if (i < beats.length - 1) setI(i + 1);
    else onDone();
  };

  return (
    <button
      onClick={advance}
      className="fixed inset-0 z-[80] flex cursor-pointer flex-col items-center justify-center bg-black/90 p-6 outline-none backdrop-blur-sm animate-in fade-in duration-500"
    >
      <div className="relative w-[min(92vw,540px)] border-2 border-ink bg-[#0d100a] px-6 py-6 text-left shadow-[0_0_0_4px_#0d100a,0_0_60px_rgba(227,161,62,0.15)]">
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
          {beat.text.slice(0, shown)}
          {complete && <span className="caret-blink text-gold">▏</span>}
        </div>
        <div className="mt-4 text-right font-pixel text-sm text-ink-muted">
          {i < beats.length - 1 || !complete ? "click ▼" : "click to continue"}
        </div>
      </div>
    </button>
  );
}

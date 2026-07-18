import { useEffect, useState } from "react";
import { sfx } from "@/lib/sound";
import { WatchingEyes } from "./Ambience";

/**
 * Inscryption-style pixel dialogue box. Types the line out; click once to
 * finish typing, click again to dismiss. Auto-dismisses after a while.
 */
export function PixelDialog({
  speaker,
  text,
  onDismiss,
  placement = "bottom",
  pitch,
}: {
  speaker: string;
  text: string;
  onDismiss: () => void;
  placement?: "top" | "bottom";
  /** Voice pitch for the per-letter blip. */
  pitch?: number;
}) {
  const [shown, setShown] = useState(0);
  const complete = shown >= text.length;

  useEffect(() => {
    setShown(0);
  }, [text]);

  useEffect(() => {
    if (complete) return;
    const t = setInterval(() => setShown((n) => n + 1), 24);
    return () => clearInterval(t);
  }, [complete, text]);

  // The voice: a blip for (almost) every letter.
  useEffect(() => {
    if (shown === 0 || complete) return;
    const ch = text[shown - 1];
    if (ch !== " " && shown % 2 === 0) sfx.blip(pitch);
  }, [shown, complete, text, pitch]);

  // Linger, then leave on its own.
  useEffect(() => {
    if (!complete) return;
    const t = setTimeout(onDismiss, 9000);
    return () => clearTimeout(t);
  }, [complete, onDismiss]);

  return (
    <>
      {/* something in the room leans closer while it speaks */}
      <span className="pointer-events-none fixed left-1/2 top-[36%] z-[35] -translate-x-1/2 opacity-15 animate-in fade-in duration-1000">
        <WatchingEyes size={26} />
      </span>
      <button
      onClick={() => (complete ? onDismiss() : setShown(text.length))}
      className={
        "fixed left-1/2 z-40 w-[min(92vw,620px)] -translate-x-1/2 rounded-none border-2 border-ink bg-[#0d100a] px-5 py-3.5 text-left shadow-[0_0_0_4px_#0d100a,0_10px_40px_rgba(0,0,0,0.8)] outline-none animate-in fade-in duration-300 " +
        (placement === "top"
          ? "top-16 slide-in-from-top-3"
          : "bottom-5 slide-in-from-bottom-3")
      }
    >
      <span className="absolute -top-3 left-4 bg-[#0d100a] px-2 font-pixel text-base leading-none text-gold">
        {speaker}
      </span>
      <span className="font-pixel text-2xl leading-tight text-ink">
        {text.slice(0, shown)}
        {complete && <span className="caret-blink text-gold">▏</span>}
      </span>
      </button>
    </>
  );
}

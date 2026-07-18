import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Short ceremony: coin spins, then reveals Red or Blue for this player. */
export function CoinFlipOverlay({
  seat,
  onDone,
}: {
  seat: "red" | "black";
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"spin" | "reveal">("spin");

  useEffect(() => {
    const reveal = window.setTimeout(() => setPhase("reveal"), 1600);
    const done = window.setTimeout(onDone, 3200);
    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(done);
    };
  }, [onDone]);

  const label = seat === "red" ? "RED" : "BLUE";
  const color = seat === "red" ? "text-[#cf4631]" : "text-[#5b82c0]";

  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-6 bg-black/85 p-6 backdrop-blur-md">
      <div className="font-mono text-xs uppercase tracking-[0.35em] text-ink-muted">
        Codex flips the coin
      </div>

      <div
        className={cn(
          "relative flex size-28 items-center justify-center rounded-full border-4 border-gold bg-[#f8edcf] shadow-[0_0_40px_rgba(227,161,62,0.45)]",
          phase === "spin" && "animate-[spin_0.35s_linear_infinite]",
        )}
      >
        <span
          className={cn(
            "font-display text-3xl font-bold tracking-widest",
            phase === "spin" ? "text-gold" : color,
          )}
        >
          {phase === "spin" ? "?" : label[0]}
        </span>
      </div>

      {phase === "reveal" ? (
        <div className="animate-in fade-in zoom-in-95 text-center duration-300">
          <div className={cn("font-display text-4xl font-bold tracking-[0.2em]", color)}>
            You are {label}
          </div>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
            {seat === "red" ? "You pin first" : "You answer after Red"}
          </p>
        </div>
      ) : (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
          Spinning…
        </p>
      )}
    </div>
  );
}

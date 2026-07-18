import { useState } from "react";
import { Paperclip } from "lucide-react";
import type { Game } from "@engine/rules";
import { revealedCount } from "@engine/rules";
import { MapLightbox, MiniGrid } from "./MiniGrid";
import { cn } from "@/lib/utils";

const TILTS = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3", "-rotate-2"];

/** The case file: revealed maps as exhibit cards, future maps sealed. */
export function MapTimeline({ game }: { game: Game }) {
  const revealed = revealedCount(game);
  const [zoom, setZoom] = useState<number | null>(null);
  return (
    <div className="relative overflow-hidden rounded-md border border-edge bg-[#d7b46e]/55 p-3 shadow-sm">
      <div className="absolute inset-0 opacity-35 [background-image:repeating-linear-gradient(4deg,rgba(42,33,24,.08)_0_1px,transparent_1px_13px)]" />
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4a3f2c]">
        <Paperclip className="size-3" />
        Codex folder · forbidden exhibits
      </div>
      <div className="relative mt-3 flex min-h-[118px] flex-wrap items-start gap-3">
        {game.variant.revealAfter.map((after, i) =>
          i < revealed ? (
            <div
              key={i}
              onDoubleClick={() => setZoom(i)}
              title="double-click to inspect"
              className={cn(
                "relative cursor-zoom-in rounded-sm border border-ink/20 bg-[#f8edcf] p-2 shadow-[0_5px_12px_rgba(58,44,26,0.28)] animate-in fade-in zoom-in-95 duration-300",
                TILTS[i % TILTS.length],
              )}
            >
              <span className="absolute -top-2 left-1/2 h-4 w-9 -translate-x-1/2 rotate-2 bg-[#e7d7a9]/80 shadow-sm" />
              <MiniGrid bb={game.maps[i]} cellSize={7} activeClass="bg-ink/85" />
              <div className="mt-1 text-center font-mono text-[10px] font-semibold uppercase text-[#5c5140]">
                Exhibit M{i + 1}
              </div>
            </div>
          ) : (
            <div
              key={i}
              className={cn(
                "relative flex min-h-[86px] w-[72px] flex-col items-center justify-center gap-1 rounded-sm border-2 border-dashed border-danger/45 bg-[#f8edcf]/55 p-2 shadow-sm",
                TILTS[(i + 2) % TILTS.length],
              )}
            >
              <span className="absolute -top-1 right-2 h-4 w-7 -rotate-6 bg-[#e7d7a9]/70" />
              <span className="rotate-[-8deg] border-2 border-danger/70 px-1 font-display text-[9px] font-bold uppercase tracking-widest text-danger/80">
                Sealed
              </span>
              <span className="font-mono text-[9px] uppercase text-[#5c5140]">
                opens t{after}
              </span>
            </div>
          ),
        )}
      </div>
      {zoom !== null && (
        <MapLightbox
          bb={game.maps[zoom]}
          label={`Exhibit M${zoom + 1}`}
          onClose={() => setZoom(null)}
        />
      )}
    </div>
  );
}

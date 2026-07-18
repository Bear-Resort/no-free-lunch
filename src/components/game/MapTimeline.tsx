import { useState } from "react";
import { Paperclip } from "lucide-react";
import type { Game } from "@engine/rules";
import { revealedCount } from "@engine/rules";
import { MapLightbox, MiniGrid } from "./MiniGrid";
import { cn } from "@/lib/utils";

const TILTS = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3", "-rotate-2"];

/** The case file: revealed maps as exhibit cards, future maps sealed. */
export function MapTimeline({
  game,
  highlightCell = null,
}: {
  game: Game;
  /** Sync with GameBoard hover — same cell index lights up on each exhibit. */
  highlightCell?: number | null;
}) {
  const revealed = revealedCount(game);
  const [zoom, setZoom] = useState<number | null>(null);
  return (
    <div className="relative overflow-hidden rounded-md border border-edge bg-[#d7b46e]/55 p-2.5 shadow-sm">
      <div className="absolute inset-0 opacity-35 [background-image:repeating-linear-gradient(4deg,rgba(42,33,24,.08)_0_1px,transparent_1px_13px)]" />
      <div className="relative flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4a3f2c]">
        <Paperclip className="size-3" />
        Codex folder · forbidden exhibits
      </div>
      {/* Fixed 3 columns → at most two rows for 5 exhibits. */}
      <div className="relative mt-2 grid grid-cols-3 gap-2">
        {game.variant.revealAfter.map((after, i) =>
          i < revealed ? (
            <button
              type="button"
              key={i}
              onClick={() => setZoom(i)}
              title="click to inspect"
              className={cn(
                "relative flex w-full cursor-zoom-in flex-col items-center rounded-sm border border-ink/20 bg-[#f8edcf] p-1.5 shadow-[0_4px_10px_rgba(58,44,26,0.28)] animate-in fade-in zoom-in-95 duration-300",
                TILTS[i % TILTS.length],
              )}
            >
              <span className="absolute -top-1.5 left-1/2 h-3 w-7 -translate-x-1/2 rotate-2 bg-[#e7d7a9]/80 shadow-sm" />
              <MiniGrid
                bb={game.maps[i]}
                cellSize={7}
                clear
                activeClass="bg-ink"
                highlightCell={highlightCell}
                highlightKind={
                  highlightCell === null || game.cells[highlightCell] === 0
                    ? "prospect"
                    : game.cells[highlightCell] === 1
                      ? "drilled-red"
                      : "drilled-black"
                }
              />
              <div className="mt-1 text-center font-mono text-[9px] font-semibold uppercase leading-none text-[#5c5140]">
                M{i + 1}
              </div>
            </button>
          ) : (
            <div
              key={i}
              className={cn(
                "relative flex aspect-square w-full flex-col items-center justify-center gap-0.5 rounded-sm border-2 border-dashed border-danger/45 bg-[#f8edcf]/55 p-1.5 shadow-sm",
                TILTS[(i + 2) % TILTS.length],
              )}
            >
              <span className="absolute -top-1 right-1.5 h-3 w-5 -rotate-6 bg-[#e7d7a9]/70" />
              <span className="rotate-[-8deg] border border-danger/70 px-0.5 font-display text-[8px] font-bold uppercase tracking-widest text-danger/80">
                Sealed
              </span>
              <span className="font-mono text-[8px] uppercase text-[#5c5140]">
                t{after}
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

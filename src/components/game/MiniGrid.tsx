import type { CSSProperties } from "react";
import { CELLS, bbGet, type BB } from "@engine/bitboard";
import { cn } from "@/lib/utils";

const JITTER = [-3, 2, -1, 3, 1, -2, 2, -3, 1];

/** Full-screen magnified view of one map. Click anywhere to put it down. */
export function MapLightbox({
  bb,
  label,
  onClose,
  activeClass = "bg-ink/85",
}: {
  bb: BB;
  label: string;
  onClose: () => void;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClose}
      className="fixed inset-0 z-[75] flex cursor-pointer items-center justify-center bg-black/80 p-6 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="rotate-[-1deg] rounded-sm border border-ink/20 bg-[#f8edcf] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.8)]">
        <MiniGrid bb={bb} cellSize={34} activeClass={activeClass} />
        <div className="mt-3 text-center font-mono text-sm font-bold uppercase tracking-[0.15em] text-[#5c5140]">
          {label}
        </div>
        <div className="mt-0.5 text-center font-mono text-[10px] uppercase text-[#8a7b5e]">
          click to put it down
        </div>
      </div>
    </button>
  );
}

/** Tiny 9×9 preview of a bitboard — used for maps, intermediates, previews. */
export function MiniGrid({
  bb,
  cellSize = 5,
  activeClass = "bg-accent",
  className,
  highlightCell = null,
  /** How to paint the synced hover cell. */
  highlightKind = "prospect",
  /** High-contrast gutters + fuller marks — better at small sizes. */
  clear = false,
}: {
  bb: BB;
  cellSize?: number;
  activeClass?: string;
  className?: string;
  /** Board cell index (0–80) to ring — e.g. sync with GameBoard hover. */
  highlightCell?: number | null;
  highlightKind?: "prospect" | "drilled-red" | "drilled-black";
  clear?: boolean;
}) {
  const highlightClass =
    highlightKind === "drilled-red"
      ? clear
        ? "z-[1] scale-110 bg-[rgba(207,70,49,0.85)] ring-1 ring-inset ring-[#f2a091] animate-in zoom-in-75 duration-200"
        : "z-[1] scale-110 border-[#cf4631] bg-[rgba(207,70,49,0.55)] shadow-[0_0_0_1px_rgba(242,160,145,0.95)] animate-in zoom-in-75 duration-200"
      : highlightKind === "drilled-black"
        ? clear
          ? "z-[1] scale-110 bg-[rgba(91,130,192,0.85)] ring-1 ring-inset ring-[#9db8e8] animate-in zoom-in-75 duration-200"
          : "z-[1] scale-110 border-[#5b82c0] bg-[rgba(91,130,192,0.55)] shadow-[0_0_0_1px_rgba(157,184,232,0.95)] animate-in zoom-in-75 duration-200"
        : clear
          ? "z-[1] scale-110 bg-[rgba(227,161,62,0.8)] ring-1 ring-inset ring-gold animate-in zoom-in-75 duration-200"
          : "z-[1] scale-110 border-gold bg-[rgba(227,161,62,0.5)] shadow-[0_0_0_1px_rgba(227,161,62,0.95)] animate-in zoom-in-75 duration-200";

  return (
    <div
      className={cn(
        "grid w-fit grid-cols-9 rounded-sm shadow-[inset_0_0_10px_rgba(42,33,24,0.12)]",
        clear
          ? "gap-px border-2 border-ink/70 bg-ink/65 p-0.5"
          : "gap-px border-2 border-ink/55 bg-[#f6edcf] p-1.5",
        className,
      )}
    >
      {Array.from({ length: CELLS }, (_, c) => (
        <div
          key={c}
          style={{ width: cellSize, height: cellSize }}
          className={cn(
            "relative transition-all duration-200 ease-out",
            clear
              ? "bg-[#f8edcf]"
              : "border border-ink/35 bg-[#fff7de]/35",
            highlightCell === c && highlightClass,
          )}
        >
          {bbGet(bb, c) && (
            <span
              style={
                {
                  transform: `rotate(${JITTER[c % JITTER.length]}deg) scale(${
                    c % 4 === 0 ? 0.9 : 1
                  })`,
                } as CSSProperties
              }
              className={cn(
                "absolute rounded-[1px] shadow-[0_0_0_1px_rgba(42,33,24,0.35)]",
                clear ? "inset-[10%]" : "inset-[18%]",
                activeClass,
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

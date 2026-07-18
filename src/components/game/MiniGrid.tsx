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
}: {
  bb: BB;
  cellSize?: number;
  activeClass?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid w-fit grid-cols-9 gap-px rounded-sm border border-ink/25 bg-[#f6edcf] p-1 shadow-[inset_0_0_10px_rgba(42,33,24,0.12)]",
        className,
      )}
    >
      {Array.from({ length: CELLS }, (_, c) => (
        <div
          key={c}
          style={{ width: cellSize, height: cellSize }}
          className="relative border border-ink/10 bg-[#fff7de]/35"
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
                "absolute inset-[18%] rounded-[1px] shadow-[0_0_0_1px_rgba(42,33,24,0.2)]",
                activeClass,
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

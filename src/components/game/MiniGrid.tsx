import type { CSSProperties } from "react";
import { CELLS, bbGet, type BB } from "@engine/bitboard";
import { cn } from "@/lib/utils";

const JITTER = [-3, 2, -1, 3, 1, -2, 2, -3, 1];

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

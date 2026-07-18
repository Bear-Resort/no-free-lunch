import { useState, type CSSProperties, type MouseEvent } from "react";
import { CELLS, bbGet } from "@engine/bitboard";
import type { Game, Seat } from "@engine/rules";
import { cn } from "@/lib/utils";

/** Outward offsets for the 8 ember-burst particles. */
const SPARKS = [
  { dx: "0px", dy: "-26px" },
  { dx: "20px", dy: "-18px" },
  { dx: "26px", dy: "0px" },
  { dx: "19px", dy: "20px" },
  { dx: "0px", dy: "26px" },
  { dx: "-20px", dy: "19px" },
  { dx: "-26px", dy: "0px" },
  { dx: "-18px", dy: "-21px" },
];

const PIN_GRADIENT: Record<Seat, string> = {
  red: "radial-gradient(circle at 32% 30%, #f2a091, #cf4631 46%, #6e1a10 100%)",
  black: "radial-gradient(circle at 32% 30%, #9db8e8, #5b82c0 46%, #1c3766 100%)",
};

const STRING_COLOR: Record<Seat, { line: string; knot: string }> = {
  red: { line: "#c03b2d", knot: "#8e2418" },
  black: { line: "#4f74b8", knot: "#2c4a7e" },
};

/** A pushpin: elliptical ground shadow, stem, glossy head. */
export function Pin({ seat, className }: { seat: Seat; className?: string }) {
  return (
    <span aria-hidden className={cn("relative block", className)}>
      <span className="absolute left-1/2 top-[72%] h-[30%] w-[85%] -translate-x-[38%] rounded-full bg-black/45 blur-[1.5px]" />
      <span className="absolute left-1/2 top-[54%] h-[34%] w-[12%] -translate-x-1/2 rounded-sm bg-[#3d3226] shadow-[0.5px_0_0_rgba(0,0,0,0.5)]" />
      <span
        style={{ background: PIN_GRADIENT[seat] }}
        className="absolute inset-x-0 top-0 aspect-square rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.65)] ring-1 ring-black/50"
      />
    </span>
  );
}

/** Opponent / Assayer hand: a brief boss gesture on their last pin. */
function PinHand({
  seat,
  className,
}: {
  seat: Seat;
  className?: string;
}) {
  const fill = seat === "red" ? "#f2a091" : "#9db8e8";
  const crease = seat === "red" ? "#8e2418" : "#2a4c86";
  const highlight = seat === "red" ? "#f8d0c8" : "#dbe8ff";
  const outline = seat === "red" ? "#3a120c" : "#071225";
  return (
    <span aria-hidden className={cn("pointer-events-none absolute block", className)}>
      <svg
        viewBox="0 0 56 64"
        className="h-full w-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.85)]"
      >
        <path
          d="M30 3 C35 3 38 7 38 13 L38 30 L42 26 C46 22 52 25 51 31 L49 43 C48 55 40 61 29 61 L22 61 C11 61 5 55 5 44 L5 35 C5 29 12 27 16 31 L19 34 L19 13 C19 7 24 3 30 3 Z"
          fill={fill}
          stroke={outline}
          strokeWidth="2.6"
        />
        <path
          d="M29 7 L29 37 M19 35 C24 39 31 39 38 35 M13 36 C16 43 21 47 28 48"
          fill="none"
          stroke={crease}
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M35 10 C36 16 36 23 35 30"
          fill="none"
          stroke={highlight}
          strokeLinecap="round"
          strokeWidth="2"
          opacity="0.75"
        />
      </svg>
    </span>
  );
}

/** Center of a cell in 0–100 board coordinates. */
const cx = (cell: number) => ((cell % 9) + 0.5) * (100 / 9);
const cy = (cell: number) => (Math.floor(cell / 9) + 0.5) * (100 / 9);

const THICK = 20; // painted slab thickness in px

function StringTrail({ trail, seat }: { trail: number[]; seat: Seat }) {
  if (trail.length === 0) return null;
  const { line, knot } = STRING_COLOR[seat];
  return (
    <>
      {trail.slice(1).map((cell, i) => {
        const from = trail[i];
        const x1 = cx(from);
        const y1 = cy(from);
        const x2 = cx(cell);
        const y2 = cy(cell);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2 + 3.2; // twine sag
        return (
          <g key={`${from}-${cell}`}>
            <path
              d={`M ${x1} ${y1 + 0.5} Q ${mx} ${my + 0.6} ${x2} ${y2 + 0.5}`}
              fill="none"
              stroke="rgba(0,0,0,0.45)"
              strokeWidth="0.9"
            />
            <path
              d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
              fill="none"
              stroke={line}
              strokeWidth="0.7"
            />
          </g>
        );
      })}
      {trail.map((cell) => (
        <circle key={cell} cx={cx(cell)} cy={cy(cell)} r="0.9" fill={knot} />
      ))}
    </>
  );
}

/**
 * The archive nailed to a real slab of wood — thickness and all. The slab
 * tilts gently after the pointer (never far enough to see its back). Pins
 * are red or blue; ember strikes turn the whole cell gold, and string ties
 * each player's embers to their own previous find.
 */
export function GameBoard({
  game,
  heat,
  disabled,
  onDrill,
  onHoverCell,
  /** Local PvP: none. Assayer: blue hand on Assayer pins. Online: opponent seat color. */
  pinHand = "none",
  /** The Verdict: number of embers re-ignited so far; undefined = not celebrating. */
  celebration,
}: {
  game: Game;
  heat?: number[] | null;
  disabled?: boolean;
  onDrill: (cell: number) => void;
  /** Fired with cell index on enter, null on leave — for MiniGrid sync. */
  onHoverCell?: (cell: number | null) => void;
  pinHand?: "none" | "assayer" | { opponentSeat: Seat };
  celebration?: number;
}) {
  const [tilt, setTilt] = useState({ rx: 13, ry: 0 });
  const lastDrill = [...game.log].reverse().find((r) => r.action === "drill");
  const emberDrills = game.log.filter((r) => r.action === "drill" && r.struckGold);
  const redTrail = emberDrills.filter((r) => r.seat === "red").map((r) => r.cell!);
  const blueTrail = emberDrills.filter((r) => r.seat === "black").map((r) => r.cell!);
  const emberOrder = emberDrills.map((r) => r.cell!);
  const celebrating = celebration !== undefined;

  const handSeat: Seat | null =
    pinHand === "none" || !lastDrill
      ? null
      : pinHand === "assayer"
        ? lastDrill.seat === "black"
          ? "black"
          : null
        : lastDrill.seat === pinHand.opponentSeat
          ? pinHand.opponentSeat
          : null;

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setTilt({
      rx: 13 - ny * 4, // 9°..17° — the back stays hidden
      ry: Math.max(-7, Math.min(7, nx * 7)),
    });
  };

  return (
    <div
      className={cn(
        "w-full max-w-[min(720px,calc(100svh-18rem))] pb-7 [perspective:1100px]",
        celebrating && "relative z-40",
      )}
      onMouseMove={onMove}
      onMouseLeave={() => {
        setTilt({ rx: 13, ry: 0 });
        onHoverCell?.(null);
      }}
    >
      {/* One flat 3D transform, no preserve-3d: browsers hit-test this
          correctly. The slab thickness below is painted, not modeled. */}
      <div
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: "transform 260ms ease-out",
        }}
        className="relative"
      >
        {/* painted slab thickness */}
        <div
          aria-hidden
          style={{
            height: THICK,
            background: "linear-gradient(180deg, #3a2a18, #17100a)",
          }}
          className="pointer-events-none absolute inset-x-[2px] top-full rounded-b-md shadow-[0_18px_40px_-10px_rgba(0,0,0,0.9)]"
        />

        {/* board face */}
        <div className="wood-panel relative rounded-sm border-[10px] border-wood-dark p-2 shadow-[0_28px_60px_-18px_rgba(0,0,0,0.85)] sm:p-3">
          <div className="relative">
            <div className="grid grid-cols-9">
              {Array.from({ length: CELLS }, (_, cell) => {
                const state = game.cells[cell];
                const drilled = state !== 0;
                const hasEmber = drilled && bbGet(game.gold, cell);
                const isLast = lastDrill?.cell === cell;
                const showPinHand = isLast && handSeat !== null;
                const p = !drilled && heat ? heat[cell] : 0;

                // The Verdict: embers re-ignite in discovery order while
                // everything else recedes into shadow.
                const litIdx = celebrating ? emberOrder.indexOf(cell) : -1;
                const isLit = litIdx > -1 && litIdx < (celebration ?? 0);
                const isNewestLit = isLit && litIdx === (celebration ?? 0) - 1;

                const style: CSSProperties | undefined = hasEmber
                  ? {
                      background:
                        "radial-gradient(circle at 42% 36%, #f4c464 0%, #dd9c2f 58%, #96650f 100%)",
                      boxShadow:
                        "0 0 14px rgba(227,161,62,0.55), inset 0 0 6px rgba(120,74,6,0.6)",
                    }
                  : p > 0
                    ? { backgroundColor: `rgba(227, 161, 62, ${0.05 + p * 0.4})` }
                    : undefined;

                const canDrill =
                  !drilled && !disabled && game.status === "active";

                return (
                  <button
                    key={cell}
                    type="button"
                    disabled={!canDrill && !drilled}
                    onClick={() => {
                      if (canDrill) onDrill(cell);
                    }}
                    onMouseEnter={() => onHoverCell?.(cell)}
                    aria-label={`cell ${Math.floor(cell / 9) + 1}-${(cell % 9) + 1}`}
                    style={style}
                    className={cn(
                      "relative aspect-square border border-wood-line/35 transition-all duration-200 ease-out",
                      canDrill &&
                        "hover:z-10 hover:scale-[1.07] hover:border-gold/70 hover:bg-[rgba(227,161,62,0.14)] hover:shadow-md",
                      drilled &&
                        "cursor-default hover:z-10 hover:scale-[1.04] hover:brightness-110 hover:shadow-md",
                      drilled && !hasEmber && "bg-black/20",
                      isLast && !celebrating && "z-10 animate-drill-pop",
                      celebrating && !isLit && "opacity-25 saturate-50",
                      isLit && "ember-ignite z-10",
                    )}
                  >
                    {drilled && (
                      <Pin
                        seat={state === 1 ? "red" : "black"}
                        className="absolute left-1/2 top-[24%] w-[38%] -translate-x-1/2"
                      />
                    )}
                    {showPinHand && handSeat && (
                      <PinHand
                        seat={handSeat}
                        className="codex-hand-pin -right-[52%] -top-[72%] z-30 w-[118%]"
                      />
                    )}
                    {((isLast && hasEmber && !celebrating) || isNewestLit) && (
                      <span aria-hidden className="pointer-events-none absolute inset-0">
                        {SPARKS.map((s, i) => (
                          <span
                            key={`${i}-${isNewestLit ? litIdx : "last"}`}
                            style={{ "--dx": s.dx, "--dy": s.dy } as CSSProperties}
                            className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold animate-spark"
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* twine: each side ties its own embers together */}
            {(redTrail.length >= 1 || blueTrail.length >= 1) && (
              <svg
                aria-hidden
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className={cn(
                  "pointer-events-none absolute inset-0 z-20 h-full w-full",
                  celebrating && "verdict-strings",
                )}
              >
                <StringTrail trail={redTrail} seat="red" />
                <StringTrail trail={blueTrail} seat="black" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

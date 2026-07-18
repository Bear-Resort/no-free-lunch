import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { FolderOpen, Hammer, RotateCcw, Undo2 } from "lucide-react";
import type { BB } from "@engine/bitboard";
import { applyOp, type Op, OPS } from "@engine/formula";
import type { Step } from "@engine/program";
import { sfx } from "@/lib/sound";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { MiniGrid } from "./MiniGrid";
import { cn } from "@/lib/utils";

interface CardPosition {
  x: number;
  y: number;
  rot: number;
}

interface DragState {
  index: number;
  pointerId: number;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  moved: boolean;
}

const TILTS = [-4, 3, -2, 5, -3, 2, -5];

function defaultPosition(index: number): CardPosition {
  return {
    x: 24 + (index % 3) * 158,
    y: 30 + Math.floor(index / 3) * 168 + (index % 2) * 10,
    rot: TILTS[index % TILTS.length],
  };
}

/**
 * The combination machines. Pool = revealed maps + intermediates built this
 * attempt. Pick two inputs and an operator, run the machine (spends power),
 * then submit the last output as the full map attempt.
 */
export function MachineBench({
  open,
  onOpenChange,
  revealed,
  budget,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revealed: BB[];
  budget: number;
  onSubmit: (steps: Step[]) => void;
}) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [selA, setSelA] = useState<number | null>(null);
  const [selB, setSelB] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [positions, setPositions] = useState<Record<number, CardPosition>>({});
  const dragRef = useRef<DragState | null>(null);

  const pool = useMemo(() => {
    const boards = [...revealed];
    for (const s of steps) boards.push(applyOp(s.op, boards[s.a], boards[s.b]));
    return boards;
  }, [revealed, steps]);

  const label = (i: number) =>
    i < revealed.length ? `M${i + 1}` : `S${i - revealed.length + 1}`;

  const preview =
    selA !== null && selB !== null && op !== null
      ? applyOp(op, pool[selA], pool[selB])
      : null;

  const reset = () => {
    setSteps([]);
    setSelA(null);
    setSelB(null);
    setOp(null);
    setConfirming(false);
    setPositions({});
  };

  const pick = (i: number) => {
    if (selA === i) setSelA(null);
    else if (selB === i) setSelB(null);
    else if (selA === null) setSelA(i);
    else setSelB(i);
  };

  const runMachine = () => {
    if (selA === null || selB === null || op === null) return;
    sfx.machine();
    setSteps([...steps, { op, a: selA, b: selB }]);
    setSelA(null);
    setSelB(null);
    setOp(null);
  };

  useEffect(() => {
    if (!open) return;
    setPositions((prev) => {
      const next: Record<number, CardPosition> = {};
      for (let i = 0; i < pool.length; i++) next[i] = prev[i] ?? defaultPosition(i);
      return next;
    });
  }, [open, pool.length]);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>, index: number) => {
    const pos = positions[index] ?? defaultPosition(index);
    dragRef.current = {
      index,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: pos.x,
      baseY: pos.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    setPositions((prev) => ({
      ...prev,
      [drag.index]: {
        ...(prev[drag.index] ?? defaultPosition(drag.index)),
        x: drag.baseX + dx,
        y: drag.baseY + dy,
      },
    }));
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>, index: number) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    if (!drag.moved) pick(index);
  };

  const close = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        className="max-h-[calc(100svh-2rem)] max-w-5xl overflow-y-auto bg-[#d8b670] p-0 lg:h-[calc(100svh-2rem)] lg:overflow-hidden"
        hideClose
      >
        <button
          onClick={() => close(false)}
          className="absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-r-md border border-l-0 border-ink/25 bg-[#f6edcf] px-2 py-8 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#5c5140] shadow-md transition-colors hover:text-[#2a2118] lg:block"
        >
          close
        </button>
        <button
          onClick={() => close(false)}
          className="absolute right-3 top-3 z-20 rounded-md border border-ink/25 bg-[#f6edcf] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#5c5140] shadow-md transition-colors hover:text-[#2a2118] lg:hidden"
        >
          close
        </button>

        <div className="flex min-h-full flex-col lg:h-full lg:flex-row">
          <section className="relative min-h-[390px] flex-1 overflow-hidden border-b border-ink/20 bg-[#cfa95c] lg:min-h-0 lg:border-b-0 lg:border-r">
            <div className="absolute left-7 top-0 z-10 rounded-b-md border border-t-0 border-ink/25 bg-[#6f94c8] px-5 py-2 font-display text-xs font-bold uppercase tracking-[0.22em] text-[#102033] shadow-md">
              Codex exam folder
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,246,210,.5),transparent_34%),repeating-linear-gradient(2deg,rgba(42,33,24,.12)_0_1px,transparent_1px_18px)]" />
            <div className="absolute bottom-4 left-5 max-w-[340px] rotate-[-1deg] border border-ink/20 bg-[#f8edcf]/80 p-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-[#5c5140] shadow-md">
              Drag the scraps. Click two to mark A and B. Codex accepts neat
              reasoning, but never rewards neat desks.
            </div>

            {pool.map((bb, i) => {
              const pos = positions[i] ?? defaultPosition(i);
              const selected = selA === i || selB === i;
              return (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onPointerDown={(event) => startDrag(event, i)}
                  onPointerMove={moveDrag}
                  onPointerUp={(event) => endDrag(event, i)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") pick(i);
                  }}
                  style={
                    {
                      left: pos.x,
                      top: pos.y,
                      transform: `rotate(${pos.rot}deg)`,
                      touchAction: "none",
                    } as CSSProperties
                  }
                  className={cn(
                    "absolute cursor-grab select-none rounded-sm border bg-[#f8edcf] p-2 shadow-[0_8px_18px_rgba(42,33,24,0.25)] outline-none transition-shadow active:cursor-grabbing",
                    selected
                      ? "z-20 border-accent ring-2 ring-accent/55"
                      : "z-10 border-ink/20 hover:shadow-[0_10px_22px_rgba(42,33,24,0.32)]",
                  )}
                >
                  <span className="absolute -top-2 left-5 h-4 w-10 -rotate-3 bg-[#ead8a8]/80 shadow-sm" />
                  <MiniGrid
                    bb={bb}
                    cellSize={i < revealed.length ? 11 : 10}
                    activeClass={i < revealed.length ? "bg-accent" : "bg-success"}
                  />
                  <div className="mt-1 flex items-center justify-between gap-2 font-mono text-[10px] font-bold uppercase text-[#5c5140]">
                    <span>{label(i)}</span>
                    {selA === i && <span className="text-accent">A</span>}
                    {selB === i && <span className="text-accent">B</span>}
                  </div>
                </div>
              );
            })}
          </section>

          <aside className="flex w-full flex-col gap-4 bg-[#f3e7c8] p-5 lg:w-[310px]">
            <div>
              <div className="flex items-center gap-2">
                <FolderOpen className="size-4 text-accent" />
                <DialogTitle className="text-[#2a2118]">Evidence folder</DialogTitle>
              </div>
              <DialogDescription className="text-[#5c5140]">
                Combine two scraps. Spend power. Submit the last output as your
                theory, and hope the forest grades on a curve.
              </DialogDescription>
            </div>

            <div>
              <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#5c5140]">
                Power {steps.length}/{budget}
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: budget }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      i < steps.length ? "bg-accent" : "bg-edge",
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {OPS.map((o) => (
                <Button
                  key={o}
                  size="sm"
                  variant={op === o ? "default" : "secondary"}
                  onClick={() => setOp(o)}
                >
                  {o}
                </Button>
              ))}
            </div>

            <Button
              variant="gold"
              disabled={
                selA === null ||
                selB === null ||
                op === null ||
                steps.length >= budget
              }
              onClick={runMachine}
            >
              <Hammer className="size-4" /> Run the dubious machine
            </Button>

            {steps.length > 0 && (
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  size="sm"
                  variant="secondary"
                  onClick={() => setSteps(steps.slice(0, -1))}
                >
                  <Undo2 className="size-3.5" /> Undo
                </Button>
                <Button className="flex-1" size="sm" variant="secondary" onClick={reset}>
                  <RotateCcw className="size-3.5" /> Reset
                </Button>
              </div>
            )}

            <div className="mt-auto rounded-md border border-edge bg-[#f8edcf]/80 p-3 shadow-inner">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#5c5140]">
                {preview
                  ? `Preview: ${label(selA!)} ${op} ${label(selB!)}`
                  : steps.length > 0
                    ? `Latest output: ${label(pool.length - 1)}`
                    : "No theory yet"}
              </div>
              <div className="mt-2">
                <MiniGrid
                  bb={preview ?? pool[pool.length - 1]}
                  cellSize={7}
                  activeClass="bg-gold"
                />
              </div>

              {!confirming ? (
                <Button
                  className="mt-3 w-full"
                  disabled={steps.length === 0}
                  onClick={() => setConfirming(true)}
                >
                  Submit {steps.length > 0 ? label(pool.length - 1) : "map"}
                </Button>
              ) : (
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-[#5c5140]">
                    Whole turn, permanent embarrassment. Submit it?
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirming(false)}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={() => {
                        const submitted = steps;
                        reset();
                        onSubmit(submitted);
                      }}
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

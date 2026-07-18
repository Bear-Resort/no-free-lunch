import { useEffect, useMemo, useState } from "react";
import type { BB } from "@engine/bitboard";
import { applyOp, formulaText, type Expr, type Op } from "@engine/formula";
import { Button } from "@/components/ui/button";
import { MiniGrid } from "./MiniGrid";
import { cn } from "@/lib/utils";

interface RevealStep {
  aLabel: string;
  bLabel: string;
  op: Op;
  a: BB;
  b: BB;
  out: BB;
  outLabel: string;
}

/** Post-order walk of the secret formula → the machine steps that built it. */
function stepsOf(expr: Expr, maps: BB[]): RevealStep[] {
  const steps: RevealStep[] = [];
  const walk = (e: Expr): { bb: BB; label: string } => {
    if ("map" in e) return { bb: maps[e.map], label: `M${e.map + 1}` };
    const a = walk(e.l);
    const b = walk(e.r);
    const out = applyOp(e.op, a.bb, b.bb);
    const outLabel = `S${steps.length + 1}`;
    steps.push({ aLabel: a.label, bLabel: b.label, op: e.op, a: a.bb, b: b.bb, out, outLabel });
    return { bb: out, label: outLabel };
  };
  walk(expr);
  return steps;
}

const OP_GLYPH: Record<Op, string> = { AND: "∧", OR: "∨", XOR: "⊕" };

/**
 * The post-game cinematic: the secret formula resolves through the machines
 * one step at a time, ending on the true gold layout.
 */
export function FormulaReveal({
  formula,
  maps,
  gold,
}: {
  formula: Expr;
  maps: BB[];
  gold: BB;
}) {
  const steps = useMemo(() => stepsOf(formula, maps), [formula, maps]);
  const [idx, setIdx] = useState(0); // 0..steps.length-1 machines, then final
  const done = idx >= steps.length;

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => setIdx((i) => i + 1), 1400);
    return () => clearTimeout(t);
  }, [idx, done]);

  return (
    <div className="rounded-xl border border-edge bg-surface/60 p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          {done ? "Codex's answer key" : `Bad little machine ${idx + 1} of ${steps.length}`}
        </div>
        {!done && (
          <button
            onClick={() => setIdx(steps.length)}
            className="text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          >
            skip
          </button>
        )}
      </div>

      {!done ? (
        <div key={idx} className="mt-3 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <figure className="text-center">
            <MiniGrid bb={steps[idx].a} cellSize={7} />
            <figcaption className="mt-1 text-xs font-semibold text-ink-muted">
              {steps[idx].aLabel}
            </figcaption>
          </figure>
          <span className="font-display text-2xl font-bold text-accent">
            {OP_GLYPH[steps[idx].op]}
          </span>
          <figure className="text-center">
            <MiniGrid bb={steps[idx].b} cellSize={7} />
            <figcaption className="mt-1 text-xs font-semibold text-ink-muted">
              {steps[idx].bLabel}
            </figcaption>
          </figure>
          <span className="font-display text-2xl font-bold text-ink-muted">→</span>
          <figure className="text-center">
            <MiniGrid bb={steps[idx].out} cellSize={7} activeClass="bg-gold" />
            <figcaption className="mt-1 text-xs font-semibold text-gold">
              {steps[idx].outLabel}
            </figcaption>
          </figure>
        </div>
      ) : (
        <div className="mt-3 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
          <div
            className={cn(
              "font-display text-xl font-bold text-gold",
              "animate-stamp",
            )}
          >
            {formulaText(formula)}
          </div>
          <div className="mt-3">
            <MiniGrid bb={gold} cellSize={10} activeClass="bg-gold" />
          </div>
          <div className="mt-2 text-xs text-ink-muted">
            This was the truth under the desk the whole time.
          </div>
          {steps.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setIdx(0)}
            >
              Replay
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

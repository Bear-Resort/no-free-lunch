import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The Assayer's voice. Every line is derived from exact solver telemetry —
 * the narration can state only true deductions about the game.
 */
export function AssayerPanel({
  note,
  thinking,
}: {
  note: string | null;
  thinking: boolean;
}) {
  return (
    <section className="rounded-xl border border-edge bg-surface/60 p-3">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full bg-accent-soft text-accent",
            thinking && "animate-pulse",
          )}
        >
          <Bot className="size-4" />
        </span>
        <span className="font-display text-sm font-semibold">Codex's Assayer</span>
        {thinking && (
          <span className="text-xs italic text-ink-muted">marking your paper...</span>
        )}
      </div>
      <p className="mt-2 min-h-10 text-sm leading-relaxed text-ink-muted">
        {note ?? "Every drill tells me something. Codex dislikes wasted ignorance."}
      </p>
    </section>
  );
}

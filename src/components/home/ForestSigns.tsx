import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { PersonStanding } from "lucide-react";
import { sfx } from "@/lib/sound";
import { cn } from "@/lib/utils";

/* Drifting agent chatter — the forest is full of processes. Deterministic
   placement; each scrap loops its own slow float. */
const SCRAPS: {
  text: string;
  left: string;
  top: string;
  dur: string;
  delay: string;
  opacity: number;
  amber?: boolean;
}[] = [
  { text: "$ codex exec find_student.sh", left: "6%", top: "18%", dur: "26s", delay: "0s", opacity: 0.3 },
  { text: "while (asleep) { dig(); }", left: "78%", top: "24%", dur: "31s", delay: "4s", opacity: 0.26 },
  { text: "M2 ⊕ M5 → ???", left: "14%", top: "58%", dur: "24s", delay: "9s", opacity: 0.3, amber: true },
  { text: "// the reason is not", left: "82%", top: "64%", dur: "28s", delay: "2s", opacity: 0.3 },
  { text: "grep -r \"ember\" ./forest", left: "10%", top: "80%", dur: "33s", delay: "12s", opacity: 0.24 },
  { text: "0x51 cells. one truth.", left: "70%", top: "84%", dur: "27s", delay: "7s", opacity: 0.28, amber: true },
  { text: "warn: natural human detected", left: "62%", top: "10%", dur: "30s", delay: "15s", opacity: 0.32, amber: true },
  { text: "AND ∧ · OR ∨ · XOR ⊕", left: "30%", top: "8%", dur: "25s", delay: "6s", opacity: 0.22 },
  { text: "exit 3: still dreaming", left: "44%", top: "88%", dur: "29s", delay: "10s", opacity: 0.26 },
];

export function FloatingCode() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {SCRAPS.map((s) => (
        <span
          key={s.text}
          style={
            {
              left: s.left,
              top: s.top,
              "--fc-dur": s.dur,
              "--fc-delay": s.delay,
              "--fc-opacity": s.opacity,
            } as CSSProperties
          }
          className={
            "float-code absolute font-mono text-[11px] tracking-wide " +
            (s.amber ? "text-gold" : "text-ink-muted")
          }
        >
          {s.text}
        </span>
      ))}
    </div>
  );
}

/**
 * Trail sign: this is agent country. Poke it and a human screams somewhere.
 * Drag it wherever you like — the forest doesn't mind relocated warnings.
 */
export function WarningSign({ className }: { className?: string }) {
  const [scared, setScared] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    id: number;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    moved: boolean;
  } | null>(null);

  const poke = () => {
    if (scared) return;
    setScared(true);
    sfx.scream();
    setTimeout(() => setScared(false), 1500);
  };

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    drag.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: pos.x,
      baseY: pos.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    setPos({ x: d.baseX + dx, y: d.baseY + dy });
  };

  const onUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    drag.current = null;
    if (!d.moved) poke();
  };

  return (
    <button
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      aria-label="warning sign — natural humans around"
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        touchAction: "none",
      }}
      className={cn(
        "cursor-grab outline-none active:cursor-grabbing",
        className,
      )}
    >
      <div
        className={cn(
          "flex rotate-3 flex-col items-center transition-transform duration-300 ease-out",
          scared ? "-rotate-3 scale-[1.6]" : "hover:scale-110",
        )}
      >
        <div className="relative h-[112px] w-[130px] [clip-path:polygon(50%_0,100%_100%,0_100%)] bg-[#1a140a]">
          <div className="absolute inset-[7px] [clip-path:polygon(50%_0,100%_100%,0_100%)] bg-gold">
            <PersonStanding
              className={cn(
                "absolute bottom-2.5 left-1/2 size-10 -translate-x-1/2 text-[#1a140a]",
                scared && "palm-tremble",
              )}
              strokeWidth={2.6}
            />
          </div>
        </div>
        <div className="-mt-1 border border-edge bg-elevated px-3 py-1.5 text-center font-mono text-xs font-bold uppercase leading-snug tracking-[0.14em] text-ink-muted shadow-md">
          {scared ? (
            <>
              they heard
              <br />
              something
            </>
          ) : (
            <>
              Caution
              <br />
              natural humans around
            </>
          )}
        </div>
      </div>
    </button>
  );
}

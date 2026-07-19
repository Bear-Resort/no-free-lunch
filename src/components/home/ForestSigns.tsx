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

export function ForestMapLayer() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 820"
      preserveAspectRatio="none"
      className="forest-map-layer pointer-events-none absolute inset-0 z-0 h-full w-full"
    >
      <defs>
        <filter id="code-river-glow" x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0.81 0 0.25 0 0 0.19 0 0 0.18 0 0.11 0 0 0 0.75 0"
            result="redGlow"
          />
          <feMerge>
            <feMergeNode in="redGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <path
          id="code-river-main"
          d="M -80 570 C 150 435 330 455 492 520 C 640 578 790 590 950 510 C 1115 428 1185 300 1510 245"
        />
        <path
          id="code-river-under"
          d="M 475 735 C 625 682 760 700 905 718 C 1085 740 1210 862 1510 770"
        />
        <path
          id="code-river-branch"
          d="M 560 -80 C 548 128 548 286 505 438 C 474 548 420 650 660 726"
        />
      </defs>

      <g className="forest-map-contours">
        <path d="M43 180 C185 120 318 126 420 190 C534 262 668 220 779 143 C891 67 1041 74 1184 124 C1298 164 1372 160 1458 118" />
        <path d="M-20 318 C136 246 275 265 409 326 C548 389 681 367 817 300 C978 221 1153 235 1456 327" />
        <path d="M-32 474 C113 425 255 423 390 484 C555 558 699 542 862 455 C1049 355 1216 399 1470 475" />
        <path d="M20 650 C205 580 358 612 512 664 C646 708 798 680 942 608 C1114 522 1259 576 1448 642" />
        <path d="M94 110 C160 190 239 222 344 209 C465 194 527 116 606 89" />
        <path d="M925 128 C1017 204 1107 224 1218 196 C1292 177 1354 204 1412 260" />
        <path d="M178 700 C218 622 284 578 382 566 C502 552 578 483 624 394" />
        <path d="M1110 700 C1160 620 1246 585 1348 592 C1398 596 1436 579 1470 535" />
      </g>

      <g className="forest-map-grid">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={`v-${i}`} d={`M ${i * 132 - 2} 55 L ${i * 132 + 42} 810`} />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <path key={`h-${i}`} d={`M -40 ${i * 118 + 28} L 1480 ${i * 118 + 82}`} />
        ))}
      </g>

      <g className="forest-map-crosses">
        {[
          [178, 614],
          [346, 198],
          [642, 608],
          [818, 170],
          [1044, 690],
          [1264, 372],
          [1348, 612],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
            <path d="M-16 0H16M0-16V16" />
            <circle r="3" />
          </g>
        ))}
      </g>

      <g filter="url(#code-river-glow)">
        <use href="#code-river-main" className="code-river code-river-main" />
        <use href="#code-river-under" className="code-river code-river-under" />
        <use href="#code-river-branch" className="code-river code-river-branch" />
      </g>
      <g className="code-river-text">
        <text>
          <textPath href="#code-river-main" startOffset="4%">
            if (lost) return forest.map(x =&gt; x.truth) · XOR XOR AND ·
          </textPath>
        </text>
        <text>
          <textPath href="#code-river-under" startOffset="12%">
            0x51 cells · public evidence only · no free lunch ·
          </textPath>
        </text>
        <text>
          <textPath href="#code-river-branch" startOffset="7%">
            codex.exec("find_james") · M1 ∧ M3 ·
          </textPath>
        </text>
      </g>
    </svg>
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

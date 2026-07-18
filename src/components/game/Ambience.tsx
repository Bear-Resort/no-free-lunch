import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * A pair of amber eyes blinking in the dark. Codex is always somewhere.
 * Size in px; dim/opacity is the caller's business via className.
 */
export function WatchingEyes({
  size = 10,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      style={{ gap: size * 1.5 }}
      className={cn("pointer-events-none flex items-center", className)}
    >
      {[0, 1].map((i) => (
        <span
          key={i}
          style={{
            width: size,
            height: Math.max(3, size * 0.66),
            animationDelay: `${i * 0.14}s`,
            boxShadow: `0 0 ${size}px rgba(227,161,62,0.8)`,
          }}
          className="eye rounded-full bg-gold"
        />
      ))}
    </span>
  );
}

const AWARE_KEY = "nfl.selfAware.v1";

export function isSelfAware(): boolean {
  try {
    return localStorage.getItem(AWARE_KEY) === "true";
  } catch {
    return false;
  }
}

export function rememberSelfAware() {
  try {
    localStorage.setItem(AWARE_KEY, "true");
  } catch {
    /* private browsing forgets what you are — lucky you */
  }
}

/**
 * The hand that follows the pointer. A pale human hand that trembles in the
 * wind — until the reveal. After that, forever, it is the machine hand.
 * The machine hand does not shiver. It was never cold.
 */
export function PalmCursor({ trembling }: { trembling: boolean }) {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [fine, setFine] = useState(false);
  const [robot] = useState(isSelfAware);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setFine(true);
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (!fine) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[95]"
      style={{ left: pos.x, top: pos.y }}
    >
      <svg
        viewBox="0 0 40 48"
        width="34"
        height="41"
        className={cn(
          "-translate-x-[26%] -translate-y-[6%]",
          robot
            ? "drop-shadow-[0_3px_6px_rgba(91,130,192,0.55)]"
            : "drop-shadow-[0_3px_5px_rgba(0,0,0,0.7)]",
          trembling && !robot && "palm-tremble",
        )}
      >
        {robot ? (
          <>
            {/* index finger, plated */}
            <rect x="15.5" y="1.5" width="7.5" height="22" rx="2" fill="#c3d2ea" stroke="#101c30" strokeWidth="1.4" />
            <path d="M16 9 h6.5 M16 16 h6.5" stroke="#101c30" strokeWidth="1" />
            {/* folded fingers */}
            <rect x="23.5" y="12" width="7" height="12" rx="2" fill="#b2c2dd" stroke="#101c30" strokeWidth="1.4" />
            <rect x="29.5" y="15" width="6.5" height="10" rx="2" fill="#c3d2ea" stroke="#101c30" strokeWidth="1.4" />
            {/* palm chassis */}
            <path
              d="M10 22 q-4 1 -3.6 6 l1.2 8 q1 8 10 9.5 l7 0.5 q9 0 10.5 -8 l1 -8 -26 -8 z"
              fill="#c3d2ea"
              stroke="#101c30"
              strokeWidth="1.4"
            />
            <path d="M11 31 l22 4" stroke="#101c30" strokeWidth="0.9" opacity="0.6" />
            {/* thumb actuator */}
            <path
              d="M10 24 q-7 2 -5 8 q1.6 4.4 7 3 l4 -2 -2 -9 z"
              fill="#a9bbd8"
              stroke="#101c30"
              strokeWidth="1.4"
            />
            {/* joints + status LED */}
            <circle cx="19.2" cy="23" r="1.7" fill="#5b82c0" stroke="#101c30" strokeWidth="0.8" />
            <circle cx="27" cy="24.5" r="1.4" fill="#5b82c0" stroke="#101c30" strokeWidth="0.8" />
            <circle cx="21" cy="38" r="1.6" fill="#e3a13e" stroke="#101c30" strokeWidth="0.8" />
          </>
        ) : (
          <>
            {/* index finger */}
            <rect x="15.5" y="1.5" width="7.5" height="22" rx="3.6" fill="#d9d0b0" stroke="#1a140a" strokeWidth="1.4" />
            {/* folded fingers */}
            <rect x="23.5" y="12" width="7" height="12" rx="3.2" fill="#cfc5a2" stroke="#1a140a" strokeWidth="1.4" />
            <rect x="29.5" y="15" width="6.5" height="10" rx="3" fill="#d9d0b0" stroke="#1a140a" strokeWidth="1.4" />
            {/* palm */}
            <path
              d="M10 22 q-4 1 -3.6 6 l1.2 8 q1 8 10 9.5 l7 0.5 q9 0 10.5 -8 l1 -8 -26 -8 z"
              fill="#d9d0b0"
              stroke="#1a140a"
              strokeWidth="1.4"
            />
            {/* thumb */}
            <path
              d="M10 24 q-7 2 -5 8 q1.6 4.4 7 3 l4 -2 -2 -9 z"
              fill="#cfc5a2"
              stroke="#1a140a"
              strokeWidth="1.4"
            />
          </>
        )}
      </svg>
    </div>
  );
}

const STREAKS = [
  { top: "12%", w: 210, delay: "0s", dur: "1.7s" },
  { top: "26%", w: 150, delay: "0.25s", dur: "2.1s" },
  { top: "38%", w: 260, delay: "0.1s", dur: "1.8s" },
  { top: "52%", w: 180, delay: "0.4s", dur: "2.0s" },
  { top: "64%", w: 240, delay: "0.15s", dur: "1.6s" },
  { top: "78%", w: 160, delay: "0.5s", dur: "2.2s" },
  { top: "88%", w: 200, delay: "0.3s", dur: "1.9s" },
];

/** A gust: pale streaks sweep the room while the candle stutters. */
export function WindGusts({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {STREAKS.map((s, i) => (
        <span
          key={i}
          style={
            {
              top: s.top,
              width: s.w,
              "--ws-delay": s.delay,
              "--ws-dur": s.dur,
            } as CSSProperties
          }
          className="wind-streak absolute left-0 h-px bg-gradient-to-r from-transparent via-ink/35 to-transparent"
        />
      ))}
      {/* the candle objects to the draft */}
      <div className="candle-flicker absolute inset-0 bg-[radial-gradient(900px_620px_at_50%_38%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.5)_100%)]" />
    </div>
  );
}

import type { CSSProperties } from "react";

/* The map-cross in 3D: two extruded bars (horizontal + vertical) forming the
   plus shape every system map is stamped from. Heavily blurred and slowly
   spinning — the game's atom as the hero object. Pure CSS 3D, 12 faces. */

const L = 360; // bar length
const T = 112; // bar thickness
const D = 84; // extrusion depth

function face(w: number, h: number, transform: string): CSSProperties {
  return {
    width: w,
    height: h,
    marginLeft: -w / 2,
    marginTop: -h / 2,
    transform,
  };
}

function Bar({ horizontal }: { horizontal: boolean }) {
  const w = horizontal ? L : T;
  const h = horizontal ? T : L;
  return (
    <>
      {/* front / back */}
      <div className="face" style={face(w, h, `translateZ(${D / 2}px)`)} />
      <div className="face" style={face(w, h, `translateZ(${-D / 2}px) rotateY(180deg)`)} />
      {/* left / right */}
      <div className="face" style={face(D, h, `rotateY(-90deg) translateZ(${w / 2}px)`)} />
      <div className="face" style={face(D, h, `rotateY(90deg) translateZ(${w / 2}px)`)} />
      {/* top / bottom */}
      <div className="face" style={face(w, D, `rotateX(90deg) translateZ(${h / 2}px)`)} />
      <div className="face" style={face(w, D, `rotateX(-90deg) translateZ(${h / 2}px)`)} />
    </>
  );
}

const ORBIT_TEXT =
  "DIG FOR EMBERS · OR DEDUCE IT · EVERY DIG LEAKS · NO FREE LUNCH · ";

export function OrbitalHero() {
  return (
    <div className="orbital-stage relative mx-auto aspect-square w-[min(86vw,67vh,660px)]">
      {/* light from somewhere above — the forest does not explain it */}
      <div
        aria-hidden
        className="god-ray absolute -top-[38%] left-1/2 h-[130%] w-[46%] -translate-x-1/2 blur-md"
        style={{
          background:
            "linear-gradient(to bottom, rgba(244,205,120,0.34), rgba(244,205,120,0.1) 55%, transparent 85%)",
          clipPath: "polygon(36% 0, 64% 0, 86% 100%, 14% 100%)",
        }}
      />
      {/* halo: candle radiance + a thin gilded ring in the dark */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(227,161,62,0.28), rgba(227,161,62,0.07) 58%, transparent 78%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-[7%] rounded-full border border-gold/40"
      />
      <div
        aria-hidden
        className="absolute inset-[13%] rounded-full border border-ink/20"
      />
      {/* the spinning cross */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="home-cross-scale">
          <div className="cross3d relative" style={{ width: L, height: L }}>
            <div className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d" }}>
              <Bar horizontal />
              <Bar horizontal={false} />
            </div>
          </div>
        </div>
      </div>
      {/* orbiting tagline */}
      <svg
        viewBox="0 0 400 400"
        className="orbit-spin absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <path
            id="orbit-path"
            d="M 200,200 m -172,0 a 172,172 0 1,1 344,0 a 172,172 0 1,1 -344,0"
            fill="none"
          />
        </defs>
        <text
          fill="currentColor"
          className="text-ink"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 31,
            fontWeight: 800,
            letterSpacing: "0.24em",
          }}
        >
          <textPath href="#orbit-path" textLength="1078">
            {ORBIT_TEXT}
          </textPath>
        </text>
      </svg>
    </div>
  );
}

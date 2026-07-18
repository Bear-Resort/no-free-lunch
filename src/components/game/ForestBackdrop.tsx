/* Faint pixel forest along the bottom of the dark — an homage to the little
   dinosaur that runs when the internet dies. Blocky pines, a bumpy ground
   line, and one small watcher at the treeline. */

function Pine({ x, s, o }: { x: number; s: number; o: number }) {
  // A stepped pixel pine, drawn in blocks; s = scale, o = opacity
  return (
    <g transform={`translate(${x} 0) scale(${s})`} opacity={o}>
      <rect x="16" y="52" width="8" height="12" />
      <rect x="8" y="40" width="24" height="12" />
      <rect x="12" y="28" width="16" height="12" />
      <rect x="4" y="16" width="32" height="12" />
      <rect x="14" y="4" width="12" height="12" />
      <rect x="18" y="-4" width="4" height="8" />
    </g>
  );
}

function Dino({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 44)`} opacity="0.5">
      <rect x="10" y="0" width="8" height="5" />
      <rect x="12" y="1" width="1.6" height="1.6" fill="#0a0d08" />
      <rect x="8" y="5" width="8" height="6" />
      <rect x="2" y="7" width="6" height="4" />
      <rect x="9" y="11" width="2.4" height="5" />
      <rect x="13" y="11" width="2.4" height="4" />
    </g>
  );
}

export function ForestBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 overflow-hidden"
    >
      <svg
        viewBox="0 0 1000 80"
        preserveAspectRatio="xMidYMax slice"
        className="block h-[22vh] w-full fill-[#1c2414]"
      >
        {/* far row */}
        <Pine x={30} s={0.7} o={0.35} />
        <Pine x={140} s={0.55} o={0.3} />
        <Pine x={300} s={0.65} o={0.32} />
        <Pine x={520} s={0.5} o={0.28} />
        <Pine x={700} s={0.6} o={0.32} />
        <Pine x={880} s={0.7} o={0.35} />
        {/* near row */}
        <Pine x={80} s={1} o={0.55} />
        <Pine x={230} s={0.9} o={0.5} />
        <Pine x={420} s={1.05} o={0.55} />
        <Pine x={610} s={0.85} o={0.5} />
        <Pine x={790} s={1} o={0.55} />
        <Pine x={940} s={0.9} o={0.5} />
        <Dino x={505} />
        {/* the dead-internet ground line */}
        <rect x="0" y="66" width="1000" height="1.6" opacity="0.4" />
        <rect x="120" y="63.5" width="7" height="1.4" opacity="0.35" />
        <rect x="380" y="63.5" width="5" height="1.4" opacity="0.35" />
        <rect x="660" y="63.5" width="8" height="1.4" opacity="0.35" />
        <rect x="860" y="63.5" width="5" height="1.4" opacity="0.35" />
      </svg>
    </div>
  );
}

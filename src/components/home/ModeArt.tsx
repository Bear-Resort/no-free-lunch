import type { ReactNode } from "react";

/** Compact illustrated tiles for the mode picker — pixel forest vocabulary. */

function Frame({ children, accent }: { children: ReactNode; accent: string }) {
  return (
    <svg
      viewBox="0 0 160 100"
      className="h-full w-full"
      aria-hidden
      style={{ color: accent }}
    >
      <rect width="160" height="100" fill="#0a0d08" />
      <rect
        x="1"
        y="1"
        width="158"
        height="98"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
      {children}
    </svg>
  );
}

/** Assayer: lone desk facing a blue presence in the dark. */
export function AssayerArt() {
  return (
    <Frame accent="#5b82c0">
      <rect x="0" y="72" width="160" height="28" fill="#151a10" />
      <rect x="20" y="58" width="50" height="6" fill="#4a3524" />
      <rect x="28" y="48" width="8" height="10" fill="#e3a13e" opacity="0.85" />
      <circle cx="32" cy="44" r="5" fill="#e3a13e" opacity="0.5" />
      <rect x="100" y="40" width="28" height="32" fill="#182541" />
      <rect x="108" y="48" width="12" height="8" fill="#5b82c0" opacity="0.9" />
      <rect x="104" y="28" width="20" height="12" fill="#5b82c0" opacity="0.45" />
      <rect x="12" y="20" width="6" height="14" fill="#333e26" />
      <rect x="8" y="12" width="14" height="10" fill="#333e26" />
      <rect x="140" y="24" width="8" height="16" fill="#333e26" />
      <rect x="134" y="14" width="20" height="12" fill="#333e26" />
    </Frame>
  );
}

/** Shared nightmare: two pins, one desk, pass the device. */
export function SharedArt() {
  return (
    <Frame accent="#cf4631">
      <rect x="0" y="72" width="160" height="28" fill="#151a10" />
      <rect x="35" y="56" width="90" height="8" fill="#4a3524" />
      <rect x="48" y="42" width="10" height="14" fill="#cf4631" />
      <circle cx="53" cy="38" r="4" fill="#cf4631" />
      <rect x="102" y="42" width="10" height="14" fill="#5b82c0" />
      <circle cx="107" cy="38" r="4" fill="#5b82c0" />
      <rect x="70" y="48" width="20" height="4" fill="#e3a13e" opacity="0.7" />
      <rect x="16" y="18" width="8" height="16" fill="#333e26" />
      <rect x="10" y="10" width="20" height="12" fill="#333e26" />
      <rect x="136" y="22" width="8" height="16" fill="#333e26" />
      <rect x="130" y="14" width="20" height="12" fill="#333e26" />
    </Frame>
  );
}

/** Online: path through the trees toward another clearing. */
export function OnlineArt() {
  return (
    <Frame accent="#e3a13e">
      <rect x="0" y="78" width="160" height="22" fill="#151a10" />
      <path
        d="M80 78 L72 50 L88 50 Z"
        fill="#e3a13e"
        opacity="0.55"
      />
      <rect x="78" y="50" width="4" height="28" fill="#e3a13e" opacity="0.4" />
      <rect x="24" y="40" width="10" height="38" fill="#333e26" />
      <rect x="18" y="28" width="22" height="14" fill="#333e26" />
      <rect x="14" y="18" width="30" height="12" fill="#333e26" />
      <rect x="126" y="44" width="10" height="34" fill="#333e26" />
      <rect x="120" y="32" width="22" height="14" fill="#333e26" />
      <rect x="116" y="22" width="30" height="12" fill="#333e26" />
      <circle cx="52" cy="64" r="3" fill="#97a181" opacity="0.7" />
      <circle cx="108" cy="66" r="3" fill="#97a181" opacity="0.7" />
    </Frame>
  );
}

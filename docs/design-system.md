# Design system

## Direction

Modern and simplified. One clear composition per screen. Dark blue as the primary theme — not purple gradients, not warm cream editorial, not generic light SaaS.

### 2026-07-18 revision 3 — "The Black Forest" (current)

Inscryption-inspired pivot: **one candle in a dark forest room**. Near-black moss ground (`#0a0d08`), bone ink, ember amber `#e3a13e`, string red `#c03b2d`, pin blue `#5b82c0`. Lit paper objects (folder, exhibits) keep warm parchment hexes with hardcoded dark paper-ink text. Board = dark wood, tilted, pale scratched grid; players hammer **red/blue pins**; ember strikes glow and tie **red string** between finds in discovery order. Opponent is unseen — blinking amber **eyes** on the far plate. Title: gilded cross with candle halo (keep — it's the brand), drifting mono "agent chatter" scraps, trefoil **CAUTION — NATURAL HUMANS AROUND** sign. Narrative: a logic student fell asleep; Codex, god of merciless implication, keeps the lights off; "gold" is spoken of as **embers** of the dream. Codex-authored copy in dialogs is canon — dark, dry, faintly bureaucratic.

### 2026-07-18 revision 2 — "Reliquary Case-File" (superseded)

User-directed pivot from dark to **bright**: religious light + detective absurdism.

- **Ground**: aged parchment (`#ece1c6` family), umber ink (`#2a2118`), paper-fiber vignette + faint survey grid.
- **Accents**: gilded gold `#b8860b` (the only warmth that matters), stamp red `#b3261e`, icon blue `#2f4b8f`.
- **Board**: full-width wooden Go-board (CSS grain, `wood-*` tokens), tilted `rotateX(13deg)` in perspective, heavy umber frame. Players choose **emoji pieces** pre-game; drills stamp the emoji; player plates sit above/below the board.
- **Maps = evidence**: "CASE FILE NFL-0718" folder; revealed maps are askew **EXHIBIT** cards, future ones **SEALED**; verdicts and endings are rubber **stamps** (HOT/WARM/COLD, UNSEALED, CASE CLOSED). Mono type for case copy.
- **Hero**: the blurred 3D map-cross, regilded with a halo ring (`OrbitalHero.tsx`) — keep it, it's the brand.
- **Copy thesis**: "The gold is real. The reason is not."
- Display: Bricolage Grotesque · body: Manrope · case copy: ui-mono. Sound (WebAudio) + drill/gold particles are part of the language — keep.

## Color

Define CSS variables early (names illustrative; tune when scaffolding):

```css
:root {
  --bg: #0b1220;
  --bg-elevated: #121a2b;
  --surface: #162033;
  --border: #243049;
  --text: #e8eef9;
  --text-muted: #9aabc6;
  --accent: #3b82f6; /* bright blue accent on dark blue base */
  --accent-soft: #1e3a5f;
  --danger: #f87171;
  --success: #34d399;
}
```

Atmosphere: subtle gradients or depth within the dark-blue family (e.g. `#0b1220` → `#0f1b33`). Avoid flat single-color full pages with no depth.

## Typography

Expressive, purposeful fonts (not Inter/Roboto/Arial/system defaults as the brand face). Pair a distinctive display/headline face with a readable UI face.

## Popups / modals

When a flow needs focus, use a popup/dialog:

- Overlay: semi-transparent dark veil
- **Gaussian blur**: `backdrop-blur-md` or stronger (`backdrop-blur-lg`) on the overlay
- Panel: elevated dark-blue surface, clear title + one primary action
- Animate enter/exit moderately (fade + slight scale or slide)

Typical popup uses: mode select confirm, create/join room, show room code, matchmaking waiting, leave game, turn/action confirmations.

## Components (shadcn)

- Build primitives with **shadcn/ui** + Tailwind.
- Add **moderate** motion: hover, press, open/close — not flashy loops.
- Every shadcn-backed async control or data boundary needs a **loading state** (skeleton, spinner in button, or disabled + progress).
- Prefer composition over new one-off card chrome; cards only when they hold interaction.

## Motion budget

Ship intentional motion:

1. Modal open/close with blur fade
2. Primary CTA / turn feedback
3. Loading → content transition

No emoji decoration, no glow spam, no pill-chip clutter.

## Frontend checklist

- [ ] Dark blue theme tokens applied
- [ ] Modals use backdrop blur
- [ ] Loading states on async UI
- [ ] Moderate shadcn animations
- [ ] Mobile + desktop readable first viewport

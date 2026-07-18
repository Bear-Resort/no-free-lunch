# Design system

## Direction

Modern and simplified. One clear composition per screen. Dark blue as the primary theme — not purple gradients, not warm cream editorial, not generic light SaaS.

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

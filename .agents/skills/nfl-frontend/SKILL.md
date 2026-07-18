---
name: nfl-frontend
description: >-
  Build No Free Lunch UI with React, Tailwind, and shadcn using a dark-blue
  theme, Gaussian-blur popups, moderate animations, and loading states. Use when
  working on frontend, components, modals, theme, styles, shadcn, or UX polish.
---

# NFL Frontend

## Stack

- React components
- Tailwind CSS for styles
- shadcn/ui for primitives (`src/components/ui/`)
- Game-specific UI under `src/components/game/`

## Design rules

1. **Modern, simplified** — one job per section; no cluttered dashboards on play surfaces.
2. **Dark blue main theme** — follow `docs/design-system.md` tokens; do not default to purple or cream editorial looks.
3. **Popups** — use dialogs when focus is needed (mode select, room code, matchmaking, confirms). Overlay must use **Gaussian blur** (`backdrop-blur-md` / `backdrop-blur-lg`) over a dimmed veil.
4. **Motion** — moderate enter/exit and hover on shadcn pieces; no noisy loops.
5. **Loading** — every async path (Convex queries, matchmaking, joins) shows an explicit loading state.

## Workflow

1. Read `docs/design-system.md`.
2. Prefer extending shadcn primitives over custom one-offs.
3. Put shared dialogs in reusable components (e.g. `BlurDialog`).
4. Wire loading via query undefined state, button `pending`, or skeletons.
5. Verify mobile + desktop layout.

## Popup pattern

```tsx
// Overlay: bg-black/50 backdrop-blur-md
// Panel: bg-[var(--bg-elevated)] border border-[var(--border)]
// Animate: fade + slight scale; keep duration ~150–250ms
```

## Do not

- Invent game rules in the UI copy beyond stubs
- Skip blur on modal overlays
- Ship buttons that fire mutations without pending/disabled UI

# Project vision (agent rule)

Turn-based game: React + Tailwind + shadcn frontend, Convex backend.

## Design

- Modern, simplified UI
- **Dark blue** main theme
- Popups/modals use **Gaussian blur** backdrops; use popups when focus is needed
- Moderate shadcn animations; explicit **loading states** for async UI

## Modes

1. Local — two players, same device, alternating rounds
2. Online — room via common code, or random pair
3. vs Agent — TBD later; stub only until specified

## Rules

Follow `.agents/rules/game-rules.md` (settled). Ask before changing rules. Also read `AGENTS.md`, `docs/product-vision.md`, and `docs/design-system.md`.

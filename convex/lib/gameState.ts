import { LUNCH_BREAK, STANDARD, type Variant } from "../engine/generation";
import { newGame, type Game } from "../engine/rules";

export type VariantName = "lunch-break" | "standard";

export function variantFromName(name: VariantName): Variant {
  return name === "lunch-break" ? LUNCH_BREAK : STANDARD;
}

export function serializeGame(game: Game): string {
  return JSON.stringify(game);
}

export function deserializeGame(json: string): Game {
  return JSON.parse(json) as Game;
}

/** Start engine state when both players are seated. Host is always Red. */
export function bootstrapGame(seed: string, variantName: VariantName): Game {
  return newGame(seed, variantFromName(variantName));
}

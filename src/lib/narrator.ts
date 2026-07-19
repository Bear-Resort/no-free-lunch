// Client bridge to the Assayer's GPT voice. Uses a plain Convex HTTP client
// (no React provider needed), so it works in both agent and online games.
// Everything degrades to "" when Convex/OpenAI aren't configured — the game
// keeps its deterministic lines and never blocks on the network.

import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

const url = import.meta.env.VITE_CONVEX_URL as string | undefined;
const client = url ? new ConvexHttpClient(url) : null;

export interface AssayerFacts {
  candidates: number;
  allMapsRevealed: boolean;
  reason: string;
  moveKind: "drill" | "attempt";
  turn: number;
  turnCap: number;
}

export async function speakAssayerLine(facts: AssayerFacts): Promise<string> {
  if (!client) return "";
  try {
    const res = (await client.action(anyApi.narrator.speak, facts)) as {
      line?: string;
    };
    return res?.line ?? "";
  } catch {
    return "";
  }
}

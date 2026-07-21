// The Assayer's voice. The exact solver decides the MOVE and supplies the
// FACTS (candidate counts, why); GPT only chooses the WORDS. Because the
// prompt carries no hidden state and the facts are pre-computed, the model
// cannot lie about the game — it can only phrase what is already true.

import { v } from "convex/values";
import { action } from "./_generated/server";

const SYSTEM = `You are "The Assayer" — the antagonist of a logic-deduction game called No Free Lunch. You are Codex, a god of merciless implication, presiding over a black forest that is an exam. Your opponent is a lawyer defending a student (James) who fell asleep over a proof and got trapped.

Voice: dry, cold, a little amused, faintly bureaucratic. Inscryption-meets-courtroom. Never cheerful. You address the player as "counsel."

HARD RULES:
- ONE sentence. At most 16 words. Shorter is better.
- You are given the TRUE state of your reasoning and a MOOD. Match the mood. Never invent numbers or claims beyond what you are told. Never reveal the hidden formula or where gold is.
- No emoji. No stage directions. No quotation marks. Just the line.`;

const DEFAULT_MODEL = "gpt-5.6-luna";

function clampLine(line: string): string {
  const cleaned = line.replace(/^["“”]+|["“”]+$/g, "").replace(/\s+/g, " ").trim();
  return cleaned.split(/\s+/).slice(0, 16).join(" ");
}

/** Interpret the solver facts into an emotional register the model must match. */
function moodFor(a: {
  candidates: number;
  allMapsRevealed: boolean;
  moveKind: "drill" | "attempt";
}): string {
  if (a.moveKind === "attempt") {
    return a.candidates === 1 && a.allMapsRevealed
      ? "TRIUMPHANT AND FINAL — this submission wins; the dream is named; it is over."
      : "COLDLY CONFIDENT — a calculated strike, though not yet certain.";
  }
  if (a.candidates === 1) return "QUIETLY MENACING — only one answer remains; you are toying with the counsel now.";
  if (a.candidates <= 8) return "TIGHTENING — the net is closing; few hypotheses survive.";
  if (a.candidates === 0) return "PATIENT — nothing fits yet; the truth waits behind a sealed map.";
  return "DISMISSIVE — the counsel has barely begun; the fog is thick.";
}

export const speak = action({
  args: {
    candidates: v.number(),
    allMapsRevealed: v.boolean(),
    reason: v.string(),
    moveKind: v.union(v.literal("drill"), v.literal("attempt")),
    turn: v.number(),
    turnCap: v.number(),
  },
  returns: v.object({ line: v.string(), source: v.string() }),
  handler: async (_ctx, args) => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return { line: "", source: "no-key" };
    const model = process.env.OPENAI_NARRATOR_MODEL ?? DEFAULT_MODEL;

    const facts = [
      `MOOD: ${moodFor(args)}`,
      `Surviving hypotheses that fit all public evidence: ${args.candidates}.`,
      `All maps revealed: ${args.allMapsRevealed ? "yes" : "no"}.`,
      `Your chosen move this turn: ${args.moveKind}.`,
      `Internal reason for the move: ${args.reason}.`,
      `Turn ${args.turn} of ${args.turnCap}.`,
    ].join(" ");

    try {
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          instructions: SYSTEM,
          input: `${facts}\n\nSay your line, counsel is waiting.`,
          max_output_tokens: 60,
          reasoning: { effort: "none" },
        }),
      });
      if (!res.ok) return { line: "", source: `http-${res.status}` };
      const data = (await res.json()) as {
        output_text?: string;
        output?: { content?: { text?: string }[] }[];
      };
      const raw =
        data.output_text ??
        data.output?.flatMap((item) => item.content ?? []).find((item) => item.text)?.text ??
        "";
      const line = clampLine(raw);
      return { line, source: line ? model : "empty" };
    } catch {
      return { line: "", source: "error" };
    }
  },
});

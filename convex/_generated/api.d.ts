/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as engine_ai from "../engine/ai.js";
import type * as engine_bitboard from "../engine/bitboard.js";
import type * as engine_formula from "../engine/formula.js";
import type * as engine_generation from "../engine/generation.js";
import type * as engine_program from "../engine/program.js";
import type * as engine_rng from "../engine/rng.js";
import type * as engine_rules from "../engine/rules.js";
import type * as engine_solver from "../engine/solver.js";
import type * as lib_capacity from "../lib/capacity.js";
import type * as lib_forfeit from "../lib/forfeit.js";
import type * as lib_gameState from "../lib/gameState.js";
import type * as lib_presence from "../lib/presence.js";
import type * as lib_roomCode from "../lib/roomCode.js";
import type * as narrator from "../narrator.js";
import type * as online from "../online.js";
import type * as onlineCleanup from "../onlineCleanup.js";
import type * as onlinePlay from "../onlinePlay.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  "engine/ai": typeof engine_ai;
  "engine/bitboard": typeof engine_bitboard;
  "engine/formula": typeof engine_formula;
  "engine/generation": typeof engine_generation;
  "engine/program": typeof engine_program;
  "engine/rng": typeof engine_rng;
  "engine/rules": typeof engine_rules;
  "engine/solver": typeof engine_solver;
  "lib/capacity": typeof lib_capacity;
  "lib/forfeit": typeof lib_forfeit;
  "lib/gameState": typeof lib_gameState;
  "lib/presence": typeof lib_presence;
  "lib/roomCode": typeof lib_roomCode;
  narrator: typeof narrator;
  online: typeof online;
  onlineCleanup: typeof onlineCleanup;
  onlinePlay: typeof onlinePlay;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

import type { TasteMode } from "./pack.js";

export type ModeTrigger =
  | "explicit_mode"
  | "established_direction"
  | "new_direction"
  | "direction_accepted"
  | "unclear";

export interface ModeResolutionInput {
  currentMode?: TasteMode;
  trigger: ModeTrigger;
  explicitMode?: TasteMode;
  userConfirmed?: boolean;
  rationale: string;
}

export interface ModeResolution {
  status: "selected" | "needs_user";
  mode: TasteMode | null;
  transition: "start" | "stay" | "switch" | null;
  rationale: string;
  question?: string;
}

/**
 * Deprecated task-local helper. Maps an already-interpreted signal to a word
 * the agent can say. It does not read the Pack, does not derive part activity,
 * and does not decide who initiates a change between Expression and Conformance.
 * Product truth is Decision status + shipped evidence + coverage gap
 * (`readPartState`). This function never interprets raw user language.
 */
export function resolveTasteMode(input: ModeResolutionInput): ModeResolution {
  const rationale = input.rationale.trim();
  const ask = (question: string): ModeResolution => ({
    status: "needs_user",
    mode: null,
    transition: null,
    rationale,
    question,
  });

  if (!rationale) {
    return ask("Ask the user to clarify the intended mode and record the reason for the choice.");
  }

  let mode: TasteMode;
  switch (input.trigger) {
    case "explicit_mode":
      if (!input.explicitMode) return ask("The user requested an explicit mode, but the requested mode was not provided.");
      mode = input.explicitMode;
      break;
    case "established_direction":
      mode = "conformance";
      break;
    case "new_direction":
      mode = "expression";
      break;
    case "direction_accepted":
      if (input.userConfirmed !== true) {
        return ask("Ask through the harness whether the proposed direction is accepted as product guidance before switching to Conformance.");
      }
      mode = "conformance";
      break;
    case "unclear":
      return ask("Ask one focused question through the harness to determine whether the user wants established product direction or a new direction.");
  }

  if (input.currentMode === "expression" && mode === "conformance" && input.trigger !== "explicit_mode" && input.trigger !== "direction_accepted") {
    return ask("Confirm through the harness that the user accepts the proposed Expression direction as product guidance before switching to Conformance.");
  }

  const transition = input.currentMode === undefined
    ? "start"
    : input.currentMode === mode
      ? "stay"
      : "switch";
  return { status: "selected", mode, transition, rationale };
}

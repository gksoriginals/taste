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
 * Resolves an LLM-interpreted product intent signal into a task mode.
 * This function never interprets raw user language; the product Skill does.
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

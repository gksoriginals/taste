import assert from "node:assert/strict";
import test from "node:test";
import { resolveTasteMode } from "../src/core/mode.js";

test("mode routing deterministically resolves LLM-interpreted task signals", () => {
  assert.deepEqual(resolveTasteMode({ trigger: "established_direction", rationale: "The task follows an accepted product pattern." }), {
    status: "selected",
    mode: "conformance",
    transition: "start",
    rationale: "The task follows an accepted product pattern.",
  });
  assert.equal(resolveTasteMode({ currentMode: "conformance", trigger: "new_direction", rationale: "The user asks to explore a different direction." }).transition, "switch");
  assert.equal(resolveTasteMode({ currentMode: "expression", trigger: "direction_accepted", userConfirmed: true, rationale: "The user accepted the proposed direction as product policy." }).mode, "conformance");
});

test("unclear or unconfirmed mode transitions ask through the harness", () => {
  const unclear = resolveTasteMode({ currentMode: "conformance", trigger: "unclear", rationale: "The request mixes matching and redesigning." });
  assert.equal(unclear.status, "needs_user");
  assert.equal(unclear.mode, null);
  assert.match(unclear.question ?? "", /through the harness/);

  const unconfirmed = resolveTasteMode({ currentMode: "expression", trigger: "direction_accepted", rationale: "A design option looks promising but was not explicitly approved." });
  assert.equal(unconfirmed.status, "needs_user");
  assert.equal(unconfirmed.mode, null);
  assert.match(unconfirmed.question ?? "", /accepted as product guidance/);

  const unsupportedTransition = resolveTasteMode({ currentMode: "expression", trigger: "established_direction", rationale: "The agent inferred that an option was accepted, but the user did not confirm it." });
  assert.equal(unsupportedTransition.status, "needs_user");
  assert.equal(unsupportedTransition.mode, null);
});

test("an explicit mode request is honored and rationale is required", () => {
  assert.equal(resolveTasteMode({ trigger: "explicit_mode", explicitMode: "expression", rationale: "The user explicitly requested Expression." }).mode, "expression");
  assert.equal(resolveTasteMode({ trigger: "explicit_mode", explicitMode: "expression", rationale: "  " }).status, "needs_user");
});

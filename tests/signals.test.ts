import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { initializePack } from "../src/core/pack.js";
import { deriveDecisionActivity, readPartState, recordSignal } from "../src/core/signals.js";

async function withPack(run: (repositoryPath: string) => Promise<void>): Promise<void> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "taste-signal-test-"));
  try {
    await initializePack(directory, "Signal Product");
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("derived activity follows acceptance, shipped evidence, and coverage gap", () => {
  assert.deepEqual(deriveDecisionActivity({ status: "accepted", shipped: true, coverageGap: false }), {
    activity: "conformance",
    reason: "accepted_shipped",
  });
  assert.equal(deriveDecisionActivity({ status: "proposed", shipped: true, coverageGap: false }).activity, "expression");
  assert.equal(deriveDecisionActivity({ status: "accepted", shipped: false, coverageGap: false }).reason, "accepted_not_shipped");
  assert.equal(deriveDecisionActivity({ status: "accepted", shipped: true, coverageGap: true }).reason, "coverage_gap");
  assert.equal(deriveDecisionActivity({ status: "rejected", shipped: true, coverageGap: false }).reason, "rejected");
});

test("an empty Pack derives Expression and does not flip other parts when one part gains a gap", async () => {
  await withPack(async (repositoryPath) => {
    const empty = await readPartState(repositoryPath);
    assert.equal(empty.scopes[0]?.reason, "no_decisions");
    assert.equal(empty.anyPartNeedsExpression, true);

    const shipped = await recordSignal(repositoryPath, {
      id: "primary-button",
      title: "One primary button",
      statement: "Use one filled primary button per screen.",
      status: "accepted",
      trigger: "interview",
      scope: "settings",
      shippedEvidence: ["src/screens/Settings.tsx"],
    });
    assert.equal(shipped.activity, "conformance");

    await recordSignal(repositoryPath, {
      id: "error-placement",
      title: "Errors sit under the field",
      statement: "Field errors render under the field.",
      status: "accepted",
      trigger: "sweep",
      scope: "checkout",
      shippedEvidence: ["checkout screenshot 2026-11-01"],
    });

    const corrected = await recordSignal(repositoryPath, {
      id: "primary-button",
      title: "One primary button",
      statement: "Use one filled primary button per screen.",
      rationale: "The generated settings screen shipped two primaries.",
      status: "proposed",
      trigger: "rejected_pass",
      scope: "settings",
      coverageGap: true,
      coverageGapNote: "Accepted rule did not survive the settings screen.",
    });
    assert.equal(corrected.activity, "expression");
    assert.match(corrected.content, /rejected_pass/);

    const settings = await readPartState(repositoryPath, "settings");
    assert.equal(settings.scopes.length, 1);
    assert.equal(settings.scopes[0]?.activity, "expression");
    assert.equal(settings.decisions.some((decision) => decision.id === "error-placement"), false);

    const all = await readPartState(repositoryPath);
    const checkout = all.scopes.find((scope) => scope.scope === "checkout");
    const settingsPart = all.scopes.find((scope) => scope.scope === "settings");
    assert.equal(checkout?.activity, "conformance");
    assert.equal(settingsPart?.activity, "expression");
    assert.equal(all.anyPartNeedsExpression, true);
  });
});

test("recording a signal rejects an unsafe id", async () => {
  await withPack(async (repositoryPath) => {
    await assert.rejects(
      () => recordSignal(repositoryPath, {
        id: "../escape",
        title: "Nope",
        statement: "Do not write outside the Pack.",
        status: "proposed",
        trigger: "interview",
      }),
      /lowercase slug/,
    );
  });
});

import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { initializePack, writePackFile } from "../src/core/pack.js";
import { decisionPath, deriveDecisionActivity, parseDecision, readPartState, recordSignal } from "../src/core/signals.js";

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

test("missing or invalid coverage_gap does not derive Conformance", async () => {
  const acceptedShipped = (id: string, coverageGapLine: string) => `---
id: ${id}
title: One primary button
status: accepted
trigger: interview
scope: settings
${coverageGapLine}shipped: true
---

# One primary button

## Statement

Use one filled primary button per screen.

## Shipped evidence

- src/screens/Settings.tsx
`;

  const missing = parseDecision({ path: decisionPath("missing-gap"), content: acceptedShipped("missing-gap", "") });
  const invalid = parseDecision({ path: decisionPath("invalid-gap"), content: acceptedShipped("invalid-gap", "coverage_gap: yes\n") });
  assert.equal(missing.parsed, false);
  assert.equal(invalid.parsed, false);

  await withPack(async (repositoryPath) => {
    await writePackFile(repositoryPath, decisionPath("missing-gap"), acceptedShipped("missing-gap", ""));
    await writePackFile(repositoryPath, decisionPath("invalid-gap"), acceptedShipped("invalid-gap", "coverage_gap: yes\n"));
    const state = await readPartState(repositoryPath);
    for (const id of ["missing-gap", "invalid-gap"]) {
      const decision = state.decisions.find((item) => item.id === id);
      assert.equal(decision?.reason, "unparsed");
      assert.equal(decision?.activity, "expression");
    }
    assert.equal(state.scopes.every((scope) => scope.activity === "expression"), true);
    await assert.rejects(
      () => recordSignal(repositoryPath, {
        id: "missing-gap",
        title: "One primary button",
        statement: "Use one filled primary button per screen.",
        status: "accepted",
        trigger: "interview",
      }),
      /coverage_gap/,
    );
  });
});

test("updating status keeps omitted evidence and notes", async () => {
  await withPack(async (repositoryPath) => {
    await recordSignal(repositoryPath, {
      id: "primary-button",
      title: "One primary button",
      statement: "Use one filled primary button per screen.",
      rationale: "Reviewed against the shipped settings screen.",
      status: "proposed",
      trigger: "sweep",
      scope: "settings",
      shippedEvidence: ["src/screens/Settings.tsx", "screenshot 2026-11-01"],
      coverageGap: true,
      coverageGapNote: "Spacing is still unsettled.",
      knownFlaws: "Icon button sometimes looks primary.",
      alternatives: "Two primary buttons was rejected.",
    });

    const updated = await recordSignal(repositoryPath, {
      id: "primary-button",
      title: "One primary button",
      statement: "Use one filled primary button per screen.",
      status: "accepted",
      trigger: "sweep",
    });

    assert.equal(updated.activity, "expression");
    assert.equal(updated.reason, "coverage_gap");
    assert.match(updated.content, /status: accepted/);
    assert.match(updated.content, /coverage_gap: true/);
    assert.match(updated.content, /scope: settings/);
    assert.match(updated.content, /src\/screens\/Settings\.tsx/);
    assert.match(updated.content, /screenshot 2026-11-01/);
    assert.match(updated.content, /Reviewed against the shipped settings screen/);
    assert.match(updated.content, /Spacing is still unsettled/);
    assert.match(updated.content, /Icon button sometimes looks primary/);
    assert.match(updated.content, /Two primary buttons was rejected/);

    const replaced = await recordSignal(repositoryPath, {
      id: "primary-button",
      title: "One primary button",
      statement: "Use one filled primary button per screen.",
      status: "accepted",
      trigger: "sweep",
      rationale: "Replaced rationale.",
      shippedEvidence: ["docs/new.png"],
    });
    assert.match(replaced.content, /Replaced rationale/);
    assert.match(replaced.content, /docs\/new.png/);
    assert.doesNotMatch(replaced.content, /Settings\.tsx/);
    assert.match(replaced.content, /Icon button sometimes looks primary/);
    assert.match(replaced.content, /Spacing is still unsettled/);
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

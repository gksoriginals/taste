import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { initializePack, writeDecisionFile } from "../src/core/pack.js";
import { decisionPath, deriveDecisionActivity, parseDecision, readPartState, recordSignal, type SignalInput } from "../src/core/signals.js";

async function withPack(run: (repositoryPath: string) => Promise<void>): Promise<void> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "taste-signal-test-"));
  try {
    await initializePack(directory, "Signal Product");
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function promotedSignal(overrides: Partial<SignalInput> = {}): SignalInput {
  const artifact = overrides.validatedArtifact ?? "commit:abc123";
  return {
    id: "primary-button",
    title: "One primary button",
    statement: "Use one filled primary button per screen.",
    status: "accepted",
    trigger: "interview",
    validatedArtifact: artifact,
    validationEvidence: ["Host reports: project checks passed for commit abc123."],
    userApprovedArtifact: artifact,
    userApprovalEvidence: "Host reports: user approved commit abc123 and this Decision.",
    coverageGap: false,
    ...overrides,
  };
}

test("Conformance requires accepted, validated, user-approved, shipped evidence without a gap", () => {
  assert.equal(deriveDecisionActivity({ status: "accepted", shipped: true, coverageGap: false }).reason, "promotion_evidence_missing");
  assert.equal(deriveDecisionActivity({ status: "accepted", shipped: false, coverageGap: false, promotionEvidenceComplete: true }).reason, "accepted_not_shipped");
  assert.deepEqual(deriveDecisionActivity({ status: "accepted", shipped: true, coverageGap: false, promotionEvidenceComplete: true }), {
    activity: "conformance",
    reason: "accepted_shipped",
  });
  assert.equal(deriveDecisionActivity({ status: "accepted", shipped: true, coverageGap: true, promotionEvidenceComplete: true }).activity, "expression");
  assert.equal(deriveDecisionActivity({ status: "rejected", shipped: true, coverageGap: false, promotionEvidenceComplete: true }).reason, "rejected");
  assert.equal(deriveDecisionActivity({ status: "proposed", shipped: true, coverageGap: false, promotionEvidenceComplete: true }).reason, "proposed");
});

test("early feedback cannot write; finalized artifacts promote per part and artifact changes clear shipped evidence", async () => {
  await withPack(async (repositoryPath) => {
    const empty = await readPartState(repositoryPath);
    assert.equal(empty.scopes[0]?.activity, "expression");
    assert.equal(empty.scopes[0]?.reason, "no_decisions");

    await assert.rejects(() => recordSignal(repositoryPath, promotedSignal({ status: "proposed" })), /Only accepted Decisions/);
    await assert.rejects(() => recordSignal(repositoryPath, promotedSignal({ userApprovedArtifact: "draft-v0" })), /exact validated artifact/);
    await assert.rejects(() => recordSignal(repositoryPath, promotedSignal({ validationEvidence: [] })), /At least one host-reported validation/);
    await assert.rejects(() => recordSignal(repositoryPath, promotedSignal({ coverageGap: true })), /Resolve the coverage gap/);
    assert.equal((await readPartState(repositoryPath)).decisions.length, 0);

    const readyBeforePush = await recordSignal(repositoryPath, promotedSignal({ scope: "Settings" }));
    assert.equal(readyBeforePush.reason, "accepted_not_shipped");

    const profile = await recordSignal(repositoryPath, promotedSignal({
      id: "profile-heading",
      title: "Clear profile heading",
      statement: "Profile settings have a clear page title.",
      scope: "Profile",
      validatedArtifact: "commit:def456",
      userApprovedArtifact: "commit:def456",
      validationEvidence: ["Host reports: project checks passed for commit def456."],
      userApprovalEvidence: "Host reports: user approved commit def456 and this Decision.",
    }));
    assert.equal(profile.reason, "accepted_not_shipped");

    const settingsShipped = await recordSignal(repositoryPath, promotedSignal({
      scope: "Settings",
      shippedEvidence: ["https://example.test/settings — inspected deployed settings flow"],
    }));
    assert.equal(settingsShipped.reason, "accepted_shipped");

    const beforeCorrection = await readPartState(repositoryPath);
    assert.equal(beforeCorrection.scopes.find((item) => item.scope === "Settings")?.activity, "conformance");
    assert.equal(beforeCorrection.scopes.find((item) => item.scope === "Profile")?.activity, "expression");

    const correctionTask = await readPartState(repositoryPath, "Settings", "correction");
    assert.equal(correctionTask.scopes.find((item) => item.scope === "Settings")?.activity, "conformance");
    assert.deepEqual(correctionTask.taskRouting, {
      scope: "Settings",
      activity: "expression",
      intent: "correction",
      note: "The current task corrects existing UI or product guidance, so use Expression for this task even if the Pack contains Conformance Decisions.",
    });
    const unclearTask = await readPartState(repositoryPath, "Settings", "unclear");
    assert.equal(unclearTask.taskRouting?.activity, "expression");
    assert.equal(unclearTask.taskRouting?.intent, "unclear");

    const correctedReleaseCandidate = await recordSignal(repositoryPath, promotedSignal({
      scope: "Settings",
      statement: "Use one filled primary button per screen, with an explicit saved state.",
      trigger: "rejected_pass",
      validatedArtifact: "commit:ghi789",
      userApprovedArtifact: "commit:ghi789",
      validationEvidence: ["Host reports: updated settings tests passed at commit ghi789."],
      userApprovalEvidence: "Host reports: user approved the tested settings update at commit ghi789.",
    }));
    assert.equal(correctedReleaseCandidate.reason, "accepted_not_shipped");
    assert.doesNotMatch(correctedReleaseCandidate.content, /https:\/\/example\.test\/settings/);

    const afterCorrection = await readPartState(repositoryPath);
    assert.equal(afterCorrection.scopes.find((item) => item.scope === "Settings")?.activity, "expression");
    assert.equal(afterCorrection.scopes.find((item) => item.scope === "Profile")?.activity, "expression");

    await recordSignal(repositoryPath, promotedSignal({
      scope: "Settings",
      statement: "Use one filled primary button per screen, with an explicit saved state.",
      trigger: "rejected_pass",
      validatedArtifact: "commit:ghi789",
      userApprovedArtifact: "commit:ghi789",
      validationEvidence: ["Host reports: updated settings tests passed at commit ghi789."],
      userApprovalEvidence: "Host reports: user approved the tested settings update at commit ghi789.",
      shippedEvidence: ["https://example.test/settings — inspected deployed settings flow at commit ghi789"],
    }));
    const afterPush = await readPartState(repositoryPath, "Settings");
    assert.equal(afterPush.scopes[0]?.activity, "conformance");
  });
});

test("legacy accepted shipped Decisions without promotion evidence remain Expression", async () => {
  await withPack(async (repositoryPath) => {
    const legacy = `---\nid: legacy-rule\ntitle: Legacy rule\nstatus: accepted\ntrigger: sweep\nscope: settings\ncoverage_gap: false\nshipped: true\n---\n\n# Legacy rule\n\n## Statement\n\nUse one primary button.\n\n## Shipped evidence\n\n- src/Settings.tsx\n`;
    const file = await writeDecisionFile(repositoryPath, decisionPath("legacy-rule"), legacy);
    const parsed = parseDecision(file);
    assert.equal(parsed.parsed, true);
    if (parsed.parsed) assert.equal(parsed.promotionEvidenceComplete, false);
    const state = await readPartState(repositoryPath, "settings");
    assert.equal(state.scopes[0]?.activity, "expression");
    assert.equal(state.scopes[0]?.reason, "promotion_evidence_missing");
  });
});

test("updating a Decision replaces validation evidence and preserves context for the same artifact", async () => {
  await withPack(async (repositoryPath) => {
    await recordSignal(repositoryPath, promotedSignal({
      scope: "settings",
      rationale: "The verified settings flow has one primary action.",
      shippedEvidence: ["src/screens/Settings.tsx"],
      knownFlaws: "The old saved state is not announced.",
      alternatives: "Two primary buttons were rejected.",
    }));

    const updated = await recordSignal(repositoryPath, promotedSignal({
      scope: "settings",
      validationEvidence: ["Host reports: accessibility and interaction checks passed at commit abc123."],
      userApprovalEvidence: "Host reports: user approved the tested artifact and updated Decision.",
    }));
    assert.match(updated.content, /The verified settings flow/);
    assert.match(updated.content, /accessibility and interaction checks passed/);
    assert.match(updated.content, /user approved the tested artifact/);
    assert.match(updated.content, /src\/screens\/Settings\.tsx/);
    assert.match(updated.content, /The old saved state is not announced/);
    assert.match(updated.content, /Two primary buttons were rejected/);
    assert.doesNotMatch(updated.content, /Host reports: project checks passed for commit abc123/);
  });
});

test("recording a Decision rejects an unsafe id", async () => {
  await withPack(async (repositoryPath) => {
    await assert.rejects(
      () => recordSignal(repositoryPath, promotedSignal({ id: "../escape" })),
      /lowercase slug/,
    );
  });
});

test("Decision promotion evidence rejects a mismatched artifact reference", async () => {
  await withPack(async (repositoryPath) => {
    await assert.rejects(
      () => recordSignal(repositoryPath, promotedSignal({ userApprovedArtifact: "commit:different" })),
      /exact validated artifact/,
    );
  });
});

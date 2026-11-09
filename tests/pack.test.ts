import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  getEvaluationGeneratorCase,
  getEvaluationJudgePacket,
  initializePack,
  inspectPack,
  listEvaluationFixtures,
  readPackFile,
  validatePack,
  writePackFile,
} from "../src/core/pack.js";
import type { MinimumUsableEvidence, RenderedState, SetupCoverage, SetupScope } from "../src/core/pack.js";

async function withRepository(run: (repositoryPath: string) => Promise<void>): Promise<void> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "taste-pack-test-"));
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function prepareEvidencePack(repositoryPath: string, minimumUsableEvidence: MinimumUsableEvidence = "source_reviewed", renderedIds: string[] = []): Promise<void> {
  await initializePack(repositoryPath, "Example Product", ["Admin login"], { minimumUsableEvidence });
  const packRoot = path.join(repositoryPath, "taste");
  await writeFile(path.join(packRoot, "README.md"), "# Example Product Taste Pack\n\nEvidence-backed guidance for the selected Admin and Portal journeys.\n");
  await writeFile(path.join(packRoot, "skills/product-design/SKILL.md"), "---\nname: product-design\ndescription: Product-specific Admin and Portal guidance.\n---\n# Product design\nRoute tasks by the affected app and journey.\n");
  const definitions = [
    { id: "admin.login", app: "Admin", surface: "Authentication", journey: "OTP login", ref: "src/admin/routes.ts", file: "skills/product-design/references/admin-login.md", status: "source_reviewed" as const },
    { id: "portal.profile", app: "Portal", surface: "Profile", journey: "Edit profile", ref: "src/portal/profile.tsx", file: "skills/product-design/references/portal-profile.md", status: "source_reviewed" as const },
    { id: "portal.billing", app: "Portal", surface: "Billing", journey: "View invoices", ref: "src/portal/billing.tsx", file: "skills/product-design/references/portal-billing.md", status: "blocked" as const },
  ];
  const coverage: SetupCoverage[] = [];
  for (const definition of definitions) {
    const rendered = renderedIds.includes(definition.id);
    await mkdir(path.dirname(path.join(packRoot, definition.file)), { recursive: true });
    await mkdir(path.dirname(path.join(repositoryPath, definition.ref)), { recursive: true });
    await writeFile(path.join(repositoryPath, definition.ref), `// ${definition.app} ${definition.surface} source\n`);
    await writeFile(path.join(packRoot, definition.file), `# ${definition.app} ${definition.surface}\n\nFor this journey, keep the task scoped to the documented product behavior and preserve its validation and recovery states. Source: ${definition.ref}. Visual behavior is not verified by this source-only evidence.\n`);
    coverage.push({
      id: definition.id,
      app: definition.app,
      surface: definition.surface,
      journey: definition.journey,
      status: rendered ? "rendered" : definition.status,
      evidence: [
        { type: "source_reviewed", reference: definition.ref, checkedAt: "2026-11-04" },
        ...(rendered ? [{ type: "rendered" as const, reference: `screenshots/${definition.id}.png`, checkedAt: "2026-11-04" }] : []),
      ],
      guidanceFiles: [definition.file],
      ...(rendered ? { statesObserved: ["populated", "error"] as RenderedState[] } : {}),
      ...(definition.status === "blocked" && !rendered
        ? { gap: "Local authenticated access is not available.", accessAttempts: ["docker compose up -d: daemon not running and could not be started"] }
        : {}),
    });
  }
  const scope: SetupScope = {
    description: "Representative Admin authentication and Portal profile/billing journeys.",
    selection: "user_confirmed",
    repositoryApps: ["Admin", "Portal"],
    products: ["Admin", "Portal"],
    exclusions: ["Other Portal routes share the inspected layout and remain a later sweep target."],
    coverageTarget: "Render all required journeys and corroborate them with source.",
    requiredCoverage: definitions.map((definition) => definition.id),
  };
  const manifestPath = path.join(packRoot, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
  await writeFile(manifestPath, JSON.stringify({ ...manifest, setupScope: scope, coverage }, null, 2) + "\n");
}

async function markRenderedCoverage(repositoryPath: string, ids: string[]): Promise<void> {
  const manifestPath = path.join(repositoryPath, "taste/manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
  const coverage = manifest.coverage as SetupCoverage[];
  const updated = coverage.map((entry) => ids.includes(entry.id)
    ? {
      ...entry,
      status: "rendered" as const,
      evidence: [...entry.evidence, { type: "rendered" as const, reference: `screenshots/${entry.id}.png`, checkedAt: "2026-11-04" }],
      statesObserved: ["populated"] as SetupCoverage["statesObserved"],
      gap: undefined,
      accessAttempts: undefined,
    }
    : entry);
  await writeFile(manifestPath, JSON.stringify({ ...manifest, coverage: updated }, null, 2) + "\n");
}

test("initializes an in-progress product-specific Pack shell without touching repository instructions", async () => {
  await withRepository(async (repositoryPath) => {
    const originalInstructions = "Use the existing repository workflow.\n";
    await writeFile(path.join(repositoryPath, "AGENTS.md"), originalInstructions);

    const result = await initializePack(repositoryPath, "Example Product", ["checkout"]);
    const inspection = await inspectPack(repositoryPath);

    assert.equal(result.packPath, "taste");
    assert.ok(result.filesCreated.includes("skills/product-design/SKILL.md"));
    assert.equal(result.filesCreated.length, 3);
    assert.equal(result.filesCreated.some((file) => file.includes("references/")), false);
    assert.equal(inspection.manifest?.name, "Example Product");
    assert.equal(inspection.manifest?.setupStatus, "in_progress");
    assert.deepEqual(inspection.manifest?.setupPolicy, { minimumUsableEvidence: "source_reviewed" });
    assert.equal(inspection.layout, "product-specific");
    assert.equal(inspection.validation.valid, false);
    assert.equal(inspection.setupStatus, "in_progress");
    assert.ok(inspection.validation.issues.some((issue) => /setup is in progress/.test(issue.message)));
    assert.equal(inspection.entrySkillAvailable, true);
    assert.equal(await readFile(path.join(repositoryPath, "AGENTS.md"), "utf8"), originalInstructions);
    const starter = await readFile(path.join(repositoryPath, "taste/skills/product-design/SKILL.md"), "utf8");
    assert.match(starter, /short routing index/);
    assert.match(starter, /cite committed code surfaces/i);
    assert.match(starter, /do not inventory screens/i);
    assert.doesNotMatch(starter, /## Apply this Pack/);
    assert.deepEqual(inspection.validation.warnings, []);
  });
});

test("initialization never overwrites an existing Pack", async () => {
  await withRepository(async (repositoryPath) => {
    await initializePack(repositoryPath, "Example Product");
    const pathToReadme = path.join(repositoryPath, "taste/README.md");
    const original = await readFile(pathToReadme, "utf8");

    await assert.rejects(() => initializePack(repositoryPath, "Different Product"), /never overwrites/);
    assert.equal(await readFile(pathToReadme, "utf8"), original);
  });
});

test("source-reviewed evidence can make a Pack usable_partial while blocked journeys stay visible", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath);
    const manifestPath = path.join(repositoryPath, "taste/manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
    await writeFile(manifestPath, JSON.stringify({ ...manifest, setupStatus: "usable_partial" }, null, 2) + "\n");

    const inspection = await inspectPack(repositoryPath);
    assert.equal(inspection.setupStatus, "usable_partial");
    assert.deepEqual(inspection.coverageSummary, { sourceReviewed: 2, rendered: 0, renderedPopulated: 0, blocked: 1, notInspected: 0, required: 3, targetMet: false });
    assert.equal(inspection.validation.valid, true, JSON.stringify(inspection.validation.issues));
  });
});

test("an in-progress Pack can still serve its existing evidence-backed surface guidance", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath);
    const inspection = await inspectPack(repositoryPath);
    const guidance = await readPackFile(repositoryPath, "skills/product-design/references/admin-login.md");

    assert.equal(inspection.setupStatus, "in_progress");
    assert.equal(inspection.coverageSummary.sourceReviewed, 2);
    assert.match(guidance.content, /preserve its validation and recovery states/);
    assert.match(guidance.content, /Source: src\/admin\/routes\.ts/);
  });
});

test("required not-inspected coverage must record attempts or a reason it was out of scope", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath);
    const manifestPath = path.join(repositoryPath, "taste/manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { setupStatus: string; coverage: SetupCoverage[] };
    const coverage = manifest.coverage.map((entry) => entry.id === "portal.profile"
      ? { ...entry, status: "not_inspected" as const, gap: "Another documented test account was not tried.", evidence: [], guidanceFiles: [] }
      : entry);
    await writeFile(manifestPath, JSON.stringify({ ...manifest, setupStatus: "usable_partial", coverage }, null, 2) + "\n");

    const missingAttempts = await validatePack(repositoryPath);
    assert.ok(missingAttempts.issues.some((issue) => /portal\.profile.*not_inspected.*without accessAttempts/.test(issue.message)));

    const withReason = coverage.map((entry) => entry.id === "portal.profile"
      ? { ...entry, gap: "Not attempted because this tenant is explicitly out of scope for the confirmed setup." }
      : entry);
    await writeFile(manifestPath, JSON.stringify({ ...manifest, setupStatus: "usable_partial", coverage: withReason }, null, 2) + "\n");
    const scopedOut = await validatePack(repositoryPath);
    assert.equal(scopedOut.issues.some((issue) => /portal\.profile.*not_inspected.*without accessAttempts/.test(issue.message)), false);
  });
});

test("usable guidance cites its source path inside the portable Pack reference", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath);
    const manifestPath = path.join(repositoryPath, "taste/manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { setupStatus: string; coverage: SetupCoverage[] };
    for (const entry of manifest.coverage) {
      const guidancePath = path.join(repositoryPath, "taste", entry.guidanceFiles[0]);
      await writeFile(guidancePath, `# ${entry.surface}\n\nPreserve the user's progress when identity verification is interrupted, and make the recovery action clear. Visual behavior is not verified by source-only evidence.\n`);
    }
    await writeFile(manifestPath, JSON.stringify({ ...manifest, setupStatus: "usable_partial" }, null, 2) + "\n");
    const uncited = await validatePack(repositoryPath);
    assert.ok(uncited.issues.some((issue) => /No surface has specific, cited guidance/.test(issue.message)));

    for (const entry of manifest.coverage) {
      const guidancePath = path.join(repositoryPath, "taste", entry.guidanceFiles[0]);
      const reference = entry.evidence.find((evidence) => evidence.type === "source_reviewed")?.reference;
      await writeFile(guidancePath, `# ${entry.surface}\n\nPreserve the user's progress when identity verification is interrupted, and make the recovery action clear.\n\n**Code evidence:** \`${reference}\`. Visual behavior is not verified by source-only evidence.\n`);
    }
    const cited = await validatePack(repositoryPath);
    assert.equal(cited.issues.some((issue) => /No surface has specific, cited guidance/.test(issue.message)), false);
  });
});

test("rendered_flow policy rejects source-only guidance and accepts a rendered representative journey", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath, "rendered_flow");
    const manifestPath = path.join(repositoryPath, "taste/manifest.json");
    let manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
    await writeFile(manifestPath, JSON.stringify({ ...manifest, setupStatus: "usable_partial" }, null, 2) + "\n");
    const sourceOnly = await validatePack(repositoryPath);
    assert.equal(sourceOnly.valid, false);
    assert.ok(sourceOnly.issues.some((issue) => /minimumUsableEvidence=rendered_flow/.test(issue.message)));

    await markRenderedCoverage(repositoryPath, ["admin.login"]);
    manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
    await writeFile(manifestPath, JSON.stringify({ ...manifest, setupStatus: "usable_partial" }, null, 2) + "\n");
    const rendered = await validatePack(repositoryPath);
    assert.equal(rendered.valid, true, JSON.stringify(rendered.issues));
  });
});

test("complete status requires every confirmed coverage target to be rendered and source-correlated", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath, "source_reviewed", ["admin.login", "portal.profile"]);
    const manifestPath = path.join(repositoryPath, "taste/manifest.json");
    let manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
    await writeFile(manifestPath, JSON.stringify({ ...manifest, setupStatus: "complete" }, null, 2) + "\n");
    const blocked = await validatePack(repositoryPath);
    assert.equal(blocked.valid, false);
    assert.ok(blocked.issues.some((issue) => /portal.billing.*not rendered/.test(issue.message)));

    await markRenderedCoverage(repositoryPath, ["admin.login", "portal.profile", "portal.billing"]);
    const complete = await inspectPack(repositoryPath);
    assert.equal(complete.setupStatus, "complete");
    assert.equal(complete.coverageSummary.targetMet, true);
    assert.equal(complete.validation.valid, true, JSON.stringify(complete.validation.issues));
  });
});

test("host-selected scope cannot be marked complete", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath, "source_reviewed", ["admin.login", "portal.profile", "portal.billing"]);
    await setManifest(repositoryPath, (manifest) => ({
      ...manifest,
      setupStatus: "complete",
      setupScope: { ...(manifest.setupScope as SetupScope), selection: "host_selected" },
    }));
    const inspection = await inspectPack(repositoryPath);
    assert.equal(inspection.coverageSummary.targetMet, false);
    assert.equal(inspection.validation.valid, false);
    assert.ok(inspection.validation.issues.some((issue) => /requires user-confirmed setupScope.selection/i.test(issue.message)));
  });
});

test("usable coverage whose only evidence is inference fails validation", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath);
    const manifestPath = path.join(repositoryPath, "taste/manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { coverage: SetupCoverage[] };
    const coverage = manifest.coverage.map((entry) => entry.id === "admin.login"
      ? { ...entry, evidence: [{ type: "inference" as const, reference: "guessed from the route name", checkedAt: "2026-11-04" }] }
      : entry);
    await writeFile(manifestPath, JSON.stringify({ ...manifest, setupStatus: "usable_partial", coverage }, null, 2) + "\n");

    const validation = await validatePack(repositoryPath);
    assert.equal(validation.valid, false);
    assert.ok(validation.issues.some((issue) => /admin\.login/.test(issue.message) && /only inference evidence/.test(issue.message)));
    assert.equal(validation.issues.some((issue) => /No surface has specific, cited guidance/.test(issue.message)), false);
  });
});

test("guidance prose does not need template sections", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath);
    const manifestPath = path.join(repositoryPath, "taste/manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
    await writeFile(manifestPath, JSON.stringify({ ...manifest, setupStatus: "usable_partial" }, null, 2) + "\n");

    const warned = await validatePack(repositoryPath);
    assert.equal(warned.valid, true, JSON.stringify(warned.issues));
    assert.equal(warned.warnings.some((warning) => warning.path.endsWith("admin-login.md") || warning.path.endsWith("portal-profile.md")), false);

    const packRoot = path.join(repositoryPath, "taste");
    await writeFile(path.join(packRoot, "skills/product-design/references/admin-login.md"), "# Admin Authentication\n\n## Why\n\nKeep the user on the form so valid entries survive a validation error.\n\n## Rejected alternatives\n\nA full-page error was rejected because the source keeps the submitted form mounted. Evidence: src/admin/routes.ts. Visual behavior is not verified by this source-only evidence.\n");
    await writeFile(path.join(packRoot, "skills/product-design/references/portal-profile.md"), "# Portal Profile\n\nFor this journey, keep the task scoped to the documented product behavior and preserve its validation and recovery states.\n\n- **Why:** The profile form is the only place this journey edits identity.\n- **Rejected:** Replacing the form with a wizard was rejected because src/portal/profile.tsx edits the fields in place.\n\nSource: src/portal/profile.tsx. Visual behavior is not verified by this source-only evidence.\n");

    const cleared = await validatePack(repositoryPath);
    assert.equal(cleared.valid, true, JSON.stringify(cleared.issues));
    assert.deepEqual(cleared.warnings.filter((warning) => warning.path.endsWith(".md")), []);
  });
});

test("Pack reads reject paths that escape the product taste directory", async () => {
  await withRepository(async (repositoryPath) => {
    await initializePack(repositoryPath, "Example Product");
    await assert.rejects(() => readPackFile(repositoryPath, "../AGENTS.md"), /relative path inside the Taste Pack/);

    const outsideFile = path.join(repositoryPath, "outside.md");
    await writeFile(outsideFile, "private");
    await symlink(outsideFile, path.join(repositoryPath, "taste/private.md"));
    await assert.rejects(() => readPackFile(repositoryPath, "private.md"), /outside the Taste Pack/);
  });
});

test("Pack validation rejects required files that resolve through an external symlink", async () => {
  await withRepository(async (repositoryPath) => {
    await initializePack(repositoryPath, "Example Product");
    const outsideManifest = path.join(repositoryPath, "outside.json");
    await writeFile(outsideManifest, JSON.stringify({ name: "Outside", version: "1" }));
    await rm(path.join(repositoryPath, "taste/manifest.json"));
    await symlink(outsideManifest, path.join(repositoryPath, "taste/manifest.json"));

    const validation = await validatePack(repositoryPath);
    assert.equal(validation.valid, false);
    assert.ok(validation.issues.some((issue) => issue.path === "manifest.json"));
  });
});

test("Pack writes create or replace supported files only inside taste/", async () => {
  await withRepository(async (repositoryPath) => {
    await initializePack(repositoryPath, "Example Product");
    const written = await writePackFile(repositoryPath, "skills/product-design/references/conformance/buttons.md", "# Button decisions\n");
    assert.equal(written.content, "# Button decisions\n");
    await writePackFile(repositoryPath, "skills/product-design/references/conformance/buttons.md", "# Updated decisions\n");
    assert.equal((await readPackFile(repositoryPath, written.path)).content, "# Updated decisions\n");
    await writePackFile(repositoryPath, "skills/product-design/references/checklists/lesson.md", "# Reusable lesson\n");
    assert.match((await readPackFile(repositoryPath, "skills/product-design/references/checklists/lesson.md")).content, /Reusable lesson/);
    await assert.rejects(() => writePackFile(repositoryPath, "../AGENTS.md", "override"), /relative path inside the Taste Pack/);
    await assert.rejects(() => writePackFile(repositoryPath, "private.bin", "binary"), /supported text format/);

    const outside = path.join(repositoryPath, "outside");
    await mkdir(outside);
    await symlink(outside, path.join(repositoryPath, "taste/linked"));
    await assert.rejects(() => writePackFile(repositoryPath, "linked/escape.md", "no"), /real directories/);
  });
});

test("completed product-specific packs validate without a fixed reference catalog", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath, "source_reviewed", ["admin.login", "portal.profile", "portal.billing"]);
    const manifestPath = path.join(repositoryPath, "taste/manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
    await writeFile(manifestPath, JSON.stringify({ ...manifest, setupStatus: "complete" }, null, 2) + "\n");
    const completed = await validatePack(repositoryPath);
    assert.equal(completed.valid, true, JSON.stringify(completed.issues));
    const inspection = await inspectPack(repositoryPath);
    assert.equal(inspection.layout, "product-specific");
  });


});

test("generator and Judge fixture tools receive separate data", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath, "source_reviewed", ["admin.login", "portal.profile", "portal.billing"]);
    const manifestPath = path.join(repositoryPath, "taste/manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
    await writeFile(manifestPath, JSON.stringify({ ...manifest, setupStatus: "complete" }, null, 2) + "\n");
    await mkdir(path.join(repositoryPath, "taste/evals"), { recursive: true });
    await writeFile(path.join(repositoryPath, "taste/evals/rubric.md"), "# Evaluation rubric\n\nUser-facing quality matters.\n");
    const fixture = path.join(repositoryPath, "taste/evals/conformance/fixtures/button-density");
    await mkdir(path.join(fixture, "before"), { recursive: true });
    await mkdir(path.join(fixture, "after"), { recursive: true });
    await writeFile(path.join(fixture, "task.md"), "Make the primary action easy to find.\n");
    await writeFile(path.join(fixture, "before/index.html"), "<button>Continue</button>\n");
    await writeFile(path.join(fixture, "after/index.html"), "<main><button class=\"primary\">Continue</button></main>\n");

    const generatorCase = await getEvaluationGeneratorCase(repositoryPath, "conformance", "button-density");
    const judgePacket = await getEvaluationJudgePacket(repositoryPath, "conformance", "button-density", [{ path: "index.html", content: "<button class=\"primary\">Continue</button>" }]);

    assert.equal(generatorCase.before[0]?.content, "<button>Continue</button>\n");
    assert.equal("expectedAfter" in generatorCase, false);
    assert.equal(judgePacket.expectedAfter[0]?.content, "<main><button class=\"primary\">Continue</button></main>\n");
    assert.equal(judgePacket.generatedOutput[0]?.path, "index.html");
    assert.match(judgePacket.rubric, /User-facing quality/);
  });
});

test("committed example Pack validates and supplies both conformance and expression fixtures", async () => {
  const repositoryPath = path.resolve("examples/product-pack");
  const validation = await validatePack(repositoryPath);
  assert.equal(validation.valid, true, JSON.stringify(validation.issues));
  // The example is synthetic with no running UI, so the only warning is the honest "no populated state rendered" one.
  assert.deepEqual(validation.warnings.map((warning) => warning.path), ["manifest.json"]);
  assert.match(validation.warnings[0]?.message ?? "", /No coverage entry rendered a populated state/);
  assert.deepEqual(await listEvaluationFixtures(repositoryPath, "conformance"), ["account-setup-progress"]);
  assert.deepEqual(await listEvaluationFixtures(repositoryPath, "expression"), ["setup-direction"]);
  const generatorCase = await getEvaluationGeneratorCase(repositoryPath, "conformance", "account-setup-progress");
  const judgePacket = await getEvaluationJudgePacket(repositoryPath, "conformance", "account-setup-progress", [{ path: "index.html", content: "<main>Generated result</main>" }]);
  assert.equal(generatorCase.before.length, 1);
  assert.equal("expectedAfter" in generatorCase, false);
  assert.equal(judgePacket.expectedAfter.length, 1);
  assert.equal(judgePacket.generatedOutput[0]?.content, "<main>Generated result</main>");
});

async function setManifest(repositoryPath: string, change: (manifest: Record<string, unknown> & { coverage: SetupCoverage[] }) => Record<string, unknown>): Promise<void> {
  const manifestPath = path.join(repositoryPath, "taste/manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown> & { coverage: SetupCoverage[] };
  await writeFile(manifestPath, JSON.stringify(change(manifest), null, 2) + "\n");
}

test("rendered coverage must say which UI states were actually seen", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath, "source_reviewed", ["admin.login"]);
    await setManifest(repositoryPath, (manifest) => ({
      ...manifest,
      setupStatus: "usable_partial",
      coverage: manifest.coverage.map((entry) => entry.id === "admin.login" ? { ...entry, statesObserved: undefined } : entry),
    }));
    const missing = await validatePack(repositoryPath);
    assert.equal(missing.valid, false);
    assert.ok(missing.issues.some((issue) => /coverage\[0\] is rendered but statesObserved/.test(issue.message)));

    await setManifest(repositoryPath, (manifest) => ({
      ...manifest,
      coverage: manifest.coverage.map((entry) => entry.id === "admin.login" ? { ...entry, statesObserved: ["error", "sparkly"] } : entry),
    }));
    const unknown = await validatePack(repositoryPath);
    assert.ok(unknown.issues.some((issue) => /statesObserved must list only/.test(issue.message)));
  });
});

test("only failure states rendered warns that no populated state was seen", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath, "source_reviewed", ["admin.login"]);
    await setManifest(repositoryPath, (manifest) => ({
      ...manifest,
      setupStatus: "usable_partial",
      coverage: manifest.coverage.map((entry) => entry.id === "admin.login" ? { ...entry, statesObserved: ["loading", "error"] } : entry),
    }));
    const failureOnly = await inspectPack(repositoryPath);
    assert.equal(failureOnly.validation.valid, true, JSON.stringify(failureOnly.validation.issues));
    assert.equal(failureOnly.coverageSummary.renderedPopulated, 0);
    assert.ok(failureOnly.validation.warnings.some((warning) => /No coverage entry rendered a populated state/.test(warning.message)));

    await setManifest(repositoryPath, (manifest) => ({
      ...manifest,
      coverage: manifest.coverage.map((entry) => entry.id === "admin.login" ? { ...entry, statesObserved: ["populated", "error"] } : entry),
    }));
    const populated = await inspectPack(repositoryPath);
    assert.equal(populated.coverageSummary.renderedPopulated, 1);
    assert.equal(populated.validation.warnings.some((warning) => /populated state/.test(warning.message)), false);
  });
});

test("blocked coverage must record the access attempts made before giving up", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath);
    await setManifest(repositoryPath, (manifest) => ({
      ...manifest,
      setupStatus: "usable_partial",
      coverage: manifest.coverage.map((entry) => entry.id === "portal.billing" ? { ...entry, accessAttempts: [] } : entry),
    }));
    const validation = await validatePack(repositoryPath);
    assert.equal(validation.valid, false);
    assert.ok(validation.issues.some((issue) => /coverage\[2\] is blocked but accessAttempts is empty/.test(issue.message)));
  });
});

test("source_reviewed evidence must cite a repository file that exists", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath);
    await setManifest(repositoryPath, (manifest) => ({
      ...manifest,
      setupStatus: "usable_partial",
      coverage: manifest.coverage.map((entry) => entry.id === "admin.login"
        ? { ...entry, evidence: [{ type: "source_reviewed", reference: "src/admin/routes.ts:12-30", checkedAt: "2026-11-04" }] }
        : entry),
    }));
    const lineSuffix = await validatePack(repositoryPath);
    assert.equal(lineSuffix.valid, true, JSON.stringify(lineSuffix.issues));

    await setManifest(repositoryPath, (manifest) => ({
      ...manifest,
      coverage: manifest.coverage.map((entry) => entry.id === "portal.profile"
        ? { ...entry, evidence: [{ type: "source_reviewed", reference: "src/portal/missing.tsx", checkedAt: "2026-11-04" }] }
        : entry.id === "portal.billing"
          ? { ...entry, evidence: [{ type: "source_reviewed", reference: "billing page and its tests", checkedAt: "2026-11-04" }] }
          : entry),
    }));
    const invalid = await validatePack(repositoryPath);
    assert.equal(invalid.valid, false);
    assert.ok(invalid.issues.some((issue) => /'src\/portal\/missing.tsx', which does not exist/.test(issue.message)));
    assert.ok(invalid.issues.some((issue) => /'billing page and its tests' must be a repository-relative file path/.test(issue.message)));

    await setManifest(repositoryPath, (manifest) => ({
      ...manifest,
      coverage: manifest.coverage.map((entry) => entry.id === "portal.billing"
        ? { ...entry, evidence: [{ type: "source_reviewed", reference: "../outside.ts", checkedAt: "2026-11-04" }] }
        : entry),
    }));
    const escape = await validatePack(repositoryPath);
    assert.ok(escape.issues.some((issue) => /'\.\.\/outside.ts' must be a repository-relative file path/.test(issue.message)));
  });
});

test("complete requires the structured required states, defaulting to populated", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath, "source_reviewed", ["admin.login", "portal.profile", "portal.billing"]);
    await setManifest(repositoryPath, (manifest) => ({
      ...manifest,
      setupStatus: "complete",
      coverage: manifest.coverage.map((entry) => entry.id === "portal.billing" ? { ...entry, statesObserved: ["error"] } : entry),
    }));
    const defaultTarget = await inspectPack(repositoryPath);
    assert.equal(defaultTarget.validation.valid, false);
    assert.equal(defaultTarget.coverageSummary.targetMet, false);
    assert.ok(defaultTarget.validation.issues.some((issue) => /'portal\.billing' has not rendered the required state\(s\) populated/.test(issue.message)));

    await setManifest(repositoryPath, (manifest) => ({
      ...manifest,
      setupScope: { ...(manifest.setupScope as SetupScope), requiredStates: ["populated", "error"] },
      coverage: manifest.coverage.map((entry) => ({ ...entry, statesObserved: ["populated", "error"] })),
    }));
    const met = await inspectPack(repositoryPath);
    assert.equal(met.validation.valid, true, JSON.stringify(met.validation.issues));
    assert.equal(met.coverageSummary.targetMet, true);

    await setManifest(repositoryPath, (manifest) => ({ ...manifest, setupScope: { ...(manifest.setupScope as SetupScope), requiredStates: [] } }));
    const emptyStates = await validatePack(repositoryPath);
    assert.ok(emptyStates.issues.some((issue) => /setupScope.requiredStates must be a non-empty list/.test(issue.message)));
  });
});

test("a legacy 'incomplete' Pack is read as in_progress with migration steps", async () => {
  await withRepository(async (repositoryPath) => {
    await initializePack(repositoryPath, "Example Product", ["Admin login"]);
    await writeFile(path.join(repositoryPath, "taste/manifest.json"), JSON.stringify({ name: "Example Product", version: "0.1.0", setupStatus: "incomplete", surfaces: ["Admin login"] }, null, 2) + "\n");

    const inspection = await inspectPack(repositoryPath);
    assert.equal(inspection.setupStatus, "in_progress");
    assert.ok(inspection.migrationNeeded.some((step) => /legacy setupStatus 'incomplete'/i.test(step)));
    assert.ok(inspection.migrationNeeded.some((step) => /setupScope/.test(step)));
    assert.ok(inspection.migrationNeeded.some((step) => /coverage/.test(step)));
    assert.equal(inspection.validation.valid, false);
    assert.ok(inspection.validation.issues.some((issue) => /Legacy setupStatus 'incomplete' is read as 'in_progress'. Migrate the Pack/.test(issue.message)));
  });
});

test("evaluation fixtures remain optional", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath);
    const packRoot = path.join(repositoryPath, "taste");
    await setManifest(repositoryPath, (manifest) => ({ ...manifest, setupStatus: "usable_partial" }));

    const validation = await validatePack(repositoryPath);
    assert.equal(validation.valid, true, JSON.stringify(validation.issues));
    assert.equal(validation.warnings.some((warning) => warning.path === "evals"), false);
  });
});

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
import type { MinimumUsableEvidence, SetupCoverage, SetupScope } from "../src/core/pack.js";

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
      ...(definition.status === "blocked" && !rendered ? { gap: "Local authenticated access is not available." } : {}),
    });
  }
  const scope: SetupScope = {
    description: "Representative Admin authentication and Portal profile/billing journeys.",
    selection: "host_selected",
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
      gap: undefined,
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
    assert.match(starter, /Unresolved alternatives stay in the active task/);
    assert.match(starter, /settled rejected alternatives/);
    assert.match(starter, /Do not invent examples; cite product evidence/);
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
    assert.deepEqual(inspection.coverageSummary, { sourceReviewed: 2, rendered: 0, blocked: 1, notInspected: 0, required: 3, targetMet: false });
    assert.equal(inspection.validation.valid, true, JSON.stringify(inspection.validation.issues));
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

test("linked guidance missing Why or Rejected sections warns without failing validation", async () => {
  await withRepository(async (repositoryPath) => {
    await prepareEvidencePack(repositoryPath);
    const manifestPath = path.join(repositoryPath, "taste/manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
    await writeFile(manifestPath, JSON.stringify({ ...manifest, setupStatus: "usable_partial" }, null, 2) + "\n");

    const warned = await validatePack(repositoryPath);
    assert.equal(warned.valid, true, JSON.stringify(warned.issues));
    assert.ok(warned.warnings.some((warning) => warning.path.endsWith("admin-login.md") && /Why and Rejected/.test(warning.message)));
    assert.equal(warned.warnings.some((warning) => warning.path.endsWith("portal-billing.md")), false);

    const packRoot = path.join(repositoryPath, "taste");
    await writeFile(path.join(packRoot, "skills/product-design/references/admin-login.md"), "# Admin Authentication\n\n## Why\n\nKeep the user on the form so valid entries survive a validation error.\n\n## Rejected alternatives\n\nA full-page error was rejected because the source keeps the submitted form mounted. Evidence: src/admin/routes.ts. Visual behavior is not verified by this source-only evidence.\n");
    await writeFile(path.join(packRoot, "skills/product-design/references/portal-profile.md"), "# Portal Profile\n\nFor this journey, keep the task scoped to the documented product behavior and preserve its validation and recovery states.\n\n- **Why:** The profile form is the only place this journey edits identity.\n- **Rejected:** Replacing the form with a wizard was rejected because src/portal/profile.tsx edits the fields in place.\n\nSource: src/portal/profile.tsx. Visual behavior is not verified by this source-only evidence.\n");

    const cleared = await validatePack(repositoryPath);
    assert.equal(cleared.valid, true, JSON.stringify(cleared.issues));
    assert.deepEqual(cleared.warnings, []);
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
  assert.deepEqual(validation.warnings, []);
  assert.deepEqual(await listEvaluationFixtures(repositoryPath, "conformance"), ["account-setup-progress"]);
  assert.deepEqual(await listEvaluationFixtures(repositoryPath, "expression"), ["setup-direction"]);
  const generatorCase = await getEvaluationGeneratorCase(repositoryPath, "conformance", "account-setup-progress");
  const judgePacket = await getEvaluationJudgePacket(repositoryPath, "conformance", "account-setup-progress", [{ path: "index.html", content: "<main>Generated result</main>" }]);
  assert.equal(generatorCase.before.length, 1);
  assert.equal("expectedAfter" in generatorCase, false);
  assert.equal(judgePacket.expectedAfter.length, 1);
  assert.equal(judgePacket.generatedOutput[0]?.content, "<main>Generated result</main>");
});

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

async function withRepository(run: (repositoryPath: string) => Promise<void>): Promise<void> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "taste-pack-test-"));
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("initializes one shared Pack without touching repository instructions", async () => {
  await withRepository(async (repositoryPath) => {
    const originalInstructions = "Use the existing repository workflow.\n";
    await writeFile(path.join(repositoryPath, "AGENTS.md"), originalInstructions);

    const result = await initializePack(repositoryPath, "Example Product", ["checkout"]);
    const inspection = await inspectPack(repositoryPath);

    assert.equal(result.packPath, "taste");
    assert.ok(result.filesCreated.includes("skills/product-design/SKILL.md"));
    assert.ok(result.filesCreated.includes("skills/product-design/references/decisions/README.md"));
    assert.equal(result.filesCreated.some((file) => file.includes("/conformance/") || file.includes("/expression/")), false);
    assert.equal(inspection.manifest?.name, "Example Product");
    assert.equal(inspection.manifest?.supportedModes, undefined);
    assert.equal(inspection.layout, "shared");
    assert.equal(inspection.supportedModesDeprecated, false);
    assert.equal(inspection.validation.valid, true);
    assert.equal(inspection.entrySkillAvailable, true);
    assert.equal(await readFile(path.join(repositoryPath, "AGENTS.md"), "utf8"), originalInstructions);
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
    await writeFile(outsideManifest, JSON.stringify({ name: "Outside", version: "1", supportedModes: ["conformance", "expression"] }));
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
    await assert.rejects(() => writePackFile(repositoryPath, "../AGENTS.md", "override"), /relative path inside the Taste Pack/);
    await assert.rejects(() => writePackFile(repositoryPath, "private.bin", "binary"), /supported text format/);

    const outside = path.join(repositoryPath, "outside");
    await mkdir(outside);
    await symlink(outside, path.join(repositoryPath, "taste/linked"));
    await assert.rejects(() => writePackFile(repositoryPath, "linked/escape.md", "no"), /real directories/);
  });
});

test("validation accepts a legacy split Pack and rejects a Pack with no decision home", async () => {
  await withRepository(async (repositoryPath) => {
    await initializePack(repositoryPath, "Example Product");
    await rm(path.join(repositoryPath, "taste/skills/product-design/references/decisions/README.md"));
    const missing = await validatePack(repositoryPath);
    assert.equal(missing.valid, false);
    assert.ok(missing.issues.some((issue) => issue.path.includes("decisions/README.md")));
  });

  const legacy = await validatePack(path.resolve("examples/product-pack"));
  assert.equal(legacy.valid, true, JSON.stringify(legacy.issues));
  const inspection = await inspectPack(path.resolve("examples/product-pack"));
  assert.equal(inspection.layout, "legacy-split");
  assert.equal(inspection.supportedModesDeprecated, true);
});

test("generator and Judge fixture tools receive separate data", async () => {
  await withRepository(async (repositoryPath) => {
    await initializePack(repositoryPath, "Example Product");
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
  assert.deepEqual(await listEvaluationFixtures(repositoryPath, "conformance"), ["account-setup-progress"]);
  assert.deepEqual(await listEvaluationFixtures(repositoryPath, "expression"), ["setup-direction"]);
  const generatorCase = await getEvaluationGeneratorCase(repositoryPath, "conformance", "account-setup-progress");
  const judgePacket = await getEvaluationJudgePacket(repositoryPath, "conformance", "account-setup-progress", [{ path: "index.html", content: "<main>Generated result</main>" }]);
  assert.equal(generatorCase.before.length, 1);
  assert.equal("expectedAfter" in generatorCase, false);
  assert.equal(judgePacket.expectedAfter.length, 1);
  assert.equal(judgePacket.generatedOutput[0]?.content, "<main>Generated result</main>");
});

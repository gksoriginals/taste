import { lstat, mkdir, readFile, readdir, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const PACK_DIRECTORY = "taste";
export const ENTRY_SKILL = "skills/product-design/SKILL.md";
export const MAX_PACK_FILE_BYTES = 256 * 1024;
const MAX_EVAL_FILES = 100;
const MAX_EVAL_BYTES = 1024 * 1024;

export type TasteMode = "conformance" | "expression";

export interface PackManifest {
  name: string;
  version: string;
  supportedModes: TasteMode[];
  surfaces: string[];
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface PackValidation {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface PackFile {
  path: string;
  content: string;
}

export class TasteError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = "TasteError";
  }
}

const starterEntrySkill = (productName: string): string => `---
name: product-design
description: Apply ${productName}'s product-specific design judgment when creating, implementing, or reviewing software UI.
---

# Product design guidance for ${productName}

This is the entry point for the product's Taste Pack. Keep its mode-selection cues specific to this product and update them as product intent becomes clearer.

## Choose and record a task mode

Use the user's explicit mode request when present. Otherwise interpret the task using this product's triggers:

- **Conformance:** the requested change follows an accepted direction documented in the Pack, grounded in visual evidence from the running product and supporting sources. Shipped work is evidence, not automatic policy.
- **Expression:** the user asks to explore, establish, or intentionally change product direction. Ask the user focused questions through the harness conversation.
- **Unclear or unsupported:** if intent is mixed, or an important decision lacks evidence, ask one focused question through the harness instead of guessing.

Use the \`taste_mode_resolve\` tool with your interpreted signal (\`explicit_mode\`, \`established_direction\`, \`new_direction\`, \`direction_accepted\`, or \`unclear\`). The tool maps the signal deterministically; it does not classify raw language. A proposed Expression direction moves to Conformance only after the user confirms it as product guidance. Keep mode task-local and tell the user which mode was selected and why.

## Apply this Pack

Read \`references/shared/product-facts.md\` when relevant. For Conformance, load the applicable reference under \`references/conformance/\`; for Expression, load the relevant intent and direction under \`references/expression/\`. These routes exist for both modes from setup; an unestablished direction must be labeled as such. Treat shipped work as evidence, not a requirement to copy known flaws. Keep uncertainty visible.

Visual taste was gathered from the running product, not source code alone. For a discovery refresh, follow the Taste \`taste-sweep\` workflow and capture screenshots. When implementing or reviewing visible UI, use the harness's available browser/computer/rendered-preview tools when needed and report what you actually inspected.

## Expression questions

Ask the product owner through the harness conversation. Ask only questions needed to resolve user need, desired outcome, constraints, tradeoffs, or relevant references. Summarize the proposed direction and obtain confirmation before storing it as accepted guidance.

Product-specific guidance is incomplete until its references contain reviewed evidence. Ask the product owner when the task needs a decision the Pack does not support.
`;

export function createStarterPackFiles(productName: string, surfaces: string[] = []): PackFile[] {
  const normalizedName = productName.trim();
  if (normalizedName.length < 2 || normalizedName.length > 120) {
    throw new TasteError("Product name must be between 2 and 120 characters.", "invalid_product_name");
  }

  const manifest: PackManifest = {
    name: normalizedName,
    version: "0.1.0",
    supportedModes: ["conformance", "expression"],
    surfaces: surfaces.map((surface) => surface.trim()).filter(Boolean),
  };

  return [
    {
      path: "README.md",
      content: `# ${normalizedName} Taste Pack\n\nThis directory carries reviewed product-specific design guidance for coding agents. Read \`skills/product-design/SKILL.md\` to choose Conformance or Expression and load only the references needed for the task.\n\nThe starter is not product knowledge: replace its prompts and empty references with evidence-backed decisions before relying on it.\n`,
    },
    { path: "manifest.json", content: `${JSON.stringify(manifest, null, 2)}\n` },
    { path: ENTRY_SKILL, content: starterEntrySkill(normalizedName) },
    {
      path: "skills/product-design/references/shared/product-facts.md",
      content: `# Shared product facts\n\nRecord only reviewed product facts that apply in both Conformance and Expression. Add evidence and source links.\n`,
    },
    {
      path: "skills/product-design/references/conformance/README.md",
      content: `# Conformance references\n\nCapture decisions supported by evidence from the running product and accepted review evidence. A visual sweep should record relevant URLs/pages, user-flow steps, screenshots or rendered captures, date and viewport, and important interaction states. Correlate those observations with code, Git history, reviews, and product-owned sources where available. Put each decision, rationale, scope, exceptions, examples, evidence gaps, and known flaws beside the relevant surface or craft guidance.\n`,
    },
    {
      path: "skills/product-design/references/expression/README.md",
      content: `# Expression references\n\nThe coding agent interviews the product owner through the harness when they want to establish or extend direction. Capture user intent, alternatives considered, constraints, and the direction the user explicitly confirms. Label proposed and accepted guidance distinctly; do not invent a direction to populate this file. Keep open questions visible.\n`,
    },
    {
      path: "metadata/authority.md",
      content: `# Product source authority\n\nList the product's canonical sources and explain how to handle conflicts. The current task's explicit user goal remains immediate authority. Shipped work is evidence of behavior, not automatic approval of flaws.\n`,
    },
    {
      path: "evals/rubric.md",
      content: `# Evaluation rubric\n\nThe higher-capacity Eval Judge runs through the coding harness in a fresh context from the generator. Assess each generated output independently before comparing paired arms. Cite concrete evidence from the generated files and expected result.\n\nScore each dimension from 1 to 5 (1 = fails the task or conflicts with supported direction; 3 = partly meets it with material gaps; 5 = meets it strongly without material gaps):\n\n- **User-facing quality:** Does the experience serve the task and user need?\n- **Task completion:** Does the implementation actually deliver the requested behavior, not just its appearance?\n- **Product-rule correctness:** Does it apply the relevant shared and mode-specific guidance?\n- **Accepted-work alignment:** Where expected shipped work is available, does the result reflect the useful accepted decisions? Similarity must not reward known flaws or omissions.\n\nCall out unverified behavior, missing evidence, and protocol deviations separately. Human review calibrates this Rubric and adjudicates uncertain judgments. Scores are evidence for Pack improvement, not automatic approval of a guidance change.\n`,
    },
    {
      path: "evals/conformance/fixtures/README.md",
      content: `# Conformance fixtures\n\nAdd fixtures from shipped product changes. Each fixture should include task context, a before state, expected after state, and the Pack guidance and Rubric used by the Judge. Keep expected edits hidden from generator context for holdouts.\n`,
    },
    {
      path: "evals/expression/fixtures/README.md",
      content: `# Expression fixtures\n\nAdd fixtures that test how well guidance elicits and applies user intent for a new or extended direction. Keep the user's chosen direction and Judge expectations out of generator context for holdouts.\n`,
    },
  ];
}

export async function resolveRepositoryRoot(repositoryPath: string): Promise<string> {
  if (!path.isAbsolute(repositoryPath)) {
    throw new TasteError("repositoryPath must be an absolute path supplied by the harness.", "repository_path_not_absolute");
  }
  let root: string;
  try {
    root = await realpath(repositoryPath);
  } catch {
    throw new TasteError(`Repository path does not exist: ${repositoryPath}`, "repository_not_found");
  }
  if (!(await stat(root)).isDirectory()) {
    throw new TasteError(`Repository path is not a directory: ${repositoryPath}`, "repository_not_directory");
  }
  return root;
}

async function resolvePackRoot(repositoryPath: string): Promise<{ repositoryRoot: string; packRoot: string }> {
  const repositoryRoot = await resolveRepositoryRoot(repositoryPath);
  const candidate = path.join(repositoryRoot, PACK_DIRECTORY);
  let packRoot: string;
  try {
    const metadata = await lstat(candidate);
    if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
      throw new TasteError("The repository's taste path must be a real directory, not a file or symlink.", "invalid_pack_path");
    }
    packRoot = await realpath(candidate);
  } catch (error) {
    if (error instanceof TasteError) throw error;
    throw new TasteError(`No Taste Pack found at ${candidate}. Ask whether to initialize one.`, "pack_not_found");
  }
  if (!isWithin(repositoryRoot, packRoot)) {
    throw new TasteError("Taste Pack resolves outside the target repository.", "pack_path_escape");
  }
  return { repositoryRoot, packRoot };
}

function isWithin(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function normalizePackRelativePath(relativePath: string): string {
  const portablePath = relativePath.replaceAll("\\", "/");
  const pieces = portablePath.split("/");
  if (!portablePath || path.isAbsolute(portablePath) || pieces.some((piece) => piece === ".." || piece === "" || piece === ".")) {
    throw new TasteError("path must be a non-empty relative path inside the Taste Pack.", "invalid_pack_relative_path");
  }
  const normalized = path.normalize(portablePath);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new TasteError("path must stay inside the Taste Pack.", "pack_path_escape");
  }
  return normalized;
}

async function resolvePackFile(packRoot: string, relativePath: string): Promise<string> {
  const normalized = normalizePackRelativePath(relativePath);
  const candidate = path.join(packRoot, normalized);
  let resolved: string;
  try {
    resolved = await realpath(candidate);
  } catch {
    throw new TasteError(`Pack file not found: ${relativePath}`, "pack_file_not_found");
  }
  if (!isWithin(packRoot, resolved)) {
    throw new TasteError("Pack file resolves outside the Taste Pack.", "pack_path_escape");
  }
  if (!(await stat(resolved)).isFile()) {
    throw new TasteError("Pack path is not a regular file.", "pack_path_not_file");
  }
  if (!/\.(md|json)$/i.test(resolved)) {
    throw new TasteError("Only Markdown and JSON Pack files can be read with this tool.", "unsupported_pack_file");
  }
  const metadata = await stat(resolved);
  if (metadata.size > MAX_PACK_FILE_BYTES) {
    throw new TasteError(`Pack file exceeds the ${MAX_PACK_FILE_BYTES}-byte read limit.`, "pack_file_too_large");
  }
  return resolved;
}

async function resolveFileWithin(root: string, relativePath: string): Promise<string> {
  const normalized = normalizePackRelativePath(relativePath);
  const candidate = path.join(root, normalized);
  let resolved: string;
  try {
    resolved = await realpath(candidate);
  } catch {
    throw new TasteError(`File not found: ${relativePath}`, "file_not_found");
  }
  if (!isWithin(root, resolved)) throw new TasteError("File resolves outside its allowed directory.", "pack_path_escape");
  const metadata = await stat(resolved);
  if (!metadata.isFile()) throw new TasteError("Path is not a regular file.", "pack_path_not_file");
  if (metadata.size > MAX_PACK_FILE_BYTES) throw new TasteError(`File exceeds the ${MAX_PACK_FILE_BYTES}-byte limit.`, "pack_file_too_large");
  return resolved;
}

export async function readPackFile(repositoryPath: string, relativePath: string): Promise<PackFile> {
  const { packRoot } = await resolvePackRoot(repositoryPath);
  const normalized = normalizePackRelativePath(relativePath);
  const filePath = await resolvePackFile(packRoot, normalized);
  return { path: normalized.split(path.sep).join("/"), content: await readFile(filePath, "utf8") };
}

export async function writePackFile(repositoryPath: string, relativePath: string, content: string): Promise<PackFile> {
  const { packRoot } = await resolvePackRoot(repositoryPath);
  const normalized = normalizePackRelativePath(relativePath);
  if (!/\.(md|json|html|css|js|jsx|ts|tsx|svg|txt)$/i.test(normalized)) {
    throw new TasteError("Pack files must use a supported text format (Markdown, JSON, HTML, CSS, JavaScript, TypeScript, SVG, or text).", "unsupported_pack_file");
  }
  if (Buffer.byteLength(content, "utf8") > MAX_PACK_FILE_BYTES) {
    throw new TasteError(`Pack file exceeds the ${MAX_PACK_FILE_BYTES}-byte write limit.`, "pack_file_too_large");
  }

  const segments = normalized.split(path.sep);
  let directory = packRoot;
  for (const segment of segments.slice(0, -1)) {
    directory = path.join(directory, segment);
    try {
      const metadata = await lstat(directory);
      if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
        throw new TasteError("Pack parent paths must be real directories, not files or symlinks.", "invalid_pack_path");
      }
    } catch (error) {
      if (error instanceof TasteError) throw error;
      await mkdir(directory);
    }
  }

  const target = path.join(packRoot, normalized);
  try {
    const metadata = await lstat(target);
    if (metadata.isSymbolicLink() || !metadata.isFile()) {
      throw new TasteError("Pack files must be regular files, not directories or symlinks.", "invalid_pack_file");
    }
  } catch (error) {
    if (error instanceof TasteError) throw error;
    // A missing target is created below.
  }

  const temporary = path.join(directory, `.taste-write-${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, content, { encoding: "utf8", flag: "wx" });
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { force: true });
    throw new TasteError(`Pack write failed: ${String(error)}`, "pack_write_failed");
  }
  return { path: normalized.split(path.sep).join("/"), content };
}

export async function inspectPack(repositoryPath: string): Promise<{
  packPath: string;
  manifest: PackManifest | null;
  entrySkillAvailable: boolean;
  referenceCount: number;
  fixtureCounts: Record<TasteMode, number>;
  validation: PackValidation;
}> {
  const { repositoryRoot, packRoot } = await resolvePackRoot(repositoryPath);
  let manifest: PackManifest | null = null;
  try {
    const manifestPath = await resolvePackFile(packRoot, "manifest.json");
    manifest = JSON.parse(await readFile(manifestPath, "utf8")) as PackManifest;
  } catch {
    // The validator returns the actionable manifest diagnostic.
  }
  const referenceRoot = path.join(packRoot, "skills/product-design/references");
  const referenceCount = await countMarkdown(referenceRoot);
  const fixtureCounts: Record<TasteMode, number> = {
    conformance: (await listFixturesAt(packRoot, "conformance")).length,
    expression: (await listFixturesAt(packRoot, "expression")).length,
  };
  return {
    packPath: path.relative(repositoryRoot, packRoot).split(path.sep).join("/"),
    manifest,
    entrySkillAvailable: await resolvePackFile(packRoot, ENTRY_SKILL).then(() => true).catch(() => false),
    referenceCount,
    fixtureCounts,
    validation: await validatePackAt(packRoot),
  };
}

async function countMarkdown(directory: string): Promise<number> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    let total = 0;
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) total += await countMarkdown(entryPath);
      else if (entry.isFile() && entry.name.endsWith(".md")) total += 1;
    }
    return total;
  } catch {
    return 0;
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function validatePackAt(packRoot: string): Promise<PackValidation> {
  const issues: ValidationIssue[] = [];
  const requiredFiles = [
    "README.md",
    "manifest.json",
    ENTRY_SKILL,
    "skills/product-design/references/shared/product-facts.md",
    "skills/product-design/references/conformance/README.md",
    "skills/product-design/references/expression/README.md",
    "metadata/authority.md",
    "evals/rubric.md",
  ];
  for (const relative of requiredFiles) {
    try {
      await resolvePackFile(packRoot, relative);
    } catch (error) {
      const message = error instanceof TasteError && error.code !== "pack_file_not_found"
        ? error.message
        : "Required Pack file is missing or unreadable.";
      issues.push({ path: relative, message });
    }
  }

  let manifest: unknown;
  try {
    const manifestPath = await resolvePackFile(packRoot, "manifest.json");
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    issues.push({ path: "manifest.json", message: "Must contain valid JSON." });
  }
  if (manifest && typeof manifest === "object") {
    const record = manifest as Record<string, unknown>;
    if (typeof record.name !== "string" || record.name.trim().length === 0) {
      issues.push({ path: "manifest.json", message: "name must be a non-empty string." });
    }
    if (typeof record.version !== "string" || record.version.trim().length === 0) {
      issues.push({ path: "manifest.json", message: "version must be a non-empty string." });
    }
    const modes = Array.isArray(record.supportedModes) ? record.supportedModes : [];
    for (const mode of ["conformance", "expression"] as const) {
      if (!modes.includes(mode)) issues.push({ path: "manifest.json", message: `supportedModes must include ${mode}.` });
    }
    if (record.surfaces !== undefined && (!Array.isArray(record.surfaces) || !record.surfaces.every((item) => typeof item === "string"))) {
      issues.push({ path: "manifest.json", message: "surfaces must be an array of strings when present." });
    }
  }

  try {
    const skillPath = await resolvePackFile(packRoot, ENTRY_SKILL);
    const content = await readFile(skillPath, "utf8");
    const frontmatter = content.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/);
    if (!frontmatter) {
      issues.push({ path: ENTRY_SKILL, message: "Skill must begin with YAML frontmatter delimited by --- lines." });
    } else {
      if (!/^name:\s*\S+/m.test(frontmatter[1])) issues.push({ path: ENTRY_SKILL, message: "Skill frontmatter must include name." });
      if (!/^description:\s*\S+/m.test(frontmatter[1])) issues.push({ path: ENTRY_SKILL, message: "Skill frontmatter must include description." });
    }
  } catch {
    // Missing and unsafe skill paths are already reported from the required-file pass.
  }

  return { valid: issues.length === 0, issues };
}

export async function validatePack(repositoryPath: string): Promise<PackValidation> {
  const { packRoot } = await resolvePackRoot(repositoryPath);
  return validatePackAt(packRoot);
}

export async function initializePack(repositoryPath: string, productName: string, surfaces: string[] = []): Promise<{ packPath: string; filesCreated: string[] }> {
  const repositoryRoot = await resolveRepositoryRoot(repositoryPath);
  const packRoot = path.join(repositoryRoot, PACK_DIRECTORY);
  try {
    await lstat(packRoot);
    throw new TasteError(`A path already exists at ${packRoot}; initialization never overwrites an existing Pack.`, "pack_already_exists");
  } catch (error) {
    if (error instanceof TasteError) throw error;
    // A missing path is the expected starting state.
  }

  const files = createStarterPackFiles(productName, surfaces);
  await mkdir(packRoot, { recursive: false });
  try {
    for (const file of files) {
      const target = path.join(packRoot, normalizePackRelativePath(file.path));
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, file.content, { encoding: "utf8", flag: "wx" });
    }
  } catch (error) {
    await rm(packRoot, { recursive: true, force: true });
    if (error instanceof TasteError) throw error;
    throw new TasteError(`Pack initialization failed and the partial new directory was removed: ${String(error)}`, "pack_initialization_failed");
  }
  return { packPath: path.relative(repositoryRoot, packRoot).split(path.sep).join("/"), filesCreated: files.map((file) => file.path) };
}

async function readFilesRecursively(directory: string, root: string, accumulator: PackFile[], bytes: { total: number }): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new TasteError("Evaluation fixture directories cannot contain symlinks.", "eval_symlink_not_allowed");
    if (entry.isDirectory()) {
      await readFilesRecursively(entryPath, root, accumulator, bytes);
      continue;
    }
    if (!entry.isFile()) continue;
    if (accumulator.length >= MAX_EVAL_FILES) throw new TasteError(`An evaluation state cannot exceed ${MAX_EVAL_FILES} files.`, "eval_too_many_files");
    const file = await readFile(entryPath);
    bytes.total += file.byteLength;
    if (bytes.total > MAX_EVAL_BYTES) throw new TasteError(`An evaluation state cannot exceed ${MAX_EVAL_BYTES} bytes.`, "eval_too_large");
    accumulator.push({ path: path.relative(root, entryPath).split(path.sep).join("/"), content: file.toString("utf8") });
  }
}

async function listFixturesAt(packRoot: string, mode: TasteMode): Promise<string[]> {
  const directory = path.join(packRoot, "evals", mode, "fixtures");
  try {
    const resolved = await realpath(directory);
    if (!isWithin(packRoot, resolved)) return [];
    const entries = await readdir(resolved, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory() && !entry.isSymbolicLink()).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}

async function fixtureRoot(repositoryPath: string, mode: TasteMode, fixtureId: string): Promise<string> {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(fixtureId)) {
    throw new TasteError("fixtureId may contain letters, numbers, dots, underscores, and hyphens.", "invalid_fixture_id");
  }
  const { packRoot } = await resolvePackRoot(repositoryPath);
  const base = path.join(packRoot, "evals", mode, "fixtures");
  const candidate = path.join(base, fixtureId);
  let resolved: string;
  try {
    const metadata = await lstat(candidate);
    if (metadata.isSymbolicLink() || !metadata.isDirectory()) throw new TasteError("Fixture must be a real directory.", "invalid_fixture_directory");
    resolved = await realpath(candidate);
  } catch (error) {
    if (error instanceof TasteError) throw error;
    throw new TasteError(`Fixture not found: ${mode}/${fixtureId}`, "fixture_not_found");
  }
  if (!isWithin(base, resolved)) throw new TasteError("Fixture resolves outside the Pack.", "pack_path_escape");
  return resolved;
}

export async function listEvaluationFixtures(repositoryPath: string, mode: TasteMode): Promise<string[]> {
  const { packRoot } = await resolvePackRoot(repositoryPath);
  return listFixturesAt(packRoot, mode);
}

export async function getEvaluationGeneratorCase(repositoryPath: string, mode: TasteMode, fixtureId: string): Promise<{ mode: TasteMode; fixtureId: string; task: string; before: PackFile[] }> {
  const root = await fixtureRoot(repositoryPath, mode, fixtureId);
  let task: string;
  try {
    task = await readFile(await resolveFileWithin(root, "task.md"), "utf8");
  } catch {
    throw new TasteError("Fixture is missing task.md.", "invalid_fixture");
  }
  const beforeRoot = path.join(root, "before");
  const before = await lstat(beforeRoot).catch(() => null);
  if (!before?.isDirectory() || before.isSymbolicLink()) throw new TasteError("Fixture is missing a real before/ directory.", "invalid_fixture");
  const files: PackFile[] = [];
  await readFilesRecursively(beforeRoot, beforeRoot, files, { total: 0 });
  if (files.length === 0) throw new TasteError("Fixture before/ directory is empty.", "invalid_fixture");
  return { mode, fixtureId, task, before: files };
}

export async function getEvaluationJudgePacket(repositoryPath: string, mode: TasteMode, fixtureId: string, generatedOutput: PackFile[] = []): Promise<{ mode: TasteMode; fixtureId: string; task: string; rubric: string; generatedOutput: PackFile[]; expectedAfter: PackFile[] }> {
  if (generatedOutput.length > MAX_EVAL_FILES) throw new TasteError(`Generated output cannot exceed ${MAX_EVAL_FILES} files.`, "eval_too_many_files");
  let generatedBytes = 0;
  for (const file of generatedOutput) {
    normalizePackRelativePath(file.path);
    generatedBytes += Buffer.byteLength(file.content, "utf8");
  }
  if (generatedBytes > MAX_EVAL_BYTES) throw new TasteError(`Generated output cannot exceed ${MAX_EVAL_BYTES} bytes.`, "eval_too_large");
  const { packRoot } = await resolvePackRoot(repositoryPath);
  const root = await fixtureRoot(repositoryPath, mode, fixtureId);
  let task: string;
  let rubric: string;
  try {
    task = await readFile(await resolveFileWithin(root, "task.md"), "utf8");
    rubric = await readFile(await resolvePackFile(packRoot, "evals/rubric.md"), "utf8");
  } catch {
    throw new TasteError("Fixture task or shared evaluation rubric is missing.", "invalid_fixture");
  }
  const afterRoot = path.join(root, "after");
  const after = await lstat(afterRoot).catch(() => null);
  if (!after?.isDirectory() || after.isSymbolicLink()) throw new TasteError("Fixture is missing a real after/ directory.", "invalid_fixture");
  const expectedAfter: PackFile[] = [];
  await readFilesRecursively(afterRoot, afterRoot, expectedAfter, { total: 0 });
  if (expectedAfter.length === 0) throw new TasteError("Fixture after/ directory is empty.", "invalid_fixture");
  return { mode, fixtureId, task, rubric, generatedOutput, expectedAfter };
}

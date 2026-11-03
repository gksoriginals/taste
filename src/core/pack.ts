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
  /**
   * Deprecated. Not product truth. Part activity is derived from Decision
   * status, shipped evidence, and coverage gaps. Kept only so older Packs parse.
   */
  supportedModes?: TasteMode[];
  surfaces: string[];
  /** Legacy optional reminder for hosts that still record structured Decision promotions. */
  decisionPromotionCheckpoint?: string;
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
description: Apply ${productName}'s product-specific design judgment when creating, implementing, or reviewing software UI. Load this Pack before UI work.
---

# Product design guidance for ${productName}

This is the entry point for one Taste Pack. Its references and checklists are selected during the product sweep based on the actual product surfaces and evidence. There is no mode field on a Decision and no separate Conformance or Expression tree.

This generated starter is only a scaffold, not a completed product Skill. Before using it as product-specific guidance, run the host's whole-product Taste setup sweep, inventory the user-facing surfaces, and replace generic text with source-linked product guidance, task-and-surface routing, focused references, and checklists. The host self-reviews its work; update reusable checklist items directly from resolved user corrections without a separate review or promotion step.

## Apply this Pack

Resolve the request mode from the user's verb and artifact before acting, then identify the product surface from the route, screen, component, or flow. Use the product-specific routing map and load only the Skills, references, and checklists that the sweep found useful for this task. Follow canonical repository sources for component APIs, design tokens, accessibility, and interaction contracts instead of copying them into this Pack.

| Request mode | Route and boundary |
| --- | --- |
| Shape | Frame the user, job, evidence, outcomes, alternatives, states, and open questions. Do not edit unless asked. |
| Implement | Make the smallest coherent change within the requested surface and scope. |
| Review | Inspect source and rendered evidence, report findings, and do not edit unless asked. |
| Copy | Edit user-facing language and only directly required UI structure; report broader design issues separately. |
| Harden | Preserve the settled direction while checking reachable states, resilience, accessibility, responsive behavior, and recovery. |

During setup, create a routing map from the actual product tasks, surfaces, and evidence. Do not assume every product needs the same reference categories or files. Add a shared reference only when it captures guidance useful across multiple surfaces; otherwise keep guidance scoped to the relevant surface. A URL, screenshot, or component identifies scope; it does not authorize an edit. Skip backend-only work with no user-visible effect, telemetry-only changes, generated files, and tests without shipped UI impact.

## Product-specific routing

Use the manifest and the Pack's own routing map to identify the relevant surface, then load only the references and checklists created for that product and task. Keep this Skill as one user-facing front door. Do not duplicate component or design-system documentation owned by the product repository.

## Learn from user feedback

Treat a user correction, rejection, or disagreement as direct evidence for the current task. Apply it, self-check the result with the host's available workflow, and update the scoped checklist when it expresses a clear reusable lesson. Do not require a separate Pack review, Decision approval, or promotion checkpoint. Keep unresolved alternatives and one-off feedback in the host task. Distinguish directly observed behavior from inferred intent, cite sources, and mark uncertainty.

For initial setup or a discovery refresh, follow \`taste-sweep\` across the whole user-facing product and capture evidence. When implementing or reviewing visible UI, use the harness's available browser, computer, or rendered-preview tools when needed and report what you actually inspected.
`;

export function createStarterPackFiles(productName: string, surfaces: string[] = [], decisionPromotionCheckpoint?: string): PackFile[] {
  const normalizedName = productName.trim();
  if (normalizedName.length < 2 || normalizedName.length > 120) {
    throw new TasteError("Product name must be between 2 and 120 characters.", "invalid_product_name");
  }
  if (decisionPromotionCheckpoint !== undefined && (!decisionPromotionCheckpoint.trim() || decisionPromotionCheckpoint.length > 500)) {
    throw new TasteError("decisionPromotionCheckpoint must be non-empty and no longer than 500 characters.", "invalid_promotion_checkpoint");
  }

  const manifest: PackManifest = {
    name: normalizedName,
    version: "0.1.0",
    surfaces: surfaces.map((surface) => surface.trim()).filter(Boolean),
    ...(decisionPromotionCheckpoint?.trim() ? { decisionPromotionCheckpoint: decisionPromotionCheckpoint.trim() } : {}),
  };

  return [
    {
      path: "README.md",
      content: `# ${normalizedName} Taste Pack\n\nThis is the product's Taste Pack. Its contents should reflect this product's actual user-facing surfaces and verified design evidence. The starter files are only a shell. Complete the whole-product sweep, decide which guidance is useful for this product, then write only those product-specific Skills, references, checklists, and metadata. Self-check coverage, traceability, accuracy, and usefulness.\n`,
    },
    { path: "manifest.json", content: `${JSON.stringify(manifest, null, 2)}\n` },
    { path: ENTRY_SKILL, content: starterEntrySkill(normalizedName) },
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

export async function listPackMarkdown(repositoryPath: string, relativeDirectory: string): Promise<PackFile[]> {
  const { packRoot } = await resolvePackRoot(repositoryPath);
  const normalized = normalizePackRelativePath(relativeDirectory);
  const directory = path.join(packRoot, normalized);
  let resolved: string;
  try {
    const metadata = await lstat(directory);
    if (metadata.isSymbolicLink() || !metadata.isDirectory()) return [];
    resolved = await realpath(directory);
  } catch {
    return [];
  }
  if (!isWithin(packRoot, resolved)) {
    throw new TasteError("Pack directory resolves outside the Taste Pack.", "pack_path_escape");
  }
  const entries = await readdir(resolved, { withFileTypes: true });
  const files: PackFile[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || entry.isSymbolicLink() || !entry.name.endsWith(".md") || entry.name === "README.md") continue;
    const relative = `${normalized.split(path.sep).join("/")}/${entry.name}`;
    files.push(await readPackFile(repositoryPath, relative));
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export async function readPackFile(repositoryPath: string, relativePath: string): Promise<PackFile> {
  const { packRoot } = await resolvePackRoot(repositoryPath);
  const normalized = normalizePackRelativePath(relativePath);
  const filePath = await resolvePackFile(packRoot, normalized);
  return { path: normalized.split(path.sep).join("/"), content: await readFile(filePath, "utf8") };
}

export async function writePackFile(repositoryPath: string, relativePath: string, content: string): Promise<PackFile> {
  return writePackFileInternal(repositoryPath, relativePath, content, false);
}

export async function writeDecisionFile(repositoryPath: string, relativePath: string, content: string): Promise<PackFile> {
  return writePackFileInternal(repositoryPath, relativePath, content, true);
}

async function writePackFileInternal(repositoryPath: string, relativePath: string, content: string, allowDecisionWrite: boolean): Promise<PackFile> {
  const { packRoot } = await resolvePackRoot(repositoryPath);
  const normalized = normalizePackRelativePath(relativePath);
  const decisionsPrefix = path.join("skills", "product-design", "references", "decisions") + path.sep;
  if (!allowDecisionWrite && normalized.startsWith(decisionsPrefix)) {
    throw new TasteError("Decision files can only be written through taste_record_signal after final validation and user approval.", "decision_write_requires_promotion");
  }
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

export type PackLayout = "shared" | "legacy-split" | "mixed" | "incomplete";

export async function inspectPack(repositoryPath: string): Promise<{
  packPath: string;
  manifest: PackManifest | null;
  entrySkillAvailable: boolean;
  referenceCount: number;
  decisionCount: number;
  layout: PackLayout;
  supportedModesDeprecated: boolean;
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
  const decisionCount = await countDecisionFiles(packRoot);
  const fixtureCounts: Record<TasteMode, number> = {
    conformance: (await listFixturesAt(packRoot, "conformance")).length,
    expression: (await listFixturesAt(packRoot, "expression")).length,
  };
  return {
    packPath: path.relative(repositoryRoot, packRoot).split(path.sep).join("/"),
    manifest,
    entrySkillAvailable: await resolvePackFile(packRoot, ENTRY_SKILL).then(() => true).catch(() => false),
    referenceCount,
    decisionCount,
    layout: await packLayout(packRoot),
    supportedModesDeprecated: manifest?.supportedModes !== undefined,
    fixtureCounts,
    validation: await validatePackAt(packRoot),
  };
}

async function packLayout(packRoot: string): Promise<PackLayout> {
  const hasDecisions = await exists(path.join(packRoot, "skills/product-design/references/decisions/README.md"));
  const hasLegacy = (await exists(path.join(packRoot, "skills/product-design/references/conformance/README.md")))
    && (await exists(path.join(packRoot, "skills/product-design/references/expression/README.md")));
  if (hasDecisions && hasLegacy) return "mixed";
  if (hasDecisions) return "shared";
  if (hasLegacy) return "legacy-split";
  return "incomplete";
}

async function countDecisionFiles(packRoot: string): Promise<number> {
  const directory = path.join(packRoot, "skills/product-design/references/decisions");
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile() && !entry.isSymbolicLink() && entry.name.endsWith(".md") && entry.name !== "README.md").length;
  } catch {
    return 0;
  }
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

const DECISIONS_HOME = "skills/product-design/references/decisions/README.md";
const LEGACY_CONFORMANCE_HOME = "skills/product-design/references/conformance/README.md";
const LEGACY_EXPRESSION_HOME = "skills/product-design/references/expression/README.md";

async function readablePackFile(packRoot: string, relative: string, issues: ValidationIssue[]): Promise<"ok" | "missing" | "bad"> {
  try {
    await resolvePackFile(packRoot, relative);
    return "ok";
  } catch (error) {
    if (error instanceof TasteError && error.code === "pack_file_not_found") return "missing";
    issues.push({
      path: relative,
      message: error instanceof TasteError ? error.message : "Required Pack file is missing or unreadable.",
    });
    return "bad";
  }
}

async function validatePackAt(packRoot: string): Promise<PackValidation> {
  const issues: ValidationIssue[] = [];
  const requiredFiles = ["README.md", "manifest.json", ENTRY_SKILL];
  for (const relative of requiredFiles) {
    const state = await readablePackFile(packRoot, relative, issues);
    if (state === "missing") issues.push({ path: relative, message: "Required Pack file is missing or unreadable." });
  }

  // Product references and metadata are intentionally optional: the host derives
  // the useful Pack shape from the product sweep instead of satisfying a fixed catalog.
  // Legacy Decision layouts are still inspected when present, but are not required.
  await readablePackFile(packRoot, DECISIONS_HOME, issues);
  await readablePackFile(packRoot, LEGACY_CONFORMANCE_HOME, issues);
  await readablePackFile(packRoot, LEGACY_EXPRESSION_HOME, issues);

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
    if (record.supportedModes !== undefined && (!Array.isArray(record.supportedModes) || !record.supportedModes.every((item) => typeof item === "string"))) {
      issues.push({ path: "manifest.json", message: "supportedModes is deprecated and ignored. Remove it, or keep it as an array of strings." });
    }
    if (record.surfaces !== undefined && (!Array.isArray(record.surfaces) || !record.surfaces.every((item) => typeof item === "string"))) {
      issues.push({ path: "manifest.json", message: "surfaces must be an array of strings when present." });
    }
    if (record.decisionPromotionCheckpoint !== undefined && (typeof record.decisionPromotionCheckpoint !== "string" || record.decisionPromotionCheckpoint.trim().length === 0 || record.decisionPromotionCheckpoint.length > 500)) {
      issues.push({ path: "manifest.json", message: "decisionPromotionCheckpoint must be a non-empty string of at most 500 characters when present." });
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

export async function initializePack(repositoryPath: string, productName: string, surfaces: string[] = [], decisionPromotionCheckpoint?: string): Promise<{ packPath: string; filesCreated: string[] }> {
  const repositoryRoot = await resolveRepositoryRoot(repositoryPath);
  const packRoot = path.join(repositoryRoot, PACK_DIRECTORY);
  try {
    await lstat(packRoot);
    throw new TasteError(`A path already exists at ${packRoot}; initialization never overwrites an existing Pack.`, "pack_already_exists");
  } catch (error) {
    if (error instanceof TasteError) throw error;
    // A missing path is the expected starting state.
  }

  const files = createStarterPackFiles(productName, surfaces, decisionPromotionCheckpoint);
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

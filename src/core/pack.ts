import { lstat, mkdir, readFile, readdir, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const PACK_DIRECTORY = "taste";
export const ENTRY_SKILL = "skills/product-design/SKILL.md";
export const MAX_PACK_FILE_BYTES = 256 * 1024;
const MAX_EVAL_FILES = 100;
const MAX_EVAL_BYTES = 1024 * 1024;

export type TaskApproach = "conformance" | "expression";
export type PackSetupStatus = "in_progress" | "usable_partial" | "complete";
export type MinimumUsableEvidence = "source_reviewed" | "rendered_flow";
export type SetupCoverageStatus = "source_reviewed" | "rendered" | "blocked" | "not_inspected";
export type SetupEvidenceType = "source_reviewed" | "rendered" | "design_reference" | "inference";

export interface SetupPolicy {
  minimumUsableEvidence: MinimumUsableEvidence;
}

export interface SetupEvidence {
  type: SetupEvidenceType;
  reference: string;
  checkedAt: string;
  note?: string;
}

export interface SetupCoverage {
  id: string;
  app: string;
  surface: string;
  journey?: string;
  status: SetupCoverageStatus;
  evidence: SetupEvidence[];
  guidanceFiles: string[];
  gap?: string;
}

export interface SetupScope {
  description: string;
  selection: "user_confirmed" | "host_selected";
  repositoryApps: string[];
  products: string[];
  exclusions: string[];
  coverageTarget: string;
  requiredCoverage: string[];
}

export interface PackManifest {
  name: string;
  version: string;
  surfaces: string[];
  /** Setup readiness state. */
  setupStatus: PackSetupStatus;
  setupPolicy?: SetupPolicy;
  setupScope?: SetupScope;
  coverage?: SetupCoverage[];
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

This starter is not product guidance. Use explicit \`/taste-setup\` to inspect and map a broader product scope. During normal UI work, do not launch that sweep; if resolved user feedback establishes a clear reusable lesson, the host may replace the starter with a minimal, evidence-backed Pack for the affected surface and mark that coverage \`usable_partial\`. No separate approval is needed.

## Apply this Pack

First identify the user's task and the affected product surface. Load only the product Skills, references, and checklists relevant to that pair. Then make a small approach choice:

- **Conformance:** apply relevant, established, sourced product guidance.
- **Expression:** explore when the request asks for a new direction, identifies a gap, or corrects existing guidance.
- **Clarify:** ask one focused question when repository evidence and the conversation do not resolve a material intent or scope ambiguity.

These labels describe how the host handles this task; they are not persisted states or Pack modes. Existing guidance can still inform an Expression task. Keep review tasks report-only unless editing is separately requested. Follow canonical repository sources for component APIs, design tokens, accessibility, and interaction contracts instead of copying them into this Pack.

Respect setup readiness and coverage separately. \`in_progress\` is not usable. With \`usable_partial\`, apply only guidanceFiles listed for evidence-backed surfaces; do not generalize it to blocked or uninspected journeys. \`complete\` applies only to the recorded scope and coverage target.

During setup, build the routing map from the actual product tasks, surfaces, and evidence. Do not assume every product needs the same reference categories or files. Add a shared reference only when it captures guidance useful across multiple surfaces; otherwise keep guidance scoped to the relevant surface. A URL, screenshot, or component identifies scope; it does not authorize an edit. Skip backend-only work with no user-visible effect, telemetry-only changes, generated files, and tests without shipped UI impact.

## Product-specific routing

Use the manifest and Pack routing map to identify the affected surface, then load only guidance relevant to both the task and surface. The host owns this routing judgment. Keep this Skill as one user-facing front door. Do not duplicate component or design-system documentation owned by the product repository.

## Learn from user feedback

Treat a user correction, rejection, or disagreement as direct evidence for the current task. Apply it, self-check the result with the host's available workflow, and update the scoped checklist when it expresses a clear reusable lesson. Do not require a separate Pack review or approval. Keep unresolved alternatives and one-off feedback in the host task. Distinguish directly observed behavior from inferred intent, cite sources, and mark uncertainty.

For explicit setup or a discovery refresh, follow \`taste-setup\` to inspect the repository, choose a bounded scope, and capture evidence. When implementing or reviewing visible UI, use the harness's available browser, computer, or rendered-preview tools when needed and report what you actually inspected.
`;

export function createStarterPackFiles(productName: string, surfaces: string[] = [], setupPolicy: SetupPolicy = { minimumUsableEvidence: "source_reviewed" }): PackFile[] {
  const normalizedName = productName.trim();
  if (normalizedName.length < 2 || normalizedName.length > 120) {
    throw new TasteError("Product name must be between 2 and 120 characters.", "invalid_product_name");
  }
  if (setupPolicy.minimumUsableEvidence !== "source_reviewed" && setupPolicy.minimumUsableEvidence !== "rendered_flow") {
    throw new TasteError("minimumUsableEvidence must be source_reviewed or rendered_flow.", "invalid_setup_policy");
  }

  const manifest: PackManifest = {
    name: normalizedName,
    version: "0.1.0",
    surfaces: surfaces.map((surface) => surface.trim()).filter(Boolean),
    setupStatus: "in_progress",
    setupPolicy,
  };

  return [
    {
      path: "README.md",
      content: `# ${normalizedName} Taste Pack\n\nSetup status: **in_progress**. This is only a safe-to-resume shell. Run the explicit \`/taste-setup\` workflow to independently inventory the repository, confirm a bounded scope, and write product-specific evidence-backed guidance. Listed surfaces are scope hints, not approved scope. Do not report setup usable until at least one surface meets \`setupPolicy.minimumUsableEvidence\`, or complete until all required coverage in the confirmed scope is rendered and validated.\n`,
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
  return writePackFileInternal(repositoryPath, relativePath, content);
}

async function writePackFileInternal(repositoryPath: string, relativePath: string, content: string): Promise<PackFile> {
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

export type PackLayout = "product-specific" | "incomplete";

export async function inspectPack(repositoryPath: string): Promise<{
  packPath: string;
  manifest: PackManifest | null;
  setupStatus: PackSetupStatus;
  coverageSummary: { sourceReviewed: number; rendered: number; blocked: number; notInspected: number; required: number; targetMet: boolean };
  entrySkillAvailable: boolean;
  referenceCount: number;
  layout: PackLayout;
  fixtureCounts: Record<TaskApproach, number>;
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
  const coverage = Array.isArray(manifest?.coverage)
    ? manifest.coverage.filter((item): item is SetupCoverage => isObjectRecord(item) && typeof item.id === "string" && typeof item.status === "string")
    : [];
  const requiredCoverage = Array.isArray(manifest?.setupScope?.requiredCoverage) ? manifest.setupScope.requiredCoverage.filter((id): id is string => typeof id === "string") : [];
  const coverageById = new Map(coverage.map((item) => [item.id, item]));
  const setupStatus = manifest?.setupStatus ?? "in_progress";
  const referenceRoot = path.join(packRoot, "skills/product-design/references");
  const referenceCount = await countMarkdown(referenceRoot);
  const fixtureCounts: Record<TaskApproach, number> = {
    conformance: (await listFixturesAt(packRoot, "conformance")).length,
    expression: (await listFixturesAt(packRoot, "expression")).length,
  };
  return {
    packPath: path.relative(repositoryRoot, packRoot).split(path.sep).join("/"),
    manifest,
    setupStatus,
    coverageSummary: {
      sourceReviewed: coverage.filter((item) => item.status === "source_reviewed").length,
      rendered: coverage.filter((item) => item.status === "rendered").length,
      blocked: coverage.filter((item) => item.status === "blocked").length,
      notInspected: coverage.filter((item) => item.status === "not_inspected").length,
      required: requiredCoverage.length,
      targetMet: requiredCoverage.length > 0 && requiredCoverage.every((id) => coverageById.get(id)?.status === "rendered"),
    },
    entrySkillAvailable: await resolvePackFile(packRoot, ENTRY_SKILL).then(() => true).catch(() => false),
    referenceCount,
    layout: await packLayout(packRoot),
    fixtureCounts,
    validation: await validatePackAt(packRoot),
  };
}

async function packLayout(packRoot: string): Promise<PackLayout> {
  const hasBase = await Promise.all(["README.md", "manifest.json", ENTRY_SKILL].map((relative) => exists(path.join(packRoot, relative))));
  return hasBase.every(Boolean) ? "product-specific" : "incomplete";
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

const SETUP_STATUSES = ["in_progress", "usable_partial", "complete"] as const;
const COVERAGE_STATUSES = ["source_reviewed", "rendered", "blocked", "not_inspected"] as const;
const EVIDENCE_TYPES = ["source_reviewed", "rendered", "design_reference", "inference"] as const;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

function validateSetupScope(value: unknown, issues: ValidationIssue[]): SetupScope | null {
  if (!isObjectRecord(value)) {
    issues.push({ path: "manifest.json", message: "setupScope must record the independently inventoried apps, selected products, exclusions, scope selection, and coverage target." });
    return null;
  }
  const selection = value.selection;
  const valid = typeof value.description === "string" && value.description.trim().length > 0
    && (selection === "user_confirmed" || selection === "host_selected")
    && stringArray(value.repositoryApps)
    && stringArray(value.products)
    && Array.isArray(value.exclusions) && value.exclusions.every((item) => typeof item === "string")
    && typeof value.coverageTarget === "string" && value.coverageTarget.trim().length > 0
    && stringArray(value.requiredCoverage) && new Set(value.requiredCoverage).size === value.requiredCoverage.length;
  if (!valid) {
    issues.push({ path: "manifest.json", message: "setupScope is missing a valid description, selection, repositoryApps, products, exclusions, coverageTarget, or requiredCoverage list." });
    return null;
  }
  return value as unknown as SetupScope;
}

function parseCoverage(value: unknown, issues: ValidationIssue[]): SetupCoverage[] {
  if (!Array.isArray(value)) {
    issues.push({ path: "manifest.json", message: "coverage must be an array that records source-reviewed, rendered, blocked, or not-inspected coverage per app/surface/journey." });
    return [];
  }
  const coverage: SetupCoverage[] = [];
  const ids = new Set<string>();
  value.forEach((item, index) => {
    const prefix = `coverage[${index}]`;
    if (!isObjectRecord(item)) {
      issues.push({ path: "manifest.json", message: `${prefix} must be an object.` });
      return;
    }
    if (typeof item.id !== "string" || !item.id.trim() || ids.has(item.id)) {
      issues.push({ path: "manifest.json", message: `${prefix}.id must be a unique, non-empty identifier.` });
    } else ids.add(item.id);
    if (typeof item.app !== "string" || !item.app.trim() || typeof item.surface !== "string" || !item.surface.trim()) {
      issues.push({ path: "manifest.json", message: `${prefix} must identify its app and surface.` });
    }
    if (item.journey !== undefined && (typeof item.journey !== "string" || !item.journey.trim())) {
      issues.push({ path: "manifest.json", message: `${prefix}.journey must be a non-empty string when present.` });
    }
    if (!COVERAGE_STATUSES.includes(item.status as (typeof COVERAGE_STATUSES)[number])) {
      issues.push({ path: "manifest.json", message: `${prefix}.status must be source_reviewed, rendered, blocked, or not_inspected.` });
    }
    if (!Array.isArray(item.evidence)) {
      issues.push({ path: "manifest.json", message: `${prefix}.evidence must be an array of typed, dated source references.` });
    } else {
      item.evidence.forEach((evidence, evidenceIndex) => {
        if (!isObjectRecord(evidence)
          || !EVIDENCE_TYPES.includes(evidence.type as (typeof EVIDENCE_TYPES)[number])
          || typeof evidence.reference !== "string" || !evidence.reference.trim()
          || typeof evidence.checkedAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(evidence.checkedAt)) {
          issues.push({ path: "manifest.json", message: `${prefix}.evidence[${evidenceIndex}] needs a supported type, reference, and YYYY-MM-DD checkedAt date.` });
        }
      });
    }
    if (!stringArray(item.guidanceFiles)) {
      issues.push({ path: "manifest.json", message: `${prefix}.guidanceFiles must list the Pack files supported by this coverage evidence.` });
    }
    if ((item.status === "blocked" || item.status === "not_inspected") && (typeof item.gap !== "string" || !item.gap.trim())) {
      issues.push({ path: "manifest.json", message: `${prefix}.gap must explain blocked or uninspected coverage.` });
    }
    if (typeof item.id === "string" && typeof item.app === "string" && typeof item.surface === "string" && COVERAGE_STATUSES.includes(item.status as (typeof COVERAGE_STATUSES)[number]) && Array.isArray(item.evidence) && stringArray(item.guidanceFiles)) {
      coverage.push(item as unknown as SetupCoverage);
    }
  });
  return coverage;
}

async function hasCitedActionableGuidance(packRoot: string, entry: SetupCoverage): Promise<boolean> {
  const sourceEvidence = entry.evidence.filter((evidence) => isObjectRecord(evidence) && evidence.type === "source_reviewed" && typeof evidence.reference === "string");
  if (sourceEvidence.length === 0) return false;
  for (const relative of entry.guidanceFiles) {
    try {
      const content = await readFile(await resolvePackFile(packRoot, relative), "utf8");
      if (content.trim().length < 80 || !sourceEvidence.some((evidence) => content.includes(evidence.reference))) continue;
      const hasRenderedEvidence = entry.evidence.some((evidence) => evidence.type === "rendered");
      if (!hasRenderedEvidence && !/(visual(?:ly)?[^\n.]{0,80}(?:not verified|unverified)|(?:not verified|unverified)[^\n.]{0,80}visual)/i.test(content)) continue;
      return true;
    } catch {
      // Missing guidance files cannot establish a usable surface.
    }
  }
  return false;
}

async function satisfiesMinimumEvidence(packRoot: string, coverage: SetupCoverage[], minimum: MinimumUsableEvidence): Promise<SetupCoverage[]> {
  const usable: SetupCoverage[] = [];
  for (const entry of coverage) {
    if (entry.status === "not_inspected") continue;
    if (minimum === "rendered_flow" && (entry.status !== "rendered" || !entry.evidence.some((evidence) => evidence.type === "rendered"))) continue;
    if (await hasCitedActionableGuidance(packRoot, entry)) usable.push(entry);
  }
  return usable;
}

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

  // Product references and metadata are optional; the host derives a useful shape from evidence.

  let manifest: unknown;
  try {
    const manifestPath = await resolvePackFile(packRoot, "manifest.json");
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    issues.push({ path: "manifest.json", message: "Must contain valid JSON." });
  }
  if (manifest && typeof manifest === "object") {
    const record = manifest as Record<string, unknown>;
    const allowedManifestFields = new Set(["name", "version", "surfaces", "setupStatus", "setupPolicy", "setupScope", "coverage"]);
    for (const key of Object.keys(record)) {
      if (!allowedManifestFields.has(key)) issues.push({ path: "manifest.json", message: `Unsupported manifest field: ${key}.` });
    }
    if (typeof record.name !== "string" || record.name.trim().length === 0) {
      issues.push({ path: "manifest.json", message: "name must be a non-empty string." });
    }
    if (typeof record.version !== "string" || record.version.trim().length === 0) {
      issues.push({ path: "manifest.json", message: "version must be a non-empty string." });
    }
    if (record.surfaces !== undefined && (!Array.isArray(record.surfaces) || !record.surfaces.every((item) => typeof item === "string"))) {
      issues.push({ path: "manifest.json", message: "surfaces must be an array of strings when present." });
    }
    if (record.setupStatus === undefined) {
      issues.push({ path: "manifest.json", message: "setupStatus is required and must be in_progress, usable_partial, or complete." });
    } else if (!SETUP_STATUSES.includes(record.setupStatus as (typeof SETUP_STATUSES)[number])) {
      issues.push({ path: "manifest.json", message: "setupStatus must be in_progress, usable_partial, or complete." });
    }
    const setupStatus = record.setupStatus;
    let minimumUsableEvidence: MinimumUsableEvidence = "source_reviewed";
    if (record.setupPolicy !== undefined) {
      if (!isObjectRecord(record.setupPolicy) || (record.setupPolicy.minimumUsableEvidence !== "source_reviewed" && record.setupPolicy.minimumUsableEvidence !== "rendered_flow") || Object.keys(record.setupPolicy).some((key) => key !== "minimumUsableEvidence")) {
        issues.push({ path: "manifest.json", message: "setupPolicy.minimumUsableEvidence must be source_reviewed or rendered_flow." });
      } else {
        minimumUsableEvidence = record.setupPolicy.minimumUsableEvidence;
      }
    }
    let setupScope: SetupScope | null = null;
    let coverage: SetupCoverage[] = [];
    if (setupStatus === "usable_partial" || setupStatus === "complete") {
      setupScope = validateSetupScope(record.setupScope, issues);
      coverage = parseCoverage(record.coverage, issues);
    } else if (record.setupScope !== undefined) {
      setupScope = validateSetupScope(record.setupScope, issues);
      if (record.coverage !== undefined) coverage = parseCoverage(record.coverage, issues);
    }
    if (setupStatus === "in_progress") {
      issues.push({ path: "manifest.json", message: "Taste setup is in progress and not yet usable. Resume /taste-setup; use usable_partial only after a surface meets the configured evidence bar." });
    }
    if (setupStatus === "usable_partial" || setupStatus === "complete") {
      const usableCoverage = await satisfiesMinimumEvidence(packRoot, coverage, minimumUsableEvidence);
      if (usableCoverage.length === 0) {
        issues.push({ path: "manifest.json", message: `No surface has specific, cited guidance meeting minimumUsableEvidence=${minimumUsableEvidence}. Keep setupStatus=in_progress.` });
      }
      if (setupStatus === "complete") {
        if (!setupScope || setupScope.requiredCoverage.length === 0) {
          issues.push({ path: "manifest.json", message: "A complete Pack must list its confirmed requiredCoverage and coverage target in setupScope." });
        } else {
          for (const requiredId of setupScope.requiredCoverage) {
            const entry = coverage.find((item) => item.id === requiredId);
            if (!entry || entry.status !== "rendered" || !entry.evidence.some((evidence) => evidence.type === "rendered") || !entry.evidence.some((evidence) => evidence.type === "source_reviewed") || !(await hasCitedActionableGuidance(packRoot, entry))) {
              issues.push({ path: "manifest.json", message: `Required coverage '${requiredId}' is not rendered, source-correlated, and supported by cited guidance; setup cannot be complete.` });
            }
          }
        }
      }
      const readOptional = async (relative: string) => {
        try {
          return await readFile(await resolvePackFile(packRoot, relative), "utf8");
        } catch {
          return "";
        }
      };
      const readme = await readOptional("README.md");
      const entry = await readOptional(ENTRY_SKILL);
      if (/Setup status:\s*\*\*in_progress\*\*/i.test(readme) || /This starter is not product guidance/i.test(entry)) {
        issues.push({ path: "manifest.json", message: "Pack still contains starter boilerplate. Replace it with scoped, repository-specific guidance before marking it usable_partial or complete." });
      }
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

export async function initializePack(repositoryPath: string, productName: string, surfaces: string[] = [], setupPolicy: SetupPolicy = { minimumUsableEvidence: "source_reviewed" }): Promise<{ packPath: string; filesCreated: string[] }> {
  const repositoryRoot = await resolveRepositoryRoot(repositoryPath);
  const packRoot = path.join(repositoryRoot, PACK_DIRECTORY);
  try {
    await lstat(packRoot);
    throw new TasteError(`A path already exists at ${packRoot}; initialization never overwrites an existing Pack.`, "pack_already_exists");
  } catch (error) {
    if (error instanceof TasteError) throw error;
    // A missing path is the expected starting state.
  }

  const files = createStarterPackFiles(productName, surfaces, setupPolicy);
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

async function listFixturesAt(packRoot: string, mode: TaskApproach): Promise<string[]> {
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

async function fixtureRoot(repositoryPath: string, mode: TaskApproach, fixtureId: string): Promise<string> {
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

export async function listEvaluationFixtures(repositoryPath: string, taskApproach: TaskApproach): Promise<string[]> {
  const { packRoot } = await resolvePackRoot(repositoryPath);
  return listFixturesAt(packRoot, taskApproach);
}

export async function getEvaluationGeneratorCase(repositoryPath: string, mode: TaskApproach, fixtureId: string): Promise<{ mode: TaskApproach; fixtureId: string; task: string; before: PackFile[] }> {
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

export async function getEvaluationJudgePacket(repositoryPath: string, mode: TaskApproach, fixtureId: string, generatedOutput: PackFile[] = []): Promise<{ mode: TaskApproach; fixtureId: string; task: string; rubric: string; generatedOutput: PackFile[]; expectedAfter: PackFile[] }> {
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

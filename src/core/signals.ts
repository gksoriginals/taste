import { listPackMarkdown, readPackFile, TasteError, writeDecisionFile, type PackFile } from "./pack.js";

export const DECISION_DIRECTORY = "skills/product-design/references/decisions";

export type DecisionStatus = "proposed" | "accepted" | "rejected";
export type SignalTrigger = "interview" | "sweep" | "gap" | "rejected_pass";
export type PartActivity = "conformance" | "expression";
export type TaskIntent = "apply_existing" | "new_direction" | "correction" | "gap" | "greenfield" | "unclear" | "inspect_only";
export type DecisionReason =
  | "accepted_shipped"
  | "promotion_evidence_missing"
  | "coverage_gap"
  | "rejected"
  | "proposed"
  | "accepted_not_shipped"
  | "unparsed"
  | "no_decisions";

export interface SignalInput {
  id: string;
  title: string;
  statement: string;
  rationale?: string;
  scope?: string;
  status: DecisionStatus;
  trigger: SignalTrigger;
  validatedArtifact: string;
  validationEvidence: string[];
  userApprovedArtifact: string;
  userApprovalEvidence: string;
  shippedEvidence?: string[];
  coverageGap?: boolean;
  coverageGapNote?: string;
  knownFlaws?: string;
  alternatives?: string;
}

export interface ParsedDecision {
  path: string;
  id: string;
  title: string;
  status: DecisionStatus;
  trigger: SignalTrigger;
  scope: string;
  coverageGap: boolean;
  shipped: boolean;
  promotionEvidenceComplete: boolean;
  parsed: true;
}

export interface UnparsedDecision {
  path: string;
  id: string;
  parsed: false;
  reason: "unparsed";
}

export interface DerivedDecision {
  id: string;
  path: string;
  scope: string;
  activity: PartActivity;
  reason: DecisionReason;
  status?: DecisionStatus;
  trigger?: SignalTrigger;
  shipped?: boolean;
  promotionEvidenceComplete?: boolean;
  coverageGap?: boolean;
}

export interface PartState {
  scope: string;
  activity: PartActivity;
  reason: DecisionReason;
  decisionIds: string[];
}

export interface TaskRouting {
  scope: string;
  activity: "expression";
  intent: TaskIntent;
  note: string;
}

export interface PackPartState {
  decisions: DerivedDecision[];
  scopes: PartState[];
  /**
   * True when at least one listed part derives to Expression.
   * This is not a pack-wide mode and does not flip the Pack.
   */
  anyPartNeedsExpression: boolean;
  /** Task-local routing override. It never changes the Pack-derived scopes above. */
  taskRouting?: TaskRouting;
  note: string;
}

const STATUSES = new Set<DecisionStatus>(["proposed", "accepted", "rejected"]);
const TRIGGERS = new Set<SignalTrigger>(["interview", "sweep", "gap", "rejected_pass"]);
const EMPTY_NOTE = "_None recorded._";
const NO_GAP_NOTE = "None recorded.";

interface ExistingDecision {
  scope?: string;
  validatedArtifact?: string;
  coverageGap?: boolean;
  statement?: string;
  rationale?: string;
  shippedEvidence: string[];
  coverageGapNote?: string;
  knownFlaws?: string;
  alternatives?: string;
}

export function decisionPath(id: string): string {
  return `${DECISION_DIRECTORY}/${assertDecisionId(id)}.md`;
}

export function assertDecisionId(id: string): string {
  if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(id)) {
    throw new TasteError("Decision id must be a lowercase slug (letters, numbers, hyphens).", "invalid_decision_id");
  }
  return id;
}

export function deriveDecisionActivity(decision: {
  status: DecisionStatus;
  shipped: boolean;
  coverageGap: boolean;
  promotionEvidenceComplete?: boolean;
}): { activity: PartActivity; reason: Exclude<DecisionReason, "unparsed" | "no_decisions"> } {
  if (decision.coverageGap) return { activity: "expression", reason: "coverage_gap" };
  if (decision.status === "rejected") return { activity: "expression", reason: "rejected" };
  if (decision.status === "proposed") return { activity: "expression", reason: "proposed" };
  if (!decision.promotionEvidenceComplete) return { activity: "expression", reason: "promotion_evidence_missing" };
  if (!decision.shipped) return { activity: "expression", reason: "accepted_not_shipped" };
  return { activity: "conformance", reason: "accepted_shipped" };
}

export function renderDecision(input: SignalInput): string {
  const id = assertDecisionId(input.id);
  const title = oneLine(input.title, "title");
  const scope = oneLine(input.scope?.trim() || "unscoped", "scope");
  const statement = input.statement.trim();
  if (!statement) throw new TasteError("Decision statement is required.", "invalid_decision");
  validatePromotionEvidence(input);
  const shippedEvidence = (input.shippedEvidence ?? []).map((item) => item.trim()).filter(Boolean);
  const coverageGap = input.coverageGap ?? false;
  if (coverageGap) throw new TasteError("Resolve the coverage gap before writing a Decision to the Pack.", "promotion_incomplete");
  const lines = [
    "---",
    `id: ${id}`,
    `title: ${yamlScalar(title)}`,
    `status: ${input.status}`,
    `trigger: ${input.trigger}`,
    `scope: ${yamlScalar(scope)}`,
    `coverage_gap: ${coverageGap ? "true" : "false"}`,
    `shipped: ${shippedEvidence.length > 0 ? "true" : "false"}`,
    `validated_artifact: ${yamlScalar(input.validatedArtifact.trim())}`,
    `user_approved_artifact: ${yamlScalar(input.userApprovedArtifact.trim())}`,
    "---",
    "",
    `# ${title}`,
    "",
    "## Statement",
    "",
    statement,
    "",
    "## Rationale",
    "",
    input.rationale?.trim() || "_None recorded._",
    "",
    "## Shipped evidence",
    "",
    shippedEvidence.length > 0 ? shippedEvidence.map((item) => `- ${item}`).join("\n") : "- none",
    "",
    "## Validation evidence",
    "",
    input.validationEvidence.map((item) => `- ${item.trim()}`).join("\n"),
    "",
    "## User approval evidence",
    "",
    input.userApprovalEvidence.trim(),
    "",
    "## Coverage gap",
    "",
    coverageGap ? (input.coverageGapNote?.trim() || "Gap recorded. The Pack cannot justify the next step for this part.") : "None recorded.",
    "",
    "## Known flaws",
    "",
    input.knownFlaws?.trim() || "_None recorded._",
    "",
    "## Alternatives",
    "",
    input.alternatives?.trim() || "_None recorded._",
    "",
  ];
  return lines.join("\n");
}

export function parseDecision(file: PackFile): ParsedDecision | UnparsedDecision {
  const idFromPath = file.path.split("/").pop()?.replace(/\.md$/, "") ?? file.path;
  const frontmatter = file.content.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/);
  if (!frontmatter) return { path: file.path, id: idFromPath, parsed: false, reason: "unparsed" };
  const fields = parseFrontmatter(frontmatter[1]);
  const status = fields.status as DecisionStatus;
  const trigger = fields.trigger as SignalTrigger;
  const coverageGap = booleanField(fields.coverage_gap);
  if (!fields.id || !STATUSES.has(status) || !TRIGGERS.has(trigger) || !fields.scope || coverageGap === undefined) {
    return { path: file.path, id: fields.id || idFromPath, parsed: false, reason: "unparsed" };
  }
  const body = file.content.slice(frontmatter[0].length);
  const sections = sectionMap(body);
  const validatedArtifact = meaningful(fields.validated_artifact, ["none"]);
  const userApprovedArtifact = meaningful(fields.user_approved_artifact, ["none"]);
  const validationEvidence = parseEvidence(sections["Validation evidence"]);
  const userApprovalEvidence = meaningful(sections["User approval evidence"], [EMPTY_NOTE]);
  const promotionEvidenceComplete = Boolean(
    validatedArtifact && validatedArtifact === userApprovedArtifact && validationEvidence.length > 0 && userApprovalEvidence,
  );
  return {
    path: file.path,
    id: fields.id,
    title: fields.title || fields.id,
    status,
    trigger,
    scope: fields.scope,
    coverageGap,
    shipped: fields.shipped === "true",
    promotionEvidenceComplete,
    parsed: true,
  };
}

export async function recordSignal(repositoryPath: string, input: SignalInput): Promise<{ path: string; activity: PartActivity; reason: DecisionReason; content: string }> {
  validatePromotionEvidence(input);
  if (input.status !== "accepted") {
    throw new TasteError("Taste only records finalized, user-approved Decisions. Keep drafts and rejected iterations in the host's active task context.", "promotion_incomplete");
  }
  if (input.coverageGap === true) {
    throw new TasteError("Resolve the coverage gap before writing a Decision to the Pack.", "promotion_incomplete");
  }
  const existing = await loadExistingDecision(repositoryPath, input.id);
  const content = renderDecision(mergeSignal(existing, input));
  const written = await writeDecisionFile(repositoryPath, decisionPath(input.id), content);
  const parsed = parseDecision(written);
  if (!parsed.parsed) {
    return { path: written.path, activity: "expression", reason: "unparsed", content: written.content };
  }
  const derived = deriveDecisionActivity(parsed);
  return { path: written.path, activity: derived.activity, reason: derived.reason, content: written.content };
}

export async function readPartState(repositoryPath: string, scope?: string, taskIntent?: TaskIntent): Promise<PackPartState> {
  const files = await listPackMarkdown(repositoryPath, DECISION_DIRECTORY);
  const wanted = scope?.trim();
  const decisions: DerivedDecision[] = [];
  for (const file of files) {
    const parsed = parseDecision(file);
    if (!parsed.parsed) {
      if (wanted && parsed.id !== wanted) continue;
      decisions.push({
        id: parsed.id,
        path: parsed.path,
        scope: "unscoped",
        activity: "expression",
        reason: "unparsed",
      });
      continue;
    }
    if (wanted && parsed.scope !== wanted && parsed.id !== wanted) continue;
    const derived = deriveDecisionActivity(parsed);
    decisions.push({
      id: parsed.id,
      path: parsed.path,
      scope: parsed.scope,
      activity: derived.activity,
      reason: derived.reason,
      status: parsed.status,
      trigger: parsed.trigger,
      shipped: parsed.shipped,
      promotionEvidenceComplete: parsed.promotionEvidenceComplete,
      coverageGap: parsed.coverageGap,
    });
  }

  if (decisions.length === 0) {
    return {
      decisions: [],
      scopes: [{ scope: wanted || "(pack)", activity: "expression", reason: "no_decisions", decisionIds: [] }],
      anyPartNeedsExpression: true,
      ...(taskIntent ? { taskRouting: expressionTaskRouting(wanted, taskIntent) } : {}),
      note: "No structured Decision matches. Expression applies for that part until a Decision has complete matching validation and user-approval evidence, shipped evidence, and no coverage gap. The host owns the workflow; this report only derives part activity.",
    };
  }

  const byScope = new Map<string, DerivedDecision[]>();
  for (const decision of decisions) {
    const group = byScope.get(decision.scope) ?? [];
    group.push(decision);
    byScope.set(decision.scope, group);
  }

  const scopes: PartState[] = [...byScope.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([part, group]) => {
    const blocking = group.find((decision) => decision.activity === "expression");
    return {
      scope: part,
      activity: blocking ? "expression" : "conformance",
      reason: blocking?.reason ?? "accepted_shipped",
      decisionIds: group.map((decision) => decision.id),
    };
  });

  return {
    decisions,
    scopes,
    anyPartNeedsExpression: scopes.some((part) => part.activity === "expression"),
    ...(taskIntent ? { taskRouting: expressionTaskRouting(wanted, taskIntent) } : {}),
    note: "Per-part activity only. The Pack does not flip as a whole. An early positive reaction nudges the host to continue its workflow; it does not promote a Decision. The host owns checks, readiness, user review, and push.",
  };
}

function expressionTaskRouting(scope: string | undefined, intent: TaskIntent): TaskRouting | undefined {
  if (intent === "apply_existing" || intent === "inspect_only") return undefined;
  const detail: Record<Exclude<TaskIntent, "apply_existing" | "inspect_only">, string> = {
    new_direction: "The current task asks for a new direction, so use Expression for this task even if the Pack contains Conformance Decisions.",
    correction: "The current task corrects existing UI or product guidance, so use Expression for this task even if the Pack contains Conformance Decisions.",
    gap: "The current task identifies a gap in the existing guidance, so use Expression for this task.",
    greenfield: "The current task is creating a new part, so use Expression for this task.",
    unclear: "The request does not clearly indicate whether to apply or change existing guidance. Stay in Expression while the host clarifies the intended direction.",
  };
  return {
    scope: scope ?? "(current task scope not specified)",
    activity: "expression",
    intent,
    note: detail[intent],
  };
}

function booleanField(value: string | undefined): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function mergeSignal(existing: ExistingDecision | null, input: SignalInput): SignalInput {
  if (!existing) return input;
  let coverageGap = input.coverageGap;
  if (coverageGap === undefined) {
    if (existing.coverageGap === undefined) {
      throw new TasteError(
        "Existing Decision has a missing or invalid coverage_gap. Provide coverageGap explicitly before updating it.",
        "invalid_decision",
      );
    }
    coverageGap = existing.coverageGap;
  }
  const artifactChanged = existing.validatedArtifact !== input.validatedArtifact.trim();
  return {
    id: input.id,
    title: input.title,
    statement: input.statement,
    status: input.status,
    trigger: input.trigger,
    rationale: input.rationale !== undefined ? input.rationale : existing.rationale,
    scope: input.scope !== undefined ? input.scope : existing.scope,
    validatedArtifact: input.validatedArtifact,
    validationEvidence: input.validationEvidence,
    userApprovedArtifact: input.userApprovedArtifact,
    userApprovalEvidence: input.userApprovalEvidence,
    shippedEvidence: input.shippedEvidence !== undefined ? input.shippedEvidence : artifactChanged ? [] : existing.shippedEvidence,
    coverageGap,
    coverageGapNote: input.coverageGapNote !== undefined ? input.coverageGapNote : existing.coverageGapNote,
    knownFlaws: input.knownFlaws !== undefined ? input.knownFlaws : existing.knownFlaws,
    alternatives: input.alternatives !== undefined ? input.alternatives : existing.alternatives,
  };
}

async function loadExistingDecision(repositoryPath: string, id: string): Promise<ExistingDecision | null> {
  try {
    const file = await readPackFile(repositoryPath, decisionPath(id));
    return parseExistingDecision(file.content);
  } catch (error) {
    if (error instanceof TasteError && error.code === "pack_file_not_found") return null;
    throw error;
  }
}

function parseExistingDecision(content: string): ExistingDecision {
  const frontmatter = content.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/);
  const fields = frontmatter ? parseFrontmatter(frontmatter[1]) : {};
  const body = frontmatter ? content.slice(frontmatter[0].length) : content;
  const sections = sectionMap(body);
  return {
    scope: fields.scope,
    validatedArtifact: meaningful(fields.validated_artifact, ["none"]),
    coverageGap: booleanField(fields.coverage_gap),
    statement: meaningful(sections.Statement, []),
    rationale: meaningful(sections.Rationale, [EMPTY_NOTE]),
    shippedEvidence: parseEvidence(sections["Shipped evidence"]),
    coverageGapNote: meaningful(sections["Coverage gap"], [NO_GAP_NOTE]),
    knownFlaws: meaningful(sections["Known flaws"], [EMPTY_NOTE]),
    alternatives: meaningful(sections.Alternatives, [EMPTY_NOTE]),
  };
}

function sectionMap(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  for (const part of body.split(/^## /m)) {
    const newline = part.indexOf("\n");
    if (newline === -1) continue;
    const name = part.slice(0, newline).trim();
    sections[name] = part.slice(newline + 1).trim();
  }
  return sections;
}

function parseEvidence(section: string | undefined): string[] {
  if (!section) return [];
  const items = section.split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
  if (items.length === 1 && items[0] === "none") return [];
  return items;
}

function meaningful(text: string | undefined, placeholders: string[]): string | undefined {
  const trimmed = text?.trim();
  if (!trimmed || placeholders.includes(trimmed)) return undefined;
  return trimmed;
}

function oneLine(value: string, label: string): string {
  return boundedLine(value, label, 200);
}

function boundedLine(value: string, label: string, maxLength: number): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength || /[\r\n]/.test(trimmed)) {
    throw new TasteError(`${label} must be a single line of 1–${maxLength} characters.`, "invalid_decision");
  }
  return trimmed;
}

function validatePromotionEvidence(input: SignalInput): void {
  const artifact = boundedLine(input.validatedArtifact, "validatedArtifact", 1000);
  const approvedArtifact = boundedLine(input.userApprovedArtifact, "userApprovedArtifact", 1000);
  if (artifact !== approvedArtifact) {
    throw new TasteError("User approval must refer to the exact validated artifact being recorded.", "promotion_incomplete");
  }
  if (!input.validationEvidence.length || input.validationEvidence.length > 30) {
    throw new TasteError("At least one host-reported validation result is required before recording a Decision.", "promotion_incomplete");
  }
  for (const [index, evidence] of input.validationEvidence.entries()) {
    boundedLine(evidence, `validationEvidence[${index}]`, 1000);
  }
  boundedLine(input.userApprovalEvidence, "userApprovalEvidence", 1000);
  if (input.status !== "accepted") {
    throw new TasteError("Only accepted Decisions can be added to the Pack. Keep unapproved drafts and rejected iterations in the host's active task context.", "promotion_incomplete");
  }
}

function yamlScalar(value: string): string {
  if (/[:#"'&*!|>%@`[\],{}]/.test(value) || value !== value.trim()) {
    return `"${value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}"`;
  }
  return value;
}

function parseFrontmatter(block: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) continue;
    fields[match[1]] = unquote(match[2].trim());
  }
  return fields;
}

function unquote(value: string): string {
  if (value.startsWith("\"") && value.endsWith("\"") && value.length >= 2) {
    return value.slice(1, -1).replaceAll("\\\"", "\"").replaceAll("\\\\", "\\");
  }
  return value;
}

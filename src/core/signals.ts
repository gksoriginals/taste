import { listPackMarkdown, TasteError, writePackFile, type PackFile } from "./pack.js";

export const DECISION_DIRECTORY = "skills/product-design/references/decisions";

export type DecisionStatus = "proposed" | "accepted" | "rejected";
export type SignalTrigger = "interview" | "sweep" | "gap" | "rejected_pass";
export type PartActivity = "conformance" | "expression";
export type DecisionReason =
  | "accepted_shipped"
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
  coverageGap?: boolean;
}

export interface PartState {
  scope: string;
  activity: PartActivity;
  reason: DecisionReason;
  decisionIds: string[];
}

export interface PackPartState {
  decisions: DerivedDecision[];
  scopes: PartState[];
  /**
   * True when at least one listed part derives to Expression.
   * This is not a pack-wide mode and does not flip the Pack.
   */
  anyPartNeedsExpression: boolean;
  note: string;
}

const STATUSES = new Set<DecisionStatus>(["proposed", "accepted", "rejected"]);
const TRIGGERS = new Set<SignalTrigger>(["interview", "sweep", "gap", "rejected_pass"]);

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
}): { activity: PartActivity; reason: Exclude<DecisionReason, "unparsed" | "no_decisions"> } {
  if (decision.coverageGap) return { activity: "expression", reason: "coverage_gap" };
  if (decision.status === "rejected") return { activity: "expression", reason: "rejected" };
  if (decision.status === "proposed") return { activity: "expression", reason: "proposed" };
  if (!decision.shipped) return { activity: "expression", reason: "accepted_not_shipped" };
  return { activity: "conformance", reason: "accepted_shipped" };
}

export function renderDecision(input: SignalInput): string {
  const id = assertDecisionId(input.id);
  const title = oneLine(input.title, "title");
  const scope = oneLine(input.scope?.trim() || "unscoped", "scope");
  const statement = input.statement.trim();
  if (!statement) throw new TasteError("Decision statement is required.", "invalid_decision");
  const shippedEvidence = (input.shippedEvidence ?? []).map((item) => item.trim()).filter(Boolean);
  const coverageGap = input.coverageGap ?? input.trigger === "gap";
  const lines = [
    "---",
    `id: ${id}`,
    `title: ${yamlScalar(title)}`,
    `status: ${input.status}`,
    `trigger: ${input.trigger}`,
    `scope: ${yamlScalar(scope)}`,
    `coverage_gap: ${coverageGap ? "true" : "false"}`,
    `shipped: ${shippedEvidence.length > 0 ? "true" : "false"}`,
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
  if (!fields.id || !STATUSES.has(status) || !TRIGGERS.has(trigger) || !fields.scope) {
    return { path: file.path, id: fields.id || idFromPath, parsed: false, reason: "unparsed" };
  }
  return {
    path: file.path,
    id: fields.id,
    title: fields.title || fields.id,
    status,
    trigger,
    scope: fields.scope,
    coverageGap: fields.coverage_gap === "true",
    shipped: fields.shipped === "true",
    parsed: true,
  };
}

export async function recordSignal(repositoryPath: string, input: SignalInput): Promise<{ path: string; activity: PartActivity; reason: DecisionReason; content: string }> {
  const content = renderDecision(input);
  const written = await writePackFile(repositoryPath, decisionPath(input.id), content);
  const parsed = parseDecision(written);
  if (!parsed.parsed) {
    return { path: written.path, activity: "expression", reason: "unparsed", content: written.content };
  }
  const derived = deriveDecisionActivity(parsed);
  return { path: written.path, activity: derived.activity, reason: derived.reason, content: written.content };
}

export async function readPartState(repositoryPath: string, scope?: string): Promise<PackPartState> {
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
      coverageGap: parsed.coverageGap,
    });
  }

  if (decisions.length === 0) {
    return {
      decisions: [],
      scopes: [{ scope: wanted || "(pack)", activity: "expression", reason: "no_decisions", decisionIds: [] }],
      anyPartNeedsExpression: true,
      note: "No structured Decision matches. Expression applies for that part until a Decision is accepted, has shipped evidence, and has no coverage gap. This report does not start a mode change.",
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
    note: "Per-part activity only. The Pack does not flip as a whole. Who initiates a move between Expression and Conformance is open; this tool does not decide it.",
  };
}

function oneLine(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 200 || /[\r\n]/.test(trimmed)) {
    throw new TasteError(`${label} must be a single line of 1–200 characters.`, "invalid_decision");
  }
  return trimmed;
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

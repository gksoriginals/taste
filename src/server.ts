import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { resolveTasteMode } from "./core/mode.js";
import { logDiagnostic } from "./core/diagnostics.js";
import {
  getEvaluationGeneratorCase,
  getEvaluationJudgePacket,
  initializePack,
  inspectPack,
  listEvaluationFixtures,
  readPackFile,
  TasteError,
  validatePack,
  writePackFile,
  type SetupPolicy,
  type TasteMode,
} from "./core/pack.js";
import { readPartState, recordSignal } from "./core/signals.js";

const repositoryPath = z.string().min(1).describe("Absolute path to the target product repository, obtained from the host harness.");
const mode = z.enum(["conformance", "expression"]);

function success(data: object) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data as Record<string, unknown>,
  };
}

function failure(error: unknown) {
  const message = error instanceof TasteError ? error.message : "Taste could not complete this operation. Check the repository path and Pack, then retry.";
  return { isError: true, content: [{ type: "text" as const, text: message }] };
}

async function toolResult<T extends object>(toolName: string, operation: () => Promise<T> | T) {
  const startedAt = Date.now();
  logDiagnostic("debug", "tool_started", { tool: toolName });
  try {
    const result = success(await operation());
    logDiagnostic("debug", "tool_completed", { tool: toolName, durationMs: Date.now() - startedAt });
    return result;
  } catch (error) {
    logDiagnostic("error", "tool_failed", {
      tool: toolName,
      durationMs: Date.now() - startedAt,
      errorCode: error instanceof TasteError ? error.code : "unexpected_error",
    });
    return failure(error);
  }
}

export function createTasteServer(): McpServer {
  const server = new McpServer(
    { name: "taste", version: "0.1.0" },
    {
      instructions: "For UI tasks, route from the current user request and affected product surface, then load the relevant Skill, reference, and checklist. Choose whether to apply established guidance, explore a new direction/gap/correction, or ask a focused clarification when intent or scope is materially unclear. Conformance and Expression are behavior labels, not persistent Pack modes. Use taste_part_state only for legacy structured Decision compatibility or diagnostics; it is not the normal routing authority for checklist-based Packs.",
    },
  );

  server.registerTool(
    "taste_mode_resolve",
    {
      title: "Resolve the selected Taste mode",
      description: "Deprecated legacy helper. Maps an already-interpreted signal to Conformance or Expression. It does not read the Pack or route normal task-and-surface work. Checklist-based UI routing belongs to the host and product Skill; Taste does not classify raw user language.",
      inputSchema: {
        currentMode: mode.optional().describe("Current task-local mode, if one has already been selected."),
        trigger: z.enum(["explicit_mode", "established_direction", "new_direction", "direction_accepted", "unclear"]),
        explicitMode: mode.optional().describe("Required when trigger is explicit_mode."),
        userConfirmed: z.boolean().optional().describe("Whether the user explicitly accepted the proposed direction as product guidance."),
        rationale: z.string().max(2000).describe("The coding agent's short rationale, based on the product Skill and conversation context."),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (input) => toolResult("taste_mode_resolve", () => resolveTasteMode(input)),
  );

  server.registerTool(
    "taste_pack_initialize",
    {
      title: "Initialize a Taste Pack",
      description: "Create a non-overwriting Taste Pack shell only during explicitly invoked /taste-setup, after repository inventory confirms user-facing product UI or UI source. Do not initialize if no product UI or UI source exists. Source-only inspection may yield useful cited guidance and setupStatus=usable_partial under the default source_reviewed policy, with visual behavior labeled unverified; rendered_flow requires a rendered representative journey. New Packs default to setupStatus=in_progress and setupPolicy.minimumUsableEvidence=source_reviewed. Setup status is in_progress, usable_partial, or complete; coverage remains recorded separately per app/surface/journey. Continue across accessible apps when one journey is blocked. Routine UI work must not start setup or create a missing Pack. Setup never edits product UI, AGENTS.md, or harness configuration.",
      inputSchema: {
        repositoryPath,
        productName: z.string().min(2).max(120).describe("Product name for the starter Pack."),
        surfaces: z.array(z.string().min(1).max(100)).max(30).optional().describe("Unconfirmed surface hints only; the host must independently inventory the repository and confirm scope."),
        decisionPromotionCheckpoint: z.string().trim().min(1).max(500).optional().describe("Legacy reminder text for hosts that still use structured Decision promotion. Routine checklist learning from product setup and conversation does not require this checkpoint."),
        setupPolicy: z.object({ minimumUsableEvidence: z.enum(["source_reviewed", "rendered_flow"]) }).optional().describe("Per-repository minimum bar for usable_partial. Defaults to source_reviewed; rendered_flow requires a representative journey in the running product."),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ repositoryPath: root, productName, surfaces, decisionPromotionCheckpoint, setupPolicy }) => toolResult("taste_pack_initialize", async () => initializePack(root, productName, surfaces, decisionPromotionCheckpoint, setupPolicy as SetupPolicy | undefined)),
  );

  server.registerTool(
    "taste_pack_inspect",
    {
      title: "Inspect a Taste Pack",
      description: "Summarize the target repository's Taste Pack, lifecycle status, per-surface coverage counts and target progress, legacy layout, decisions, references, fixtures, and validation. Status and coverage are distinct; usable_partial guidance applies only to listed evidence-backed coverage. Legacy incomplete maps to in_progress, and Packs without a setupStatus are reported as legacy. Reads only taste/.",
      inputSchema: { repositoryPath },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root }) => toolResult("taste_pack_inspect", async () => inspectPack(root)),
  );

  server.registerTool(
    "taste_pack_read",
    {
      title: "Read Taste Pack guidance",
      description: "Read one Markdown or JSON file by a path relative to the target repository's taste/ directory. Paths are confined to that Pack.",
      inputSchema: {
        repositoryPath,
        path: z.string().min(1).max(300).describe("Pack-relative path, such as skills/product-design/SKILL.md."),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root, path: relativePath }) => toolResult("taste_pack_read", async () => readPackFile(root, relativePath)),
  );

  server.registerTool(
    "taste_pack_write",
    {
      title: "Write Taste Pack guidance",
      description: "Create or replace one bounded text file inside the target repository's taste/ Pack. This cannot write harness instructions, files outside the Pack, or structured Decision files under skills/product-design/references/decisions/. Use for explicit Pack setup/maintenance, and for a resolved reusable checklist lesson from normal UI work when a complete Pack already exists. Do not use normal UI work to create a missing Pack or refresh setup. The host self-checks checklist learning in the same task; no separate review or promotion approval is required. taste_record_signal is retained for legacy structured Decision records.",
      inputSchema: {
        repositoryPath,
        path: z.string().min(1).max(300).describe("Pack-relative destination path."),
        content: z.string().max(256 * 1024).describe("UTF-8 file contents, up to 256 KiB."),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root, path: relativePath, content }) => toolResult("taste_pack_write", async () => writePackFile(root, relativePath, content)),
  );

  server.registerTool(
    "taste_pack_validate",
    {
      title: "Validate Taste Pack structure",
      description: "Check Pack structure: manifest, entry Skill, shared facts, authority, rubric, and either a decisions/ home or the legacy conformance plus expression reference READMEs. Does not require supportedModes. Structural validation only, not a quality judgment.",
      inputSchema: { repositoryPath },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root }) => toolResult("taste_pack_validate", async () => validatePack(root)),
  );

  server.registerTool(
    "taste_record_signal",
    {
      title: "Record a Taste Decision",
      description: "Legacy structured Decision write path. Routine product learning from user corrections, rejected directions, and resolved design disagreements belongs in scoped checklist files written with taste_pack_write; do not route it through a separate Decision promotion or approval step. The legacy schema still requires matching validation and user-approval evidence. Use it only to maintain an existing structured Decision record, not as the default learning path. Taste stores supplied reports; it does not run or judge checks, observe conversations, or push. Same id updates the legacy Decision in place; a new artifact clears prior shipped evidence unless new shipped evidence is supplied.",
      inputSchema: {
        repositoryPath,
        id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,80}$/).describe("Stable decision slug. Reuse it to update the same signal."),
        title: z.string().min(1).max(200),
        statement: z.string().min(1).max(8000).describe("The judgment, in the user's terms."),
        rationale: z.string().max(8000).optional(),
        scope: z.string().min(1).max(200).optional().describe("Part this Decision belongs to, such as a surface or feature. Defaults to unscoped."),
        status: z.literal("accepted").describe("Record only after the user approves the tested artifact; that approval authorizes recording the derived reusable Decision."),
        trigger: z.enum(["interview", "sweep", "gap", "rejected_pass"]),
        validatedArtifact: z.string().trim().min(1).max(1000).describe("Stable reference to the exact final artifact the host's workflow validated, such as a commit, release candidate, or inspected deployed version."),
        validationEvidence: z.array(z.string().trim().min(1).max(1000)).min(1).max(30).describe("Host-reported results and evidence for relevant product-specific checks. The host chooses these; Taste does not run or judge them."),
        userApprovedArtifact: z.string().trim().min(1).max(1000).describe("Must identify the same final artifact as validatedArtifact."),
        userApprovalEvidence: z.string().trim().min(1).max(1000).describe("Brief host-reported evidence that the user approved this exact tested artifact."),
        shippedEvidence: z.array(z.string().min(1).max(500)).max(20).optional().describe("References to shipped UI actually inspected. Empty means not shipped."),
        coverageGap: z.literal(false).default(false).describe("An unresolved coverage gap cannot be promoted to the Pack."),
        knownFlaws: z.string().max(4000).optional(),
        alternatives: z.string().max(4000).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async (input) => toolResult("taste_record_signal", async () => recordSignal(input.repositoryPath, input)),
  );

  server.registerTool(
    "taste_part_state",
    {
      title: "Inspect legacy Taste Decision state",
      description: "Legacy compatibility and diagnostics only. Reports derived activity for structured Decision records and optionally accepts the caller's interpreted taskIntent for legacy taskRouting output. Do not use this tool to route checklist-based Packs; the host routes from the current task and affected surface. It does not read conversation text, run checks, write a mode field, or change the Pack.",
      inputSchema: {
        repositoryPath,
        scope: z.string().min(1).max(200).optional().describe("Optional part name or decision id to filter."),
        taskIntent: z.enum(["apply_existing", "new_direction", "correction", "gap", "greenfield", "unclear", "inspect_only"]).optional().describe("Optional legacy diagnostic context. Omit for Pack inspection. This does not route normal checklist-based UI tasks."),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root, scope, taskIntent }) => toolResult("taste_part_state", async () => readPartState(root, scope, taskIntent)),
  );

  server.registerTool(
    "taste_eval_list_fixtures",
    {
      title: "List Taste evaluation fixtures",
      description: "List fixture IDs for one mode without exposing before or expected-after states.",
      inputSchema: { repositoryPath, mode },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root, mode: selectedMode }) => toolResult("taste_eval_list_fixtures", async () => ({ mode: selectedMode, fixtureIds: await listEvaluationFixtures(root, selectedMode as TasteMode) })),
  );

  server.registerTool(
    "taste_eval_get_generator_case",
    {
      title: "Get evaluation generator input",
      description: "Return the task and before/ state for one evaluation fixture. Never returns expected-after files or the Rubric. Use for the generator arm only.",
      inputSchema: {
        repositoryPath,
        mode,
        fixtureId: z.string().min(1).max(100),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root, mode: selectedMode, fixtureId }) => toolResult("taste_eval_get_generator_case", async () => getEvaluationGeneratorCase(root, selectedMode as TasteMode, fixtureId)),
  );

  server.registerTool(
    "taste_eval_get_judge_packet",
    {
      title: "Get evaluation Judge packet",
      description: "Return the task, one completed generator output, expected-after state, and product Rubric for a Judge pass. Call only after the generator run is complete and from the harness's higher-capacity Eval Judge subagent in a fresh context. This is context separation by workflow, not an access-control boundary.",
      inputSchema: {
        repositoryPath,
        mode,
        fixtureId: z.string().min(1).max(100),
        generatedOutput: z.array(z.object({
          path: z.string().min(1).max(300),
          content: z.string(),
        })).max(100).describe("Generated files from the completed generator run; exclude fixture expected-after files."),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root, mode: selectedMode, fixtureId, generatedOutput }) => toolResult("taste_eval_get_judge_packet", async () => getEvaluationJudgePacket(root, selectedMode as TasteMode, fixtureId, generatedOutput)),
  );

  return server;
}

const server = createTasteServer();
logDiagnostic("debug", "server_starting", { version: "0.1.0", transport: "stdio" });
await server.connect(new StdioServerTransport());

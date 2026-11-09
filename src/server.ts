import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { recordSessionTrace, sessionRunId, sessionTraceFields } from "./core/session-trace.js";
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
  type TaskApproach,
} from "./core/pack.js";

const repositoryPath = z.string().min(1).describe("Absolute path to the target product repository, obtained from the host harness.");

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

async function toolResult<T extends object>(toolName: string, operation: () => Promise<T> | T, runId?: string) {
  const startedAt = Date.now();
  const correlation: Record<string, string> = runId ? { runId } : {};
  logDiagnostic("debug", "tool_started", { tool: toolName, ...correlation });
  try {
    const result = success(await operation());
    logDiagnostic("debug", "tool_completed", { tool: toolName, durationMs: Date.now() - startedAt, ...correlation });
    return result;
  } catch (error) {
    logDiagnostic("error", "tool_failed", {
      tool: toolName,
      durationMs: Date.now() - startedAt,
      ...correlation,
      errorCode: error instanceof TasteError ? error.code : "unexpected_error",
    });
    return failure(error);
  }
}

export function createTasteServer(): McpServer {
  const server = new McpServer(
    { name: "taste", version: "0.4.0" },
    {
      instructions: "For UI tasks, route from the current user request and affected product surface, then load the relevant Skill and scoped guidance. Choose whether to apply established guidance, explore a new direction/gap/correction, or ask a focused clarification when intent or scope is materially unclear. Conformance and Expression are behavior labels, not Pack modes."
        + (process.env.TASTE_TRACE_DIR ? " Local session tracing is enabled. Follow the Session traces section of taste-design." : ""),
    },
  );

  server.registerTool(
    "taste_session_record",
    {
      title: "Record a local Taste session trace",
      description: "Save a bounded host-authored decision and verification record outside the Pack. Requires TASTE_TRACE_DIR. Use only for an opted-in product task and omit sensitive data and raw transcripts. When the host ran check-and-repair, include checkSummaries.before and checkSummaries.after.",
      inputSchema: sessionTraceFields,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (trace) => toolResult("taste_session_record", () => recordSessionTrace(trace), trace.runId),
  );

  server.registerTool(
    "taste_pack_initialize",
    {
      title: "Initialize a Taste Pack",
      description: "Create a non-overwriting Taste Pack shell. A Pack preserves durable product judgment, tested lessons, and traps from use that future work is unlikely to recover by rereading the code or reopening the screen; link to canonical sources rather than restating them. Use during explicitly invoked /taste-setup after repository inventory, or during normal UI work only after resolved user feedback establishes a clear reusable lesson for a specific surface. In the feedback case, immediately replace starter text with surface-scoped guidance, mark only that coverage usable_partial, and validate; do not sweep unrelated apps or routes. Do not initialize if no product UI or UI source exists. Source-only inspection may yield useful guidance under the default source_reviewed policy, with visual behavior labeled unverified; rendered_flow requires a rendered representative journey. New Packs default to setupStatus=in_progress and setupPolicy.minimumUsableEvidence=source_reviewed. Coverage is recorded separately per app/surface/journey. Broader setup remains explicit and never edits product UI, AGENTS.md, or harness configuration.",
      inputSchema: {
        runId: sessionRunId.optional(),
        repositoryPath,
        productName: z.string().min(2).max(120).describe("Product name for the Pack."),
        surfaces: z.array(z.string().min(1).max(100)).max(30).optional().describe("Scope hints from repository inventory or the active UI task. For a feedback-created Pack, include only the affected surface."),
        setupPolicy: z.object({ minimumUsableEvidence: z.enum(["source_reviewed", "rendered_flow"]) }).optional().describe("Per-repository minimum bar for usable_partial. Defaults to source_reviewed; rendered_flow requires a representative journey in the running product."),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ runId, repositoryPath: root, productName, surfaces, setupPolicy }) => toolResult("taste_pack_initialize", async () => initializePack(root, productName, surfaces, setupPolicy as SetupPolicy | undefined), runId),
  );

  server.registerTool(
    "taste_pack_inspect",
    {
      title: "Inspect a Taste Pack",
      description: "Summarize the target repository's Taste Pack, lifecycle status, per-surface coverage counts (including how many rendered a populated state) and target progress, references, fixtures, validation, and migrationNeeded steps for older Packs (a legacy incomplete status reads as in_progress). Status and coverage are distinct; usable_partial guidance applies only to listed evidence-backed coverage. Reads only taste/.",
      inputSchema: { runId: sessionRunId.optional(), repositoryPath },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ runId, repositoryPath: root }) => toolResult("taste_pack_inspect", async () => inspectPack(root), runId),
  );

  server.registerTool(
    "taste_pack_read",
    {
      title: "Read Taste Pack guidance",
      description: "Read one Markdown or JSON file by a path relative to the target repository's taste/ directory. Paths are confined to that Pack.",
      inputSchema: {
        runId: sessionRunId.optional(),
        repositoryPath,
        path: z.string().min(1).max(300).describe("Pack-relative path, such as skills/product-design/SKILL.md."),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ runId, repositoryPath: root, path: relativePath }) => toolResult("taste_pack_read", async () => readPackFile(root, relativePath), runId),
  );

  server.registerTool(
    "taste_pack_write",
    {
      title: "Write Taste Pack guidance",
      description: "Create or replace one bounded text file inside the target repository's taste/ Pack. This cannot write harness instructions, files outside the Pack. Use for explicit Pack setup/maintenance and for a resolved reusable lesson during normal UI work. Keep guidance for durable product judgment and tested lessons that are unlikely to be recovered from canonical sources; link to code, docs, lint, instructions, or rendered behavior instead of copying them. Preserve evidence and distinguish observation, inference, and settled intent. Include rationale or rejected options only when they help retain knowledge. Do not add manifest fields for rationale. When creating a missing Pack from feedback, write only the affected surface's guidance and coverage metadata; do not start a sweep. The host applies the lesson and keeps it only when existing checks show improvement or no regression; no separate review or approval is required.",
      inputSchema: {
        runId: sessionRunId.optional(),
        repositoryPath,
        path: z.string().min(1).max(300).describe("Pack-relative destination path."),
        content: z.string().max(256 * 1024).describe("UTF-8 file contents, up to 256 KiB."),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ runId, repositoryPath: root, path: relativePath, content }) => toolResult("taste_pack_write", async () => writePackFile(root, relativePath, content), runId),
  );

  server.registerTool(
    "taste_pack_validate",
    {
      title: "Validate Taste Pack structure",
      description: "Check Pack structure, manifest, and evidence relationships. Fails when: usable_partial or complete coverage has only inference evidence; a source_reviewed reference is not an existing repository-relative file path; a rendered entry has no statesObserved; a blocked entry has no accessAttempts; a required not_inspected entry has neither accessAttempts nor an explicit out-of-scope/unsafe-to-attempt reason; or complete coverage has not rendered every setupScope.requiredStates state (default populated). Warns, without failing, when no rendered entry observed a populated state. Guidance wording and evaluation fixtures are optional; validation does not impose a prose template or judge product design.",
      inputSchema: { runId: sessionRunId.optional(), repositoryPath },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ runId, repositoryPath: root }) => toolResult("taste_pack_validate", async () => validatePack(root), runId),
  );

  server.registerTool(
    "taste_eval_list_fixtures",
    {
      title: "List Taste evaluation fixtures",
      description: "List fixture IDs for one task approach without exposing before or expected-after states.",
      inputSchema: { runId: sessionRunId.optional(), repositoryPath, taskApproach: z.enum(["conformance", "expression"]) },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ runId, repositoryPath: root, taskApproach }) => toolResult("taste_eval_list_fixtures", async () => ({ taskApproach, fixtureIds: await listEvaluationFixtures(root, taskApproach as TaskApproach) }), runId),
  );

  server.registerTool(
    "taste_eval_get_generator_case",
    {
      title: "Get evaluation generator input",
      description: "Return the task and before/ state for one evaluation fixture. Never returns expected-after files or the Rubric. Use for the generator arm only.",
      inputSchema: {
        runId: sessionRunId.optional(),
        repositoryPath,
        taskApproach: z.enum(["conformance", "expression"]),
        fixtureId: z.string().min(1).max(100),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ runId, repositoryPath: root, taskApproach: selectedMode, fixtureId }) => toolResult("taste_eval_get_generator_case", async () => getEvaluationGeneratorCase(root, selectedMode as TaskApproach, fixtureId), runId),
  );

  server.registerTool(
    "taste_eval_get_judge_packet",
    {
      title: "Get evaluation Judge packet",
      description: "Return the task, one completed generator output, expected-after state, and product Rubric for a Judge pass. Call only after the generator run is complete and from the harness's higher-capacity Eval Judge subagent in a fresh context. This is context separation by workflow, not an access-control boundary.",
      inputSchema: {
        runId: sessionRunId.optional(),
        repositoryPath,
        taskApproach: z.enum(["conformance", "expression"]),
        fixtureId: z.string().min(1).max(100),
        generatedOutput: z.array(z.object({
          path: z.string().min(1).max(300),
          content: z.string(),
        })).max(100).describe("Generated files from the completed generator run; exclude fixture expected-after files."),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ runId, repositoryPath: root, taskApproach: selectedMode, fixtureId, generatedOutput }) => toolResult("taste_eval_get_judge_packet", async () => getEvaluationJudgePacket(root, selectedMode as TaskApproach, fixtureId, generatedOutput), runId),
  );

  return server;
}

const server = createTasteServer();
logDiagnostic("debug", "server_starting", { version: "0.4.0", transport: "stdio" });
await server.connect(new StdioServerTransport());

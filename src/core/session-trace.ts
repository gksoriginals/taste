import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { TasteError } from "./pack.js";

export const sessionRunId = z.uuid().describe("Host-generated UUID for this product task. Reuse it across Taste calls and trace entries.");

const summary = z.string().trim().min(1).max(2000);
const references = z.array(z.string().trim().min(1).max(500)).max(30);

export const sessionTraceFields = {
  runId: sessionRunId,
  inputRevision: summary,
  task: summary,
  surface: summary,
  guidanceRead: references,
  guidanceApplied: references,
  decision: summary,
  verification: z.array(z.object({
    kind: z.enum(["rendered", "source", "test"]),
    result: summary,
    artifacts: references,
  })).max(15),
  artifacts: references,
  feedback: z.object({
    status: z.enum(["pending", "accepted", "corrected", "rejected"]),
    summary: summary.optional(),
  }),
};

export async function recordSessionTrace(trace: z.infer<z.ZodObject<typeof sessionTraceFields>>) {
  const directory = process.env.TASTE_TRACE_DIR;
  if (!directory) throw new TasteError("Session tracing is disabled. Set TASTE_TRACE_DIR to opt in.", "trace_disabled");
  if (!path.isAbsolute(directory)) throw new TasteError("TASTE_TRACE_DIR must be an absolute path.", "invalid_trace_directory");

  const file = path.join(directory, `${trace.runId}-${randomUUID()}.json`);
  try {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await writeFile(file, JSON.stringify({
      schemaVersion: 1,
      recordedAt: new Date().toISOString(),
      ...trace,
    }, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  } catch {
    throw new TasteError("Could not save the session trace. Check the configured trace directory.", "trace_write_failed");
  }
  return { runId: trace.runId, file };
}

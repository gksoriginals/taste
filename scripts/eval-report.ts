import { readFile } from "node:fs/promises";
import { z } from "zod";

const nonempty = z.string().trim().min(1);
const observation = z.object({
  score: z.number().int().min(0).max(3),
  evidence: nonempty,
});
const arm = z.object({
  artifact: nonempty,
  loadedGuidance: z.array(nonempty),
  toolsUsed: z.array(nonempty),
  scores: z.record(nonempty, observation),
  durationMs: z.number().int().nonnegative().optional(),
});

const runSchema = z.object({
  fixture: nonempty,
  inputRevision: nonempty,
  split: z.enum(["development", "holdout"]),
  harness: nonempty,
  generator: nonempty,
  judge: nonempty,
  comparison: nonempty,
  baseline: arm,
  candidate: arm,
  deviations: z.array(nonempty),
  followUp: z.array(nonempty),
});

async function main(files: string[]) {
  if (!files.length) throw new Error("Usage: npm run eval:report -- <run.json> [run.json ...]");

  for (const file of files) {
    const run = runSchema.parse(JSON.parse(await readFile(file, "utf8")));
    const dimensions = Object.keys(run.baseline.scores);
    if (!dimensions.length || dimensions.length !== Object.keys(run.candidate.scores).length
      || dimensions.some((dimension) => !Object.hasOwn(run.candidate.scores, dimension))) {
      throw new Error(`${file}: both arms must score the same nonempty set of dimensions`);
    }

    const scores = Object.fromEntries(dimensions.map((dimension) => {
      const baseline = run.baseline.scores[dimension];
      const candidate = run.candidate.scores[dimension];
      return [dimension, { baseline, candidate, delta: candidate.score - baseline.score }];
    }));

    console.log(JSON.stringify({
      file,
      fixture: run.fixture,
      inputRevision: run.inputRevision,
      split: run.split,
      comparison: run.comparison,
      harness: run.harness,
      generator: run.generator,
      judge: run.judge,
      baseline: { artifact: run.baseline.artifact, loadedGuidance: run.baseline.loadedGuidance, toolsUsed: run.baseline.toolsUsed, durationMs: run.baseline.durationMs },
      candidate: { artifact: run.candidate.artifact, loadedGuidance: run.candidate.loadedGuidance, toolsUsed: run.candidate.toolsUsed, durationMs: run.candidate.durationMs },
      scores,
      deviations: run.deviations,
      followUp: run.followUp,
    }, null, 2));
  }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

"use server";
/**
 * Lightweight server action wrapper for Pareto analysis.
 *
 * This file intentionally avoids importing `genkit` or any @genkit-ai packages
 * at module scope. Next.js will bundle this file's wrapper for client-server
 * action support; importing heavy/server-only packages at module scope causes
 * the bundler to traverse their dependencies (Opentelemetry, require-in-the-middle)
 * and emits the warnings seen during development. Instead we dynamically import
 * the server implementation at runtime (server side only).
 */

export type ParetoAnalysisInput = { incidents: string[] };
export type ParetoAnalysisOutput = { analysis: { category: string; count: number }[] };

export async function analyzeIncidentsForPareto(
  input: ParetoAnalysisInput
): Promise<ParetoAnalysisOutput> {
  // Dynamically import the server-only implementation which performs the
  // Genkit initialization and prompt/flow definitions. This import happens
  // only at runtime on the server and will not be traversed by the client
  // bundler.
  const impl = await import('./pareto-analysis-flow.server');
  return impl.runParetoAnalysis(input);
}

// No other exports here; the heavy lifting is in the .server file.

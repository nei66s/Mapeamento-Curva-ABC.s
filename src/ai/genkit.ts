// Lazily import the Genkit runtime and plugins at runtime to avoid
// pulling server-only instrumentation into client bundles during Next.js
// compilation (which triggers the "require-in-the-middle" warnings).
// Minimal compatibility wrapper: replace Genkit + Google plugin with a thin
// OpenAI-based implementation used by the app's flows. This keeps the same
// `ai.definePrompt` and `ai.defineFlow` usage patterns but calls OpenAI's
// Chat Completions API under the hood.

import OpenAI from 'openai';

let _ai: any | null = null;

function fillTemplate(template: string, input: Record<string, any>) {
  let out = String(template || '');
  Object.keys(input || {}).forEach(key => {
    const re = new RegExp(`\\{\\{\\{${key}\\}\\}\\}`, 'g');
    out = out.replace(re, String(input[key] ?? ''));
  });
  return out;
}

export async function getAi(opts?: { model?: string; modelOptions?: Record<string, any> }) {
  if (_ai) return _ai;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required to initialize AI provider');
  }

  const client = new OpenAI({ apiKey });
  const defaultModel = opts?.model ?? process.env.OPENAI_MODEL ?? 'gpt-3.5-turbo';

  // Minimal Genkit-like surface used by our flows
  _ai = {
    definePrompt: (params: { prompt: string; name?: string; input?: any; output?: any }) => {
      const promptTemplate = params.prompt;
      return async (input: Record<string, any>) => {
        const promptText = fillTemplate(promptTemplate, input || {});
        const res = await client.chat.completions.create({ model: defaultModel, messages: [{ role: 'user', content: promptText }], ...(opts?.modelOptions || {}) });
        const text = String(res.choices?.[0]?.message?.content ?? '').trim();
        // Return multiple commonly-used keys so flows that expect `improved`, `description`,
        // `text` or `result` will find the value they need without failing validation.
        return { output: { improved: text, description: text, text, result: text } };
      };
    },
    defineFlow: (_meta: any, runner: (input: any) => Promise<any>) => {
      return async (input: any) => runner(input);
    },
  };

  return _ai;
}

// NOTE: call `await getAi()` from server-only code (API routes or server actions)
// to obtain the initialized instance. Avoid importing from this module at
// top-level in client-shared files.

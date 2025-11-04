// Lazily import the Genkit runtime and plugins at runtime to avoid
// pulling server-only instrumentation into client bundles during Next.js
// compilation (which triggers the "require-in-the-middle" warnings).
let _ai: any | null = null;

export async function getAi() {
  if (_ai) return _ai;
  const { genkit } = await import('genkit');
  const { googleAI } = await import('@genkit-ai/google-genai');
  _ai = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-2.5-flash',
  });
  return _ai;
}

// NOTE: call `await getAi()` from server-only code (API routes or server actions)
// to obtain the initialized instance. Avoid importing from this module at
// top-level in client-shared files.

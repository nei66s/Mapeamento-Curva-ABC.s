// Lazily import the Genkit runtime and plugins at runtime to avoid
// pulling server-only instrumentation into client bundles during Next.js
// compilation (which triggers the "require-in-the-middle" warnings).
let _ai: any | null = null;

export async function getAi(opts?: { model?: string; modelOptions?: Record<string, any> }) {
  if (_ai) return _ai;
  try {
    const { genkit } = await import('genkit');
    const { googleAI } = await import('@genkit-ai/google-genai');
    const model = opts?.model ?? 'googleai/gemini-2.5-flash';
    // genkit supports passing model-specific options in many runtimes; pass through modelOptions when available.
    _ai = genkit({
      plugins: [googleAI()],
      model,
      ...(opts?.modelOptions ? { modelOptions: opts.modelOptions } : {}),
    });
  } catch (err: any) {
    // Provide a clearer error message when Genkit / Google plugin fails to initialize
    console.error('Failed to initialize Genkit Google plugin. Ensure Google credentials are configured (GOOGLE_API_KEY or GOOGLE_APPLICATION_CREDENTIALS). Error:', err);
    throw err;
  }
  return _ai;
}

// NOTE: call `await getAi()` from server-only code (API routes or server actions)
// to obtain the initialized instance. Avoid importing from this module at
// top-level in client-shared files.

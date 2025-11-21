"use server";
import fs from 'fs';
import path from 'path';
import type { NextRequest } from 'next/server';

function checkEnvKey() {
  return (
    Boolean(process.env.GEMINI_API_KEY) ||
    Boolean(process.env.GOOGLE_API_KEY) ||
    Boolean(process.env.GOOGLE_GENAI_API_KEY) ||
    Boolean(process.env.VERTEX_API_KEY)
  );
}

function checkCredentialsFile() {
  const p = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.google_application_credentials;
  if (!p) return false;
  try {
    return fs.existsSync(path.resolve(p));
  } catch (err) {
    return false;
  }
}

export async function GET(_: NextRequest) {
  const envKey = checkEnvKey();
  const credFile = checkCredentialsFile();

  const available = envKey || credFile;

  return new Response(JSON.stringify({ ok: true, available, envKey: !!envKey, credFile: !!credFile }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getAi } from '@/ai/genkit';
import { z } from 'zod';
import { callWithRetries } from '@/ai/callWithRetries';
import { buildSystemPrompt } from '@/lib/ai/buildSystemPrompt';
import { buildConversationPrompt } from '@/lib/ai/buildConversationPrompt';
import { getProfileById, defaultProfileId } from '@/lib/ai/ai-profiles';

type ReqBody = {
  profileId?: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  mode?: 'chat' | 'report';
  appContext?: { url?: string; routes?: string[]; name?: string };
  userContext?: { id?: string; name?: string; role?: string; avatarUrl?: string; profileEditRoute?: string };
};

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json();
    const profile = getProfileById(body.profileId ?? defaultProfileId);
    if (!profile) return NextResponse.json({ ok: false, error: 'invalid-profile' }, { status: 400 });

    const mode = body.mode ?? 'chat';
    const systemPrompt = buildSystemPrompt(profile);
    const conversation = buildConversationPrompt(body.messages ?? [], mode);

    const appContext = (body as any).appContext;
    const appContextText = appContext
      ? `App Context:\nName: ${appContext.name ?? 'n/a'}\nURL: ${appContext.url ?? 'n/a'}\nRoutes: ${(appContext.routes ?? []).join(', ')}`
      : '';

    const userContext = (body as any).userContext;
    const userContextText = userContext
      ? `User Context:\nName: ${userContext.name ?? 'n/a'}\nRole: ${userContext.role ?? 'n/a'}\nProfileEditRoute: ${userContext.profileEditRoute ?? 'n/a'}\nAvatar: ${userContext.avatarUrl ?? 'n/a'}`
      : '';

    const promptText = [systemPrompt, conversation, appContextText, userContextText, mode === 'report' ? 'Gere um relatorio tecnico estruturado.' : 'Resposta curta e conversacional.'].filter(Boolean).join('\n\n');

    // Use Genkit runtime to call model
    const ai = await getAi();

    const InputSchema = z.object({ prompt: z.string() });
    const OutputSchema = z.object({ text: z.string() });

    const prompt = ai.definePrompt({
      name: 'appChatPrompt',
      input: { schema: InputSchema },
      output: { schema: OutputSchema },
      prompt: `{{{prompt}}}`,
    });

    const call = async () => {
      const { output } = await prompt({ prompt: promptText } as any);
      return output!;
    };

    const result = await callWithRetries(call, 3, 4000, 20000);

    return NextResponse.json({ ok: true, result: result.text });
  } catch (e: any) {
    console.error('AI generate error', e);
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

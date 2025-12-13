export const runtime = 'nodejs';

import { NextResponse } from 'next/server'
import { callWithRetries } from '@/ai/callWithRetries'
import { getAi } from '@/ai/genkit'
import { buildNanoBananaPrompt, normalizeIncoming } from '../utils'

// NOTE: prefer using the official SDK (GoogleGenAI) to avoid endpoint/model mismatches

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(async () => {
      const text = await request.text()
      throw new Error('invalid-json-body: ' + String(text).slice(0, 200))
    })

    const prompt = buildNanoBananaPrompt(normalizeIncoming(raw))
    const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_GENAI_API_KEY ?? process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Chave Google AI não encontrada. Defina GEMINI_API_KEY, GOOGLE_API_KEY ou GOOGLE_GENAI_API_KEY no ambiente.'
        },
        { status: 400 }
      )
    }

    // Use the project's Genkit wrapper so it picks up the same configured provider/key
    const ai = await getAi({ model: process.env.GENAI_IMAGE_MODEL ?? 'googleai/gemini-2.5-flash-image' })

    const modelName = process.env.GENAI_IMAGE_MODEL ?? 'googleai/imagen-3.0-generate-002'
    let genResponse: any
    try {
      genResponse = await callWithRetries(async () => {
        return await ai.generate({ model: modelName, prompt: prompt })
      })
    } catch (e: any) {
      console.error('nano-banana image API error:', e)
      const msg = e?.message ?? String(e)
      // Detect common model-not-found / unsupported-method messages from GenAI / plugin
      if (msg.includes('is not found') || msg.includes('not found') || msg.includes('is not found for API version') || msg.includes('[404') || msg.includes('404 Not Found')) {
        const advice = `Modelo ${modelName} não disponível para sua chave/projeto. Execute ListModels na API GenAI ou defina a variável de ambiente GENAI_IMAGE_MODEL para um modelo suportado.`
        return NextResponse.json({ ok: false, error: `Falha ao chamar modelo de imagem: ${msg}. ${advice}` }, { status: 502 })
      }
      // otherwise rethrow to be handled by outer catch
      throw e
    }

    // genResponse may contain different shapes depending on model/plugin.
    // Common: genResponse.message.content -> parts array; imagen plugin returns media parts with data URLs.
    const parts = genResponse?.message?.content ?? genResponse?.messages ?? genResponse?.candidates?.[0]?.content?.parts ?? []
    let imageData: string | undefined
    for (const part of parts) {
      if (part?.media?.url) {
        imageData = part.media.url
        break
      }
      if (part?.inlineData?.data) {
        const b64 = part.inlineData.data
        imageData = typeof b64 === 'string' && b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`
        break
      }
    }

    if (!imageData) {
      console.error('nano-banana genai returned no image parts', JSON.stringify(parts ?? []))
      return NextResponse.json({ ok: false, error: 'Não foi possível gerar a imagem do Nano Banana (sem dados retornados).' }, { status: 502 })
    }
    return NextResponse.json({ ok: true, prompt, image: imageData })
  } catch (err: any) {
    console.error('nano-banana error:', err)
    const message = err?.message ?? String(err)
    const isBadRequest = String(message).startsWith('invalid-json-body:') || String(message).includes('Chave Google AI não encontrada')
    const status = isBadRequest ? 400 : 502
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}

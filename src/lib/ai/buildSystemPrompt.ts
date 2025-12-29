import type { AiProfile } from "./ai-profiles";

const behaviorGuards = [
  "Responda de forma humana e contextual.",
  "Respostas curtas, no maximo 1 a 3 paragrafos.",
  "Evite linguagem excessivamente formal.",
  "Nao gere listas estruturadas automaticamente.",
  "Faca perguntas antes de diagnosticar.",
  "So gere relatorio tecnico quando solicitado.",
];

export function buildSystemPrompt(profile: AiProfile) {
  return [profile.systemPrompt.trim(), behaviorGuards.join(" ")].join("\n\n");
}

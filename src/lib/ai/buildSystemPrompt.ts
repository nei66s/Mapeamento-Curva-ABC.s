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
  // Add guidance for route suggestions: when user asks to open a page,
  // include the exact internal route (starting with "/") inline in the
  // assistant response so the client can detect it and render a clickable
  // button. Keep responses concise.
  const routeGuidance =
    "Se o usuario pedir para acessar uma pagina, inclua a rota interna exata iniciando com / (por exemplo: /escopos). Responda concisamente.";

  return [profile.systemPrompt.trim(), behaviorGuards.join(" "), routeGuidance].join("\n\n");
}

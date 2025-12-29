import type { AiProfile } from "./ai-profiles";
import { responseStructure } from "./ai-profiles";
import { buildConversationPrompt } from "./buildConversationPrompt";
import { buildSystemPrompt } from "./buildSystemPrompt";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type MockResponse = {
  text: string;
  promptUsed: string;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const followUps: Record<string, string[]> = {
  "senior-tech": [
    "Ele chega a energizar ou esta totalmente morto?",
    "Tem algum alarme no painel ou indicador piscando?",
    "Isso apareceu de repente ou foi piorando aos poucos?",
  ],
  "senior-engineer": [
    "Quando isso comecou e em qual condicao de operacao?",
    "Tem algum historico de falha semelhante ou manutencao recente?",
    "O sintoma ocorre sempre ou so em determinados ciclos?",
  ],
  specialist: [
    "Houve alguma mudanca recente de procedimento ou padrao?",
    "Existe registro de manutencao preventiva recente?",
    "Alguma nao conformidade ja foi apontada nessa area?",
  ],
};

const greetings: Record<string, string> = {
  "senior-tech": "Fala! Me conta o que esta acontecendo ai.",
  "senior-engineer": "Beleza. Qual o problema e em que condicao o sistema esta operando?",
  specialist: "Pode descrever o cenario tecnico e o historico recente?",
};

const isGreeting = (text: string) => {
  const normalized = text.trim().toLowerCase();
  return ["oi", "ola", "bom dia", "boa tarde", "boa noite", "e ai", "fala"].includes(normalized);
};

const pickFollowUp = (profileId: string) => {
  const options = followUps[profileId] ?? followUps["senior-tech"];
  return options[Math.floor(Math.random() * options.length)];
};

const buildChatReply = (profile: AiProfile, userPrompt: string) => {
  if (isGreeting(userPrompt)) {
    return greetings[profile.profileId] ?? greetings["senior-tech"];
  }

  const opener =
    profile.profileId === "senior-engineer"
      ? "Entendi. Vamos separar sintoma de causa antes de mexer no sistema."
      : profile.profileId === "specialist"
        ? "Entendi. Vamos situar o contexto tecnico antes de qualquer conclusao."
        : "Beleza. Vamos entender o sintoma antes de partir pra acao.";

  const question = pickFollowUp(profile.profileId);
  return `${opener} ${question}`;
};

const buildReportReply = (messages: ConversationMessage[]) => {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
  const context = lastUserMessage?.content?.trim();
  const contextLine = context ? `Contexto principal: ${context}` : "Contexto principal: relato incompleto.";

  return [
    "1. Diagnostico Inicial",
    `Sinais iniciais com base na conversa. ${contextLine}`,
    "",
    "2. Verificacoes Imediatas",
    "Confirmar energia, sensores, alarmes e condicoes operacionais descritas.",
    "",
    "3. Acao Recomendada",
    "Executar testes controlados, registrar resultados e ajustar conforme achados.",
    "",
    "4. Riscos se Nao Corrigir",
    "Risco de recorrencia, parada nao planejada e degradacao do ativo.",
    "",
    "5. Boas Praticas",
    "Padronizar registros, revisar plano de manutencao e alinhar com a equipe.",
  ].join("\n");
};

export async function createMockResponse(
  profile: AiProfile,
  messages: ConversationMessage[],
  mode: "chat" | "report" = "chat"
): Promise<MockResponse> {
  const promptUsed = [
    buildSystemPrompt(profile),
    buildConversationPrompt(messages, mode),
    mode === "report" ? `Formato:\n${responseStructure}` : "Resposta curta e conversacional.",
  ].join("\n\n");

  const text = mode === "report" ? buildReportReply(messages) : buildChatReply(profile, messages.at(-1)?.content ?? "");

  await wait(650);
  return { text, promptUsed };
}

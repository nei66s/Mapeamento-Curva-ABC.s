type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type ConversationMode = "chat" | "report";

const formatMessage = (message: ConversationMessage) =>
  `${message.role === "user" ? "Usuario" : "Assistente"}: ${message.content}`;

export function buildConversationPrompt(messages: ConversationMessage[], mode: ConversationMode = "chat") {
  const limit = mode === "chat" ? 6 : messages.length;
  const recent = messages.slice(-limit);

  if (recent.length === 0) {
    return "Sem historico de conversa.";
  }

  return recent.map(formatMessage).join("\n");
}

import { ChatWindow } from "@/components/ai-chat/ChatWindow";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = {
  title: "Chat Tecnico com IA",
};

export default function AiChatPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Chat tecnico com IA"
        description="Converse com um especialista para diagnosticar e resolver problemas tecnicos."
      />
      <ChatWindow />
    </div>
  );
}

import { ChatWindow } from "@/components/ai-chat/ChatWindow";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = {
  title: "Chat Tecnico com IA",
};

export default function AiChatPage() {
  return (
    <div className="page-stack flex flex-col h-screen overflow-hidden">
      <PageHeader
        title="Chat tecnico com IA"
        description="Converse com um especialista para diagnosticar e resolver problemas tecnicos."
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  );
}

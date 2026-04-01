import { ExportMenu } from "./ExportMenu";
import { ShareLinkButton } from "./ShareLinkButton";
import { useExportConversation } from "../hooks/useExportConversation";

interface ConversationHeaderActionsProps {
  conversationId: string;
}

export function ConversationHeaderActions({
  conversationId,
}: ConversationHeaderActionsProps) {
  const exportConversation = useExportConversation(conversationId);

  return (
    <div className="flex items-center gap-1 ml-auto">
      <ExportMenu
        conversationId={conversationId}
        onExport={(format) => exportConversation.mutate(format)}
        isExporting={exportConversation.isPending}
      />
      <ShareLinkButton conversationId={conversationId} />
    </div>
  );
}

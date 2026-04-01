import { MessageSquarePlus } from "lucide-react";
import { EmptyState } from "../components/EmptyState";

export function HomePage() {
  return (
    <EmptyState
      icon={MessageSquarePlus}
      title="No conversations yet"
      description="Start a new chat to ask questions about your documents."
    />
  );
}

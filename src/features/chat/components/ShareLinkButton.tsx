import { Link2 } from "lucide-react";
import { useCreateShareLink } from "../hooks/useCreateShareLink";
import { useUIStore } from "../../../store/uiStore";
import { Loader } from "../../../components/Loader";

interface ShareLinkButtonProps {
  conversationId: string;
}

export function ShareLinkButton({ conversationId }: ShareLinkButtonProps) {
  const createShareLink = useCreateShareLink(conversationId);
  const addToast = useUIStore((s) => s.addToast);

  const handleClick = async () => {
    try {
      const result = await createShareLink.mutateAsync();
      const shareUrl = `${window.location.origin}/share/${result.token}`;
      await navigator.clipboard.writeText(shareUrl);
      addToast("Share link copied to clipboard!", "success");
    } catch {
      addToast("Failed to create share link.", "error");
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={createShareLink.isPending}
      className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 transition-colors"
      aria-label="Copy shareable link"
    >
      {createShareLink.isPending ? (
        <Loader variant="spinner" className="h-3.5 w-3.5" />
      ) : (
        <Link2 className="h-3.5 w-3.5" />
      )}
      <span>Share</span>
    </button>
  );
}

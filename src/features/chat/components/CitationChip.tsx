import { useUIStore } from "../../../store/uiStore";

interface CitationChipProps {
  index: number;
  sourceId: string;
  /** If false, the citation may not accurately support the claim. */
  valid?: boolean;
}

export function CitationChip({
  index,
  sourceId,
  valid = true,
}: CitationChipProps) {
  const isSourcePanelOpen = useUIStore((s) => s.sourcePanel.isOpen);
  const openSourcePanel = useUIStore((s) => s.openSourcePanel);
  const highlightSource = useUIStore((s) => s.highlightSource);

  const handleClick = () => {
    if (!isSourcePanelOpen) {
      openSourcePanel(sourceId);
    }
    highlightSource(sourceId);
    setTimeout(() => {
      const card = document.getElementById(`source-${sourceId}`);
      card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 150);
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-medium transition-colors align-middle mx-0.5 ${
        valid
          ? "bg-muted text-foreground hover:bg-primary/20 hover:text-primary"
          : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-900/60"
      }`}
      title={
        valid
          ? `View source ${index + 1}`
          : `Citation ${index + 1} may not accurately support the claim`
      }
      aria-label={`Citation ${index + 1}${valid ? "" : " (unverified)"}`}
    >
      [{index + 1}]
    </button>
  );
}

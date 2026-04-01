import { useUIStore } from "../../../store/uiStore";

interface CitationChipProps {
  index: number;
  sourceId: string;
}

export function CitationChip({ index, sourceId }: CitationChipProps) {
  const { isSourcePanelOpen, toggleSourcePanel, setHighlightedSourceId } =
    useUIStore();

  const handleClick = () => {
    if (!isSourcePanelOpen) {
      toggleSourcePanel();
    }
    setHighlightedSourceId(sourceId);
    setTimeout(() => {
      const card = document.getElementById(`source-${sourceId}`);
      card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 150);
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground hover:bg-primary/20 hover:text-primary transition-colors align-middle mx-0.5"
      title={`View source ${index + 1}`}
      aria-label={`Citation ${index + 1}`}
    >
      [{index + 1}]
    </button>
  );
}

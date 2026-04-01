import { useEffect, useRef, useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { Loader } from "../../../components/Loader";

interface ExportMenuProps {
  conversationId: string;
  onExport: (format: "md" | "pdf") => void;
  isExporting: boolean;
}

export function ExportMenu({ onExport, isExporting }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen((v) => !v);

  const handleExport = (format: "md" | "pdf") => {
    onExport(format);
    setIsOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggle}
        disabled={isExporting}
        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 transition-colors"
        aria-label="Export conversation"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {isExporting ? (
          <Loader variant="spinner" className="h-3.5 w-3.5" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        <span>Export</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-md border bg-popover shadow-md py-1">
          <button
            onClick={() => handleExport("md")}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-popover-foreground hover:bg-muted transition-colors"
          >
            Markdown (.md)
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-popover-foreground hover:bg-muted transition-colors"
          >
            PDF (.md)
          </button>
        </div>
      )}
    </div>
  );
}

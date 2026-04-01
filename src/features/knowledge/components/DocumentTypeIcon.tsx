import {
  FileText,
  FileJson,
  FileCode,
  FileArchive,
  FileImage,
  File,
} from "lucide-react";

const iconMap: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  doc: FileText,
  txt: FileText,
  md: FileText,
  csv: FileText,
  xlsx: FileText,
  xls: FileText,
  json: FileJson,
  js: FileCode,
  ts: FileCode,
  py: FileCode,
  zip: FileArchive,
  tar: FileArchive,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
};

interface DocumentTypeIconProps {
  extension?: string;
  className?: string;
}

export function DocumentTypeIcon({
  extension,
  className,
}: DocumentTypeIconProps) {
  const Icon = extension ? (iconMap[extension.toLowerCase()] ?? File) : File;
  return (
    <Icon className={className ?? "h-4 w-4 shrink-0 text-muted-foreground"} />
  );
}

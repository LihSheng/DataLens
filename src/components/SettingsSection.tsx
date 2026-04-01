import type { ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-4">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

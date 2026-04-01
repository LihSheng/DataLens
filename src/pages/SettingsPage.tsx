import { SettingsForm } from "../features/settings/components/SettingsForm";

export function SettingsPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-6 border-b">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your RAG pipeline and model settings.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <SettingsForm />
        </div>
      </div>
    </div>
  );
}

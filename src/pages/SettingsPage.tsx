import { SettingsForm } from "../features/settings/components/SettingsForm";
import { DataErasureButton } from "../features/governance/components/DataErasureButton";
import { useAuthStore } from "../features/auth/store";
import { ShieldAlert } from "lucide-react";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-6 border-b">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your RAG pipeline and model settings.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <SettingsForm />
        </div>

        {/* Danger Zone */}
        <div className="bg-card rounded-lg border border-destructive/30 shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Danger Zone
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Irreversible actions related to your account and data.
                </p>
              </div>
              {user ? (
                <DataErasureButton user={user} />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Sign in to request data erasure.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

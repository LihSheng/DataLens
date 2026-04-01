import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import type { AccessMode, DocumentAcl } from "../../../types";
import {
  useDocumentAcl,
  useUpdateDocumentAcl,
} from "../../knowledge/hooks/useDocumentAcl";
import { PrincipalMultiSelect } from "./PrincipalMultiSelect";
import { Button } from "../../../components/ui/Button";

const AVAILABLE_ROLES = ["admin", "analyst", "viewer", "editor"];
const MOCK_USER_OPTIONS = [
  { id: "user_1", label: "alice@example.com" },
  { id: "user_2", label: "bob@example.com" },
  { id: "user_3", label: "carol@example.com" },
];

interface DocumentAccessControlPanelProps {
  documentId: string;
}

type LocalAcl = Pick<
  DocumentAcl,
  "accessMode" | "allowedRoles" | "allowedUsers"
>;

function buildLocalAcl(acl: DocumentAcl | undefined): LocalAcl {
  return {
    accessMode: acl?.accessMode ?? "all",
    allowedRoles: acl?.allowedRoles ?? [],
    allowedUsers: acl?.allowedUsers ?? [],
  };
}

function isAclDirty(local: LocalAcl, server: DocumentAcl | undefined): boolean {
  if (!server) return false;
  return (
    local.accessMode !== server.accessMode ||
    JSON.stringify(local.allowedRoles.sort()) !==
      JSON.stringify((server.allowedRoles ?? []).sort()) ||
    JSON.stringify(local.allowedUsers.sort()) !==
      JSON.stringify((server.allowedUsers ?? []).sort())
  );
}

export function DocumentAccessControlPanel({
  documentId,
}: DocumentAccessControlPanelProps) {
  const { data: acl, isLoading } = useDocumentAcl(documentId);
  const updateAcl = useUpdateDocumentAcl();

  const [local, setLocal] = useState<LocalAcl>(() => buildLocalAcl(acl));
  // Derive dirty from comparing local to server state — no extra setState needed
  const dirty = isAclDirty(local, acl);

  const updateField = <K extends keyof LocalAcl>(
    key: K,
    value: LocalAcl[K],
  ) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateAcl.mutate({ documentId, acl: local });
  };

  const handleReset = () => {
    setLocal(buildLocalAcl(acl));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Access Mode Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Access mode
        </label>
        <div className="flex gap-2">
          {(["all", "roles", "users"] as AccessMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => updateField("accessMode", mode)}
              className={[
                "rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                local.accessMode === mode
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-background text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              {mode === "all"
                ? "All users"
                : mode === "roles"
                  ? "Specific roles"
                  : "Specific users"}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {local.accessMode === "all"
            ? "All authenticated users can access this document."
            : local.accessMode === "roles"
              ? "Only users with the selected roles can access this document."
              : "Only the selected users can access this document."}
        </p>
      </div>

      {/* Roles selector */}
      {local.accessMode === "roles" && (
        <PrincipalMultiSelect
          label="Allowed roles"
          options={AVAILABLE_ROLES}
          selected={local.allowedRoles}
          onChange={(roles) => updateField("allowedRoles", roles)}
          placeholder="No roles selected"
        />
      )}

      {/* Users selector */}
      {local.accessMode === "users" && (
        <PrincipalMultiSelect
          label="Allowed users"
          options={MOCK_USER_OPTIONS.map((u) => u.label)}
          selected={local.allowedUsers}
          onChange={(users) => updateField("allowedUsers", users)}
          placeholder="No users selected"
        />
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Save className="h-3.5 w-3.5" />}
          onClick={handleSave}
          loading={updateAcl.isPending}
          disabled={!dirty}
        >
          Save
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
          disabled={!dirty || updateAcl.isPending}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

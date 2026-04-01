import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Button } from "../../../components/ui/Button";
import { useRequestDataErasure } from "../hooks/useRequestDataErasure";
import type { User } from "../../auth/store";

interface DataErasureButtonProps {
  user: User;
}

export function DataErasureButton({ user }: DataErasureButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const erasure = useRequestDataErasure();

  const handleConfirm = () => {
    erasure.mutate(user.id);
    setConfirmOpen(false);
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        leftIcon={<Trash2 className="h-3.5 w-3.5" />}
        onClick={() => setConfirmOpen(true)}
      >
        Request data erasure
      </Button>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Request data erasure?"
        description="This will request permanent deletion of all your data, including conversation history, feedback, and usage data. This action cannot be undone."
        confirmLabel="Request erasure"
        destructive
        isLoading={erasure.isPending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

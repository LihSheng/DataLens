import { useMutation } from "@tanstack/react-query";
import { usersApi } from "../../../services/api/users";
import { useUIStore } from "../../../store/uiStore";

export function useRequestDataErasure() {
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (userId: string) => usersApi.requestDataErasure(userId),
    onSuccess: () => {
      addToast(
        "Data erasure request submitted. You will receive a confirmation email.",
        "success",
      );
    },
    onError: (err: Error) => {
      addToast(`Failed to submit erasure request: ${err.message}`, "error");
    },
  });
}

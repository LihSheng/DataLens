import { useMutation } from "@tanstack/react-query";
import { usersApi } from "../../../services/api/users";
import { useUIStore } from "../../../store/uiStore";

export function useRequestDataErasure() {
  const pushToast = useUIStore((s) => s.pushToast);

  return useMutation({
    mutationFn: (userId: string) => usersApi.requestDataErasure(userId),
    onSuccess: () => {
      pushToast({
        message:
          "Data erasure request submitted. You will receive a confirmation email.",
        type: "success",
      });
    },
    onError: (err: Error) => {
      pushToast({
        message: `Failed to submit erasure request: ${err.message}`,
        type: "error",
      });
    },
  });
}

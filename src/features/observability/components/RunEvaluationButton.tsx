import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { observabilityApi } from "../../../services/api/observability";

export function RunEvaluationButton() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: observabilityApi.runEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    },
  });

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        size="sm"
        className="gap-2"
      >
        <Play className="h-4 w-4" />
        {mutation.isPending ? "Running…" : "Run Evaluation"}
      </Button>
      {mutation.isSuccess && (
        <span className="text-xs text-green-600 dark:text-green-400">
          Evaluation queued
        </span>
      )}
      {mutation.isError && (
        <span className="text-xs text-red-600 dark:text-red-400">
          Failed to run evaluation
        </span>
      )}
    </div>
  );
}

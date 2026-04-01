import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "../../../services/api/settings";
import { useSettingsStore } from "../store";
import { useUIStore } from "../../../store/uiStore";
import { Button } from "../../../components/ui/Button";
import { Toggle } from "../../../components/ui/Toggle";
import { RangeSlider } from "../../../components/ui/RangeSlider";
import type { RAGSettings } from "../../../types";

interface FormValues {
  modelName: string;
  topK: number;
  temperature: number;
  maxTokens: number;
  showSourcesPanel: boolean;
  enableStreaming: boolean;
}

const DEFAULT_SETTINGS: RAGSettings = {
  modelName: "gpt-4o-mini",
  topK: 5,
  temperature: 0.7,
  maxTokens: 2048,
  showSourcesPanel: true,
  enableStreaming: true,
};

export function SettingsForm() {
  const queryClient = useQueryClient();
  const {
    settings: storeSettings,
    updateSettings: updateStoreSettings,
    resetSettings: resetStoreSettings,
  } = useSettingsStore();
  const { addToast } = useUIStore();

  const { data: serverSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.getSettings,
  });

  const [formValues, setFormValues] = useState<FormValues>({
    modelName: storeSettings.modelName,
    topK: storeSettings.topK,
    temperature: storeSettings.temperature,
    maxTokens: storeSettings.maxTokens,
    showSourcesPanel: storeSettings.showSourcesPanel,
    enableStreaming: storeSettings.enableStreaming,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});

  // Sync form with server settings once loaded
  useEffect(() => {
    if (serverSettings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing server data to local form state
      setFormValues({
        modelName: serverSettings.modelName,
        topK: serverSettings.topK,
        temperature: serverSettings.temperature,
        maxTokens: serverSettings.maxTokens,
        showSourcesPanel: serverSettings.showSourcesPanel,
        enableStreaming: serverSettings.enableStreaming,
      });
    }
  }, [serverSettings]);

  const updateField = <K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    // Clear error when user modifies field
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormValues, string>> = {};

    if (!formValues.modelName.trim()) {
      newErrors.modelName = "Model name is required";
    }

    if (
      formValues.topK < 1 ||
      formValues.topK > 20 ||
      !Number.isInteger(formValues.topK)
    ) {
      newErrors.topK = "Top K must be an integer between 1 and 20";
    }

    if (formValues.temperature < 0 || formValues.temperature > 2) {
      newErrors.temperature = "Temperature must be between 0 and 2";
    }

    if (formValues.maxTokens < 1) {
      newErrors.maxTokens = "Max tokens must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (values: FormValues) => settingsApi.updateSettings(values),
    onSuccess: (data) => {
      updateStoreSettings(data);
      queryClient.setQueryData(["settings"], data);
      addToast("Settings saved", "success");
    },
    onError: (error: Error) => {
      addToast(`Failed to save settings: ${error.message}`, "error");
    },
  });

  const handleSave = () => {
    if (!validate()) return;
    mutation.mutate(formValues);
  };

  const handleReset = () => {
    resetStoreSettings();
    setFormValues({
      modelName: DEFAULT_SETTINGS.modelName,
      topK: DEFAULT_SETTINGS.topK,
      temperature: DEFAULT_SETTINGS.temperature,
      maxTokens: DEFAULT_SETTINGS.maxTokens,
      showSourcesPanel: DEFAULT_SETTINGS.showSourcesPanel,
      enableStreaming: DEFAULT_SETTINGS.enableStreaming,
    });
    setErrors({});
    // Also invalidate to refetch from server default
    queryClient.invalidateQueries({ queryKey: ["settings"] });
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Model Section */}
      <section>
        <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-4">
          Model
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="modelName"
              className="text-sm font-medium text-foreground"
            >
              Model name
            </label>
            <input
              id="modelName"
              type="text"
              value={formValues.modelName}
              onChange={(e) => updateField("modelName", e.target.value)}
              placeholder="e.g. gpt-4o-mini"
              className={[
                "w-full h-10 px-3 rounded-md border bg-background text-sm text-foreground",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                errors.modelName ? "border-red-500" : "border-input",
              ].join(" ")}
            />
            {errors.modelName && (
              <p className="text-xs text-red-500">{errors.modelName}</p>
            )}
          </div>
        </div>
      </section>

      {/* Retrieval Section */}
      <section>
        <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-4">
          Retrieval
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="topK"
              className="text-sm font-medium text-foreground"
            >
              Top K retrieval
            </label>
            <input
              id="topK"
              type="number"
              min={1}
              max={20}
              value={formValues.topK}
              onChange={(e) =>
                updateField("topK", parseInt(e.target.value, 10) || 0)
              }
              className={[
                "w-full h-10 px-3 rounded-md border bg-background text-sm text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                errors.topK ? "border-red-500" : "border-input",
              ].join(" ")}
            />
            {errors.topK && (
              <p className="text-xs text-red-500">{errors.topK}</p>
            )}
          </div>
        </div>
      </section>

      {/* Response Section */}
      <section>
        <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-4">
          Response
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <RangeSlider
              label="Temperature"
              min={0}
              max={2}
              step={0.1}
              value={formValues.temperature}
              onChange={(v) => updateField("temperature", v)}
              showValue
              formatValue={(v) => v.toFixed(1)}
            />
            {errors.temperature && (
              <p className="text-xs text-red-500">{errors.temperature}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="maxTokens"
              className="text-sm font-medium text-foreground"
            >
              Max tokens
            </label>
            <input
              id="maxTokens"
              type="number"
              min={1}
              value={formValues.maxTokens}
              onChange={(e) =>
                updateField("maxTokens", parseInt(e.target.value, 10) || 0)
              }
              className={[
                "w-full h-10 px-3 rounded-md border bg-background text-sm text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                errors.maxTokens ? "border-red-500" : "border-input",
              ].join(" ")}
            />
            {errors.maxTokens && (
              <p className="text-xs text-red-500">{errors.maxTokens}</p>
            )}
          </div>

          <div className="space-y-2">
            <Toggle
              label="Show sources panel"
              checked={formValues.showSourcesPanel}
              onChange={(v) => updateField("showSourcesPanel", v)}
            />
          </div>

          <div className="space-y-2">
            <Toggle
              label="Enable streaming response"
              checked={formValues.enableStreaming}
              onChange={(v) => updateField("enableStreaming", v)}
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          variant="primary"
          onClick={handleSave}
          loading={mutation.isPending}
        >
          Save
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}

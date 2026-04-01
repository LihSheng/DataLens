import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "../../../services/api/settings";
import { useSettingsStore } from "../store";
import { useUIStore } from "../../../store/uiStore";
import { Button } from "../../../components/ui/Button";
import { Toggle } from "../../../components/ui/Toggle";
import { RangeSlider } from "../../../components/ui/RangeSlider";
import { SettingsSection } from "../../../components/SettingsSection";
import { HelpTooltip } from "../../../components/ui/HelpTooltip";
import { SelectField } from "../../../components/ui/SelectField";
import { RetentionField } from "../../governance/components/RetentionField";
import type { ChunkingStrategy, RAGSettings } from "../../../types";

interface FormValues extends Omit<RAGSettings, "modelName"> {
  modelName: string;
  hybridWeightDense: number;
  rerankerEnabled: boolean;
  queryExpansionEnabled: boolean;
  hydeEnabled: boolean;
  chunkingStrategy: ChunkingStrategy;
  confidenceThreshold: number;
  memoryWindow: number;
  conversationRetentionDays: number;
}

const DEFAULT_SETTINGS: RAGSettings = {
  modelName: "gpt-4o-mini",
  topK: 5,
  temperature: 0.7,
  maxTokens: 2048,
  showSourcesPanel: true,
  enableStreaming: true,
  hybridWeightDense: 0.5,
  rerankerEnabled: false,
  queryExpansionEnabled: false,
  hydeEnabled: false,
  chunkingStrategy: "semantic",
  confidenceThreshold: 0.5,
  memoryWindow: 5,
  conversationRetentionDays: 30,
};

export function SettingsForm() {
  const queryClient = useQueryClient();
  const {
    settings: storeSettings,
    updateSettings: updateStoreSettings,
    resetSettings: resetStoreSettings,
  } = useSettingsStore();
  const { pushToast } = useUIStore();

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
    hybridWeightDense: storeSettings.hybridWeightDense,
    rerankerEnabled: storeSettings.rerankerEnabled,
    queryExpansionEnabled: storeSettings.queryExpansionEnabled,
    hydeEnabled: storeSettings.hydeEnabled,
    chunkingStrategy: storeSettings.chunkingStrategy,
    confidenceThreshold: storeSettings.confidenceThreshold,
    memoryWindow: storeSettings.memoryWindow,
    conversationRetentionDays: storeSettings.conversationRetentionDays,
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
        hybridWeightDense: serverSettings.hybridWeightDense,
        rerankerEnabled: serverSettings.rerankerEnabled,
        queryExpansionEnabled: serverSettings.queryExpansionEnabled,
        hydeEnabled: serverSettings.hydeEnabled,
        chunkingStrategy: serverSettings.chunkingStrategy,
        confidenceThreshold: serverSettings.confidenceThreshold,
        memoryWindow: serverSettings.memoryWindow,
        conversationRetentionDays: serverSettings.conversationRetentionDays,
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

    if (formValues.hybridWeightDense < 0 || formValues.hybridWeightDense > 1) {
      newErrors.hybridWeightDense =
        "Hybrid weight dense must be between 0 and 1";
    }

    if (
      formValues.confidenceThreshold < 0 ||
      formValues.confidenceThreshold > 1
    ) {
      newErrors.confidenceThreshold =
        "Confidence threshold must be between 0 and 1";
    }

    if (
      formValues.memoryWindow < 1 ||
      formValues.memoryWindow > 20 ||
      !Number.isInteger(formValues.memoryWindow)
    ) {
      newErrors.memoryWindow =
        "Memory window must be an integer between 1 and 20";
    }

    if (
      formValues.conversationRetentionDays < 1 ||
      formValues.conversationRetentionDays > 365 ||
      !Number.isInteger(formValues.conversationRetentionDays)
    ) {
      newErrors.conversationRetentionDays =
        "Conversation retention must be between 1 and 365 days";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (values: FormValues) => settingsApi.updateSettings(values),
    onSuccess: (data) => {
      updateStoreSettings(data);
      queryClient.setQueryData(["settings"], data);
      pushToast({ message: "Settings saved", type: "success" });
    },
    onError: (error: Error) => {
      pushToast({
        message: `Failed to save settings: ${error.message}`,
        type: "error",
      });
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
      hybridWeightDense: DEFAULT_SETTINGS.hybridWeightDense,
      rerankerEnabled: DEFAULT_SETTINGS.rerankerEnabled,
      queryExpansionEnabled: DEFAULT_SETTINGS.queryExpansionEnabled,
      hydeEnabled: DEFAULT_SETTINGS.hydeEnabled,
      chunkingStrategy: DEFAULT_SETTINGS.chunkingStrategy,
      confidenceThreshold: DEFAULT_SETTINGS.confidenceThreshold,
      memoryWindow: DEFAULT_SETTINGS.memoryWindow,
      conversationRetentionDays: DEFAULT_SETTINGS.conversationRetentionDays,
    });
    setErrors({});
    // Also invalidate to refetch from server default
    queryClient.invalidateQueries({ queryKey: ["settings"] });
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Model Section */}
      <SettingsSection title="Model">
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
      </SettingsSection>

      {/* Retrieval Settings Section */}
      <SettingsSection title="Retrieval Settings">
        <div className="space-y-4">
          <div className="space-y-2">
            <RangeSlider
              label="Hybrid weight (dense)"
              min={0}
              max={1}
              step={0.1}
              value={formValues.hybridWeightDense}
              onChange={(v) => updateField("hybridWeightDense", v)}
              showValue
              formatValue={(v) =>
                `Dense: ${v.toFixed(1)} / Sparse: ${(1 - v).toFixed(1)}`
              }
            />
            {errors.hybridWeightDense && (
              <p className="text-xs text-red-500">{errors.hybridWeightDense}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Toggle
                label="Reranker enabled"
                checked={formValues.rerankerEnabled}
                onChange={(v) => updateField("rerankerEnabled", v)}
              />
              <HelpTooltip content="Reranks retrieved chunks by relevance after initial retrieval. Adds ~50–100ms latency." />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Toggle
                label="Query expansion enabled"
                checked={formValues.queryExpansionEnabled}
                onChange={(v) => updateField("queryExpansionEnabled", v)}
              />
              <HelpTooltip content="Runs the query through multiple reformulations and merges results. Higher recall, higher latency." />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Toggle
                label="HyDE enabled"
                checked={formValues.hydeEnabled}
                onChange={(v) => updateField("hydeEnabled", v)}
              />
              <HelpTooltip content="Generates hypothetical document passages before retrieval. Best for complex queries." />
            </div>
          </div>

          <SelectField
            label="Chunking strategy"
            value={formValues.chunkingStrategy}
            onChange={(v) =>
              updateField("chunkingStrategy", v as ChunkingStrategy)
            }
            options={[
              { value: "semantic", label: "Semantic" },
              { value: "recursive", label: "Recursive" },
              { value: "fixed", label: "Fixed" },
            ]}
          />

          <div className="space-y-2">
            <RangeSlider
              label="Confidence threshold"
              min={0}
              max={1}
              step={0.05}
              value={formValues.confidenceThreshold}
              onChange={(v) => updateField("confidenceThreshold", v)}
              showValue
              formatValue={(v) => `${Math.round(v * 100)}%`}
            />
            {errors.confidenceThreshold && (
              <p className="text-xs text-red-500">
                {errors.confidenceThreshold}
              </p>
            )}
          </div>
        </div>
      </SettingsSection>

      {/* Retrieval Section (Top K only) */}
      <SettingsSection title="Retrieval">
        <div className="space-y-2">
          <label htmlFor="topK" className="text-sm font-medium text-foreground">
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
          {errors.topK && <p className="text-xs text-red-500">{errors.topK}</p>}
        </div>
      </SettingsSection>

      {/* Response Section */}
      <SettingsSection title="Response">
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
      </SettingsSection>

      {/* Memory & Retention Section */}
      <SettingsSection title="Memory &amp; Retention">
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="memoryWindow"
              className="text-sm font-medium text-foreground"
            >
              Memory window (messages)
            </label>
            <input
              id="memoryWindow"
              type="number"
              min={1}
              max={20}
              value={formValues.memoryWindow}
              onChange={(e) =>
                updateField("memoryWindow", parseInt(e.target.value, 10) || 1)
              }
              className={[
                "w-24 h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              ].join(" ")}
            />
            {errors.memoryWindow && (
              <p className="text-xs text-red-500">{errors.memoryWindow}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Number of previous messages to include as conversation context.
            </p>
          </div>

          <RetentionField
            value={formValues.conversationRetentionDays}
            onChange={(v) => updateField("conversationRetentionDays", v)}
            error={errors.conversationRetentionDays}
          />
        </div>
      </SettingsSection>

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

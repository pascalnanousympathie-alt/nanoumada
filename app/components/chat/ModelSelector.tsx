import type { ProviderInfo } from '~/types/model';
import type { ModelInfo } from '~/utils/types';
import { useEffect, useMemo } from 'react';

interface ModelSelectorProps {
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  modelList: ModelInfo[];
  providerList: ProviderInfo[];
  apiKeys: Record<string, string>;
}

export const ModelSelector = ({
  model,
  setModel,
  provider,
  setProvider,
  modelList,
  providerList,
}: ModelSelectorProps) => {
  // providerList is already filtered by useSettings to include enabled providers only.
  // Keep it as the single source of truth rather than polling cookies once per second.
  const enabledProviders = providerList;
  const providerModels = useMemo(
    () => modelList.filter((item) => item.provider === provider?.name && Boolean(item.name)),
    [modelList, provider?.name],
  );

  useEffect(() => {
    if (enabledProviders.length === 0) {
      return;
    }

    const selectedProvider = enabledProviders.find((item) => item.name === provider?.name);

    if (!selectedProvider) {
      const fallbackProvider = enabledProviders[0];
      setProvider?.(fallbackProvider);

      const fallbackModel = modelList.find((item) => item.provider === fallbackProvider.name && item.name);

      if (fallbackModel && fallbackModel.name !== model) {
        setModel?.(fallbackModel.name);
      }

      return;
    }

    // Avoid carrying a model from the previous provider after settings or a
    // dynamic provider catalogue changes.
    if (providerModels.length > 0 && !providerModels.some((item) => item.name === model)) {
      setModel?.(providerModels[0].name);
    }
  }, [enabledProviders, modelList, model, provider?.name, providerModels, setModel, setProvider]);

  if (enabledProviders.length === 0) {
    return (
      <div className="mb-2 p-4 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary">
        <p className="text-center">
          No providers are currently enabled. Please enable at least one provider in the settings to start using the
          chat.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-2 flex flex-col gap-2 sm:flex-row">
      <select
        aria-label="AI provider"
        value={enabledProviders.some((item) => item.name === provider?.name) ? provider?.name : enabledProviders[0].name}
        onChange={(event) => {
          const nextProvider = enabledProviders.find((item) => item.name === event.target.value);

          if (!nextProvider) {
            return;
          }

          setProvider?.(nextProvider);

          const firstModel = modelList.find((item) => item.provider === nextProvider.name && item.name);

          if (firstModel) {
            setModel?.(firstModel.name);
          }
        }}
        className="min-w-0 flex-1 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background p-2 text-bolt-elements-textPrimary transition-all focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
      >
        {enabledProviders.map((item) => (
          <option key={item.name} value={item.name}>
            {item.name}
          </option>
        ))}
      </select>
      <select
        aria-label="AI model"
        key={provider?.name}
        value={providerModels.some((item) => item.name === model) ? model : providerModels[0]?.name ?? ''}
        onChange={(event) => setModel?.(event.target.value)}
        disabled={providerModels.length === 0}
        className="min-w-0 flex-1 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background p-2 text-bolt-elements-textPrimary transition-all focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus lg:max-w-[70%]"
      >
        {providerModels.map((modelOption) => (
          <option key={modelOption.name} value={modelOption.name}>
            {modelOption.label}
          </option>
        ))}
      </select>
    </div>
  );
};

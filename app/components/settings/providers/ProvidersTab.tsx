import React, { useEffect, useState } from 'react';
import { Switch } from '~/components/ui/Switch';
import { useSettings } from '~/lib/hooks/useSettings';
import { LOCAL_PROVIDERS, URL_CONFIGURABLE_PROVIDERS } from '~/lib/stores/settings';
import type { IProviderConfig } from '~/types/model';

export default function ProvidersTab() {
  const { providers, updateProviderSettings, isLocalModel } = useSettings();
  const [filteredProviders, setFilteredProviders] = useState<IProviderConfig[]>([]);

  // Load base URLs from cookies
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let newFilteredProviders: IProviderConfig[] = Object.entries(providers).map(([key, value]) => ({
      ...value,
      name: key,
    }));

    if (searchTerm && searchTerm.length > 0) {
      newFilteredProviders = newFilteredProviders.filter((provider) =>
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (!isLocalModel) {
      newFilteredProviders = newFilteredProviders.filter((provider) => !LOCAL_PROVIDERS.includes(provider.name));
    }

    newFilteredProviders.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredProviders(newFilteredProviders);
  }, [providers, searchTerm, isLocalModel]);

  return (
    <div className="p-4">
      <section className="mb-5 rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text">
            <span className="i-ph:sparkle text-xl" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-bolt-elements-textPrimary">Free & quota-aware AI providers</h2>
            <p className="mt-1 text-sm text-bolt-elements-textSecondary">
              Enable more than one provider so you can switch when one reaches its limit. Keys are added in the chat's
              API Key control after you choose a provider.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-bolt-elements-borderColor p-2.5 text-sm text-bolt-elements-textPrimary transition-colors hover:bg-bolt-elements-background-depth-2"
          >
            <span className="i-ph:google-logo text-lg" />
            <span className="flex-1">Google Gemini API key</span>
            <span className="i-ph:arrow-square-out text-bolt-elements-textTertiary" />
          </a>
          <a
            href="https://openrouter.ai/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-bolt-elements-borderColor p-2.5 text-sm text-bolt-elements-textPrimary transition-colors hover:bg-bolt-elements-background-depth-2"
          >
            <span className="i-ph:git-branch text-lg" />
            <span className="flex-1">OpenRouter Free key</span>
            <span className="i-ph:arrow-square-out text-bolt-elements-textTertiary" />
          </a>
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-bolt-elements-borderColor p-2.5 text-sm text-bolt-elements-textPrimary transition-colors hover:bg-bolt-elements-background-depth-2"
          >
            <span className="i-ph:lightning text-lg" />
            <span className="flex-1">Groq API key</span>
            <span className="i-ph:arrow-square-out text-bolt-elements-textTertiary" />
          </a>
          <a
            href="https://cloud.cerebras.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-bolt-elements-borderColor p-2.5 text-sm text-bolt-elements-textPrimary transition-colors hover:bg-bolt-elements-background-depth-2"
          >
            <span className="i-ph:cpu text-lg" />
            <span className="flex-1">Cerebras API key</span>
            <span className="i-ph:arrow-square-out text-bolt-elements-textTertiary" />
          </a>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-bolt-elements-textTertiary">
          Free tiers have model-specific quotas and can change. Google documents that free-tier content may be used to
          improve its products; avoid sending secrets or private code unless the provider's data terms suit your use.
        </p>
      </section>
      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Search providers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-bolt-elements-background-depth-4 relative px-2 py-1.5 rounded-md focus:outline-none placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary border border-bolt-elements-borderColor"
        />
      </div>
      {filteredProviders.map((provider) => (
        <div
          key={provider.name}
          className="flex flex-col mb-2 provider-item hover:bg-bolt-elements-bg-depth-3 p-4 rounded-lg border border-bolt-elements-borderColor "
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col gap-1 min-w-0 pr-3">
              <span className="text-bolt-elements-textPrimary">{provider.name}</span>
              {provider.freeTierNote && (
                <span className="text-xs text-bolt-elements-textSecondary">
                  {provider.freeTierNote}{' '}
                  {provider.freeTierUrl && (
                    <a href={provider.freeTierUrl} target="_blank" rel="noopener noreferrer" className="underline">
                      Limits/pricing
                    </a>
                  )}
                </span>
              )}
            </div>
            <Switch
              className="ml-auto"
              checked={provider.settings.enabled}
              onCheckedChange={(enabled) => updateProviderSettings(provider.name, { ...provider.settings, enabled })}
            />
          </div>
          {/* Base URL input for configurable providers */}
          {URL_CONFIGURABLE_PROVIDERS.includes(provider.name) && provider.settings.enabled && (
            <div className="mt-2">
              <label className="block text-sm text-bolt-elements-textSecondary mb-1">Base URL:</label>
              <input
                type="text"
                value={provider.settings.baseUrl || ''}
                onChange={(e) =>
                  updateProviderSettings(provider.name, { ...provider.settings, baseUrl: e.target.value })
                }
                placeholder={`Enter ${provider.name} base URL`}
                className="w-full bg-white dark:bg-bolt-elements-background-depth-4 relative px-2 py-1.5 rounded-md focus:outline-none placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary border border-bolt-elements-borderColor"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

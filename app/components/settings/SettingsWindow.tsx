import * as RadixDialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { useState, type ReactElement } from 'react';
import { classNames } from '~/utils/classNames';
import { DialogTitle, dialogVariants, dialogBackdropVariants } from '~/components/ui/Dialog';
import styles from './Settings.module.scss';
import ChatHistoryTab from './chat-history/ChatHistoryTab';
import ProvidersTab from './providers/ProvidersTab';
import { useSettings } from '~/lib/hooks/useSettings';
import FeaturesTab from './features/FeaturesTab';
import DebugTab from './debug/DebugTab';
import ConnectionsTab from './connections/ConnectionsTab';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

type TabType = 'chat-history' | 'providers' | 'features' | 'debug' | 'connection';

export const SettingsWindow = ({ open, onClose }: SettingsProps) => {
  const { debug } = useSettings();
  const [activeTab, setActiveTab] = useState<TabType>('chat-history');

  const tabs: { id: TabType; label: string; icon: string; component?: ReactElement }[] = [
    { id: 'chat-history', label: 'Chat History', icon: 'i-ph:book', component: <ChatHistoryTab /> },
    { id: 'providers', label: 'Providers', icon: 'i-ph:key', component: <ProvidersTab /> },
    { id: 'features', label: 'Features', icon: 'i-ph:star', component: <FeaturesTab /> },
    { id: 'connection', label: 'Connection', icon: 'i-ph:link', component: <ConnectionsTab /> },
    ...(debug
      ? [
          {
            id: 'debug' as TabType,
            label: 'Debug Tab',
            icon: 'i-ph:bug',
            component: <DebugTab />,
          },
        ]
      : []),
  ];

  return (
    <RadixDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay asChild onClick={onClose}>
          <motion.div
            className="fixed inset-0 z-max bg-black/50 backdrop-blur-sm"
            initial="closed"
            animate="open"
            exit="closed"
            variants={dialogBackdropVariants}
          />
        </RadixDialog.Overlay>
        <RadixDialog.Content asChild>
          <motion.div
            className="fixed left-[50%] top-[50%] z-max h-[85vh] w-[96vw] max-w-[900px] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-lg border border-bolt-elements-borderColor shadow-lg focus:outline-none"
            initial="closed"
            animate="open"
            exit="closed"
            variants={dialogVariants}
          >
            <div className="flex h-full min-h-0 flex-col sm:flex-row">
              <div
                className={classNames(
                  'flex w-full flex-shrink-0 flex-col gap-2 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-2 sm:w-48 sm:justify-between sm:border-b-0 sm:border-r sm:p-4',
                  styles['settings-tabs'],
                )}
              >
                <DialogTitle className="mb-1 flex-shrink-0 text-base font-semibold text-bolt-elements-textPrimary sm:text-lg">
                  Settings
                </DialogTitle>
                <div className="grid grid-cols-2 gap-1 sm:block">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      aria-pressed={activeTab === tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={classNames(activeTab === tab.id ? styles.active : '')}
                    >
                      <span className={tab.icon} aria-hidden="true" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-row flex-wrap gap-2 sm:mt-auto sm:flex-col">
                  <a
                    href="https://github.com/stackblitz-labs/bolt.diy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classNames(styles['settings-button'], 'flex items-center gap-2')}
                  >
                    <span className="i-ph:github-logo" aria-hidden="true" />
                    GitHub
                  </a>
                  <a
                    href="https://stackblitz-labs.github.io/bolt.diy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classNames(styles['settings-button'], 'flex items-center gap-2')}
                  >
                    <span className="i-ph:book" aria-hidden="true" />
                    Docs
                  </a>
                </div>
              </div>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-bolt-elements-background-depth-2 p-3 pt-10 sm:p-8 sm:pt-10">
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {tabs.find((tab) => tab.id === activeTab)?.component}
                </div>
              </div>
            </div>
            <RadixDialog.Close asChild>
              <button
                type="button"
                aria-label="Close settings"
                title="Close settings"
                onClick={onClose}
                className="absolute right-2 top-2 z-10 rounded-md bg-bolt-elements-background-depth-2 p-2 text-bolt-elements-textPrimary shadow-sm hover:bg-bolt-elements-item-backgroundActive focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
              >
                <span className="i-ph:x text-lg" aria-hidden="true" />
              </button>
            </RadixDialog.Close>
          </motion.div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};

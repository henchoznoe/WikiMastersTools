export interface Settings {
  showCollectionPrices: boolean;
  showMarketplacePrices: boolean;
  recapNormalPacks: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  showCollectionPrices: true,
  showMarketplacePrices: true,
  recapNormalPacks: true,
};

const KEY = 'settings-v1';

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get(KEY);
  const value = stored[KEY];
  return value && typeof value === 'object'
    ? { ...DEFAULT_SETTINGS, ...value }
    : DEFAULT_SETTINGS;
}

export async function saveSettings(value: Settings): Promise<void> {
  await browser.storage.local.set({ [KEY]: value });
}

import { browser } from 'wxt/browser';

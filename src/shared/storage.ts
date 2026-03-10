import { SyncStorageData } from "../types/storage";
import { STORAGE_KEY } from "./constants";

const DEFAULT: SyncStorageData = {
  standaloneJobs: [],
  groups: [],
};

export async function getWatchlist(): Promise<SyncStorageData> {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  return result[STORAGE_KEY] ?? DEFAULT;
}

export async function setWatchlist(data: SyncStorageData): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: data });
}

export async function getTestMode(): Promise<boolean> {
  const result = await chrome.storage.sync.get("testMode");
  return result.testMode ?? false;
}

export async function setTestMode(enabled: boolean): Promise<void> {
  await chrome.storage.sync.set({ testMode: enabled });
}

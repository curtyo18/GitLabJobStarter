import { SyncStorageData, JobPattern } from "../types/storage";
import { STORAGE_KEY } from "./constants";

const DEFAULT: SyncStorageData = {
  standaloneJobs: [],
  groups: [],
};

function migrateJob(job: unknown): JobPattern {
  if (typeof job === "string") return { pattern: job, matchType: "contains" };
  return job as JobPattern;
}

function migrate(raw: unknown): SyncStorageData {
  const data = raw as Record<string, unknown>;
  return {
    standaloneJobs: ((data.standaloneJobs ?? []) as unknown[]).map(migrateJob),
    groups: ((data.groups ?? []) as Record<string, unknown>[]).map((g) => ({
      ...g,
      jobs: ((g.jobs ?? []) as unknown[]).map(migrateJob),
    })),
  } as SyncStorageData;
}

export async function getWatchlist(): Promise<SyncStorageData> {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  return result[STORAGE_KEY] ? migrate(result[STORAGE_KEY]) : DEFAULT;
}

export async function setWatchlist(data: SyncStorageData): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: data });
}

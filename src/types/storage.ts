export type MatchType = "contains" | "starts" | "ends" | "exact";

export interface JobPattern {
  pattern: string;
  matchType: MatchType;
}

export interface WatchGroup {
  id: string;
  name: string;
  jobs: JobPattern[];
}

export interface SyncStorageData {
  standaloneJobs: JobPattern[];
  groups: WatchGroup[];
}

export interface WatchGroup {
  id: string;
  name: string;
  jobs: string[];
}

export interface SyncStorageData {
  standaloneJobs: string[];
  groups: WatchGroup[];
}

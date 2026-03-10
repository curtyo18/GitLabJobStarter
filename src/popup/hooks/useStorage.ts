import { useState, useEffect, useCallback } from "preact/hooks";
import { SyncStorageData } from "../../types/storage";
import { getWatchlist, setWatchlist } from "../../shared/storage";

export function useStorage() {
  const [data, setData] = useState<SyncStorageData>({
    standaloneJobs: [],
    groups: [],
  });

  useEffect(() => {
    getWatchlist().then(setData);

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area === "sync" && changes["watchlist"]) {
        setData(changes["watchlist"].newValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const save = useCallback((next: SyncStorageData) => {
    setData(next);
    setWatchlist(next);
  }, []);

  return { data, save };
}

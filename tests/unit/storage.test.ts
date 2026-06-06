import { describe, it, expect, vi, beforeEach } from "vitest";
import { getWatchlist, setWatchlist } from "@/shared/storage";
import { STORAGE_KEY } from "@/shared/constants";
import type { SyncStorageData } from "@/types/storage";

let store: Record<string, unknown>;

beforeEach(() => {
  store = {};
  vi.stubGlobal("chrome", {
    storage: {
      sync: {
        get: vi.fn(async (key: string) => ({ [key]: store[key] })),
        set: vi.fn(async (obj: Record<string, unknown>) => {
          Object.assign(store, obj);
        }),
      },
    },
  });
});

describe("getWatchlist", () => {
  it("returns the empty default when nothing is stored", async () => {
    expect(await getWatchlist()).toEqual({ standaloneJobs: [], groups: [] });
  });

  it("migrates legacy string jobs to { pattern, matchType: 'contains' }", async () => {
    store[STORAGE_KEY] = {
      standaloneJobs: ["deploy", "test"],
      groups: [{ id: "g1", name: "Group", jobs: ["build"] }],
    };

    const result = await getWatchlist();
    expect(result.standaloneJobs).toEqual([
      { pattern: "deploy", matchType: "contains" },
      { pattern: "test", matchType: "contains" },
    ]);
    expect(result.groups[0].jobs).toEqual([{ pattern: "build", matchType: "contains" }]);
  });

  it("preserves already-migrated JobPattern objects", async () => {
    store[STORAGE_KEY] = {
      standaloneJobs: [{ pattern: "deploy", matchType: "exact" }],
      groups: [],
    };
    const result = await getWatchlist();
    expect(result.standaloneJobs).toEqual([{ pattern: "deploy", matchType: "exact" }]);
  });
});

describe("setWatchlist", () => {
  it("writes under the watchlist storage key", async () => {
    const data: SyncStorageData = {
      standaloneJobs: [{ pattern: "x", matchType: "contains" }],
      groups: [],
    };
    await setWatchlist(data);
    expect(store[STORAGE_KEY]).toEqual(data);
  });
});

import { GitLabJob } from "../types/gitlab";
import { getWatchlist } from "./storage";

// Stable fake IDs per job name so startedJobIds works correctly across polls
const mockIdMap = new Map<string, number>();
let nextMockId = 9_000_000;

function stableId(name: string): number {
  if (!mockIdMap.has(name)) mockIdMap.set(name, nextMockId++);
  return mockIdMap.get(name)!;
}

export async function getMockManualJobs(): Promise<GitLabJob[]> {
  const watchlist = await getWatchlist();
  const allPatterns = [
    ...watchlist.standaloneJobs,
    ...watchlist.groups.flatMap((g) => g.jobs),
  ];
  // Deduplicate and return each pattern as a fake manual job
  return [...new Set(allPatterns)].map((name) => ({
    id: stableId(name),
    name,
    status: "manual",
  }));
}

export async function mockPlayJob(jobName: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  console.log(`[GJS TEST MODE] Simulated start: ${jobName}`);
  return jobName;
}

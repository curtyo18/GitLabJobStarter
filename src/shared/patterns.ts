import { GitLabJob } from "../types/gitlab";

export function matchJobs(jobs: GitLabJob[], patterns: string[]): GitLabJob[] {
  if (patterns.length === 0) return [];
  return jobs.filter((job) =>
    patterns.some((pattern) => job.name.includes(pattern))
  );
}

import { GitLabJob } from "../types/gitlab";
import { JobPattern } from "../types/storage";

function matchesPattern(jobName: string, { pattern, matchType }: JobPattern): boolean {
  switch (matchType) {
    case "contains": return jobName.includes(pattern);
    case "starts":   return jobName.startsWith(pattern);
    case "ends":     return jobName.endsWith(pattern);
    case "exact":    return jobName === pattern;
  }
}

export function matchJobs(jobs: GitLabJob[], patterns: JobPattern[]): GitLabJob[] {
  if (patterns.length === 0) return [];
  return jobs.filter((job) => patterns.some((p) => matchesPattern(job.name, p)));
}

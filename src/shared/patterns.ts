import { GitLabJob } from "../types/gitlab";

function patternToRegex(pattern: string): RegExp {
  // Escape all regex special chars except *, then replace * with .*
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  return new RegExp("^" + escaped.replace(/\*/g, ".*") + "$");
}

function matchesPattern(jobName: string, pattern: string): boolean {
  if (pattern.includes("*")) {
    return patternToRegex(pattern).test(jobName);
  }
  return jobName.includes(pattern);
}

export function matchJobs(jobs: GitLabJob[], patterns: string[]): GitLabJob[] {
  if (patterns.length === 0) return [];
  return jobs.filter((job) =>
    patterns.some((pattern) => matchesPattern(job.name, pattern))
  );
}

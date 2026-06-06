import { describe, it, expect } from "vitest";
import { matchJobs } from "@/shared/patterns";
import type { GitLabJob } from "@/types/gitlab";
import type { JobPattern } from "@/types/storage";

function job(name: string, id = 1): GitLabJob {
  return { id, name, status: "manual" };
}

describe("matchJobs", () => {
  const jobs = [
    job("deploy:prod", 1),
    job("deploy:staging", 2),
    job("run-tests", 3),
    job("build", 4),
  ];

  it("returns nothing when there are no patterns", () => {
    expect(matchJobs(jobs, [])).toEqual([]);
  });

  it("matches by substring (contains)", () => {
    const patterns: JobPattern[] = [{ pattern: "deploy", matchType: "contains" }];
    expect(matchJobs(jobs, patterns).map((j) => j.id)).toEqual([1, 2]);
  });

  it("matches by prefix (starts)", () => {
    const patterns: JobPattern[] = [{ pattern: "run", matchType: "starts" }];
    expect(matchJobs(jobs, patterns).map((j) => j.id)).toEqual([3]);
  });

  it("matches by suffix (ends)", () => {
    const patterns: JobPattern[] = [{ pattern: "prod", matchType: "ends" }];
    expect(matchJobs(jobs, patterns).map((j) => j.id)).toEqual([1]);
  });

  it("matches by exact name", () => {
    const patterns: JobPattern[] = [{ pattern: "build", matchType: "exact" }];
    expect(matchJobs(jobs, patterns).map((j) => j.id)).toEqual([4]);
  });

  it("does not match a partial name with the exact matcher", () => {
    const patterns: JobPattern[] = [{ pattern: "buil", matchType: "exact" }];
    expect(matchJobs(jobs, patterns)).toEqual([]);
  });

  it("unions results across multiple patterns without duplicating a job", () => {
    const patterns: JobPattern[] = [
      { pattern: "deploy", matchType: "contains" },
      { pattern: "deploy:prod", matchType: "exact" },
    ];
    expect(matchJobs(jobs, patterns).map((j) => j.id)).toEqual([1, 2]);
  });
});

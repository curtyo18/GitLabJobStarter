import { GitLabBridge, GitLabJob } from "../types/gitlab";

async function fetchPaginated<T>(url: string): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const response = await fetch(nextUrl, { credentials: "include" });
    if (!response.ok) {
      console.error(`[GJS] API error ${response.status} for ${nextUrl}`);
      return results;
    }
    const data: T[] = await response.json();
    results.push(...data);
    nextUrl = parseNextLink(response.headers.get("link"));
  }

  return results;
}

function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(",").map((s) => s.trim())) {
    const [urlPart, relPart] = part.split(";");
    if (relPart?.includes('rel="next"')) {
      return urlPart.trim().slice(1, -1);
    }
  }
  return null;
}

async function getPipelineJobs(
  origin: string,
  repoPath: string,
  pipelineId: string
): Promise<GitLabJob[]> {
  const url = `${origin}/api/v4/projects/${encodeURIComponent(repoPath)}/pipelines/${pipelineId}/jobs?per_page=100`;
  return fetchPaginated<GitLabJob>(url);
}

async function getDownstreamJobs(
  origin: string,
  repoPath: string,
  pipelineId: string
): Promise<GitLabJob[]> {
  const url = `${origin}/api/v4/projects/${encodeURIComponent(repoPath)}/pipelines/${pipelineId}/bridges?per_page=100`;
  const bridges = await fetchPaginated<GitLabBridge>(url);
  const started = bridges.filter((b) => b.downstream_pipeline?.id);
  const results = await Promise.all(
    started.map((b) => getPipelineJobs(origin, repoPath, String(b.downstream_pipeline!.id)))
  );
  return results.flat();
}

export async function getAllManualJobs(
  origin: string,
  repoPath: string,
  pipelineId: string
): Promise<GitLabJob[]> {
  const [pipeline, downstream] = await Promise.all([
    getPipelineJobs(origin, repoPath, pipelineId),
    getDownstreamJobs(origin, repoPath, pipelineId),
  ]);
  return [...pipeline, ...downstream].filter((job) => job.status === "manual");
}

export async function playJob(
  origin: string,
  repoPath: string,
  jobId: number,
  csrfToken: string
): Promise<string> {
  const url = `${origin}/${repoPath}/-/jobs/${jobId}/play.json`;
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "x-csrf-token": csrfToken,
      accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to play job ${jobId}: ${response.status}`);
  }
  const data = await response.json();
  return data.name as string;
}

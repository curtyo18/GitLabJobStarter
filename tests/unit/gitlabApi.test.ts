import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAllManualJobs, playJob } from "@/shared/gitlabApi";

const ORIGIN = "https://gitlab.example.com";
const REPO = "my-group/sub-group/my-repo";
const PIPELINE = "4242";

type FetchArgs = { url: string; init?: RequestInit };

interface ResponseInitLite {
  ok?: boolean;
  status?: number;
  headers?: Record<string, string>;
}

function jsonResponse(body: unknown, init: ResponseInitLite = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    headers: new Headers(init.headers ?? {}),
    json: async () => body,
  } as unknown as Response;
}

let calls: FetchArgs[];

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getAllManualJobs", () => {
  it("builds the API v4 jobs + bridges URLs with the repo path URL-encoded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init });
        return jsonResponse([]);
      })
    );

    await getAllManualJobs(ORIGIN, REPO, PIPELINE);

    const encoded = encodeURIComponent(REPO);
    expect(calls.map((c) => c.url)).toEqual([
      `${ORIGIN}/api/v4/projects/${encoded}/pipelines/${PIPELINE}/jobs?per_page=100`,
      `${ORIGIN}/api/v4/projects/${encoded}/pipelines/${PIPELINE}/bridges?per_page=100`,
    ]);
    // repoPath slashes must be percent-encoded for the projects endpoint
    expect(calls[0].url).toContain("my-group%2Fsub-group%2Fmy-repo");
    // all requests must carry the session cookie
    expect(calls.every((c) => c.init?.credentials === "include")).toBe(true);
  });

  it("keeps only jobs whose status is manual", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/jobs?")) {
          return jsonResponse([
            { id: 1, name: "deploy", status: "manual" },
            { id: 2, name: "test", status: "success" },
          ]);
        }
        return jsonResponse([]); // no bridges
      })
    );

    const jobs = await getAllManualJobs(ORIGIN, REPO, PIPELINE);
    expect(jobs).toEqual([{ id: 1, name: "deploy", status: "manual" }]);
  });

  it("follows the Link rel=next header to paginate", async () => {
    const encoded = encodeURIComponent(REPO);
    const page1 = `${ORIGIN}/api/v4/projects/${encoded}/pipelines/${PIPELINE}/jobs?per_page=100`;
    const page2 = `${ORIGIN}/api/v4/projects/${encoded}/pipelines/${PIPELINE}/jobs?per_page=100&page=2`;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push({ url });
        if (url === page1) {
          return jsonResponse([{ id: 1, name: "a", status: "manual" }], {
            headers: { link: `<${page2}>; rel="next"` },
          });
        }
        return jsonResponse([{ id: 2, name: "b", status: "manual" }]);
      })
    );

    const jobs = await getAllManualJobs(ORIGIN, REPO, PIPELINE);
    expect(calls.some((c) => c.url === page2)).toBe(true);
    expect(jobs.map((j) => j.id).sort()).toEqual([1, 2]);
  });
});

describe("playJob", () => {
  it("POSTs to the /-/jobs/:id/play.json endpoint with the CSRF token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init });
        return jsonResponse({ name: "deploy:prod" });
      })
    );

    const name = await playJob(ORIGIN, REPO, 99, "csrf-xyz");

    expect(name).toBe("deploy:prod");
    expect(calls[0].url).toBe(`${ORIGIN}/${REPO}/-/jobs/99/play.json`);
    expect(calls[0].init?.method).toBe("POST");
    expect(calls[0].init?.credentials).toBe("include");
    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers["x-csrf-token"]).toBe("csrf-xyz");
  });

  it("throws when the play request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({}, { ok: false, status: 403 }))
    );
    await expect(playJob(ORIGIN, REPO, 7, "t")).rejects.toThrow(/Failed to play job 7: 403/);
  });
});

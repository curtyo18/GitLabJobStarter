import { getWatchlist } from "../shared/storage";
import { getAllManualJobs, playJob } from "../shared/gitlabApi";
import { matchJobs } from "../shared/patterns";
import { SCAN_INTERVAL_MS } from "../shared/constants";
import { readCsrfToken } from "./csrfToken";
import { createWidget, WidgetController } from "./widget";
import { JobPattern } from "../types/storage";

interface PipelineInfo {
  origin: string;
  repoPath: string;
  pipelineId: string;
}

function parsePipelineInfo(): PipelineInfo | null {
  const { origin, pathname } = window.location;
  const match = pathname.match(/^(\/.*?)\/-\/pipelines\/(\d+)/);
  if (!match) return null;
  return {
    origin,
    repoPath: match[1].slice(1), // strip leading slash
    pipelineId: match[2],
  };
}

// Track jobs that have already been started this session to avoid re-triggering
const startedJobIds = new Set<number>();

let pollIntervalId: ReturnType<typeof setInterval> | null = null;
let widget: WidgetController | null = null;
let currentPipelineInfo: PipelineInfo | null = null;

async function poll(info: PipelineInfo, selectedPatterns: JobPattern[]) {
  try {
    const manualJobs = await getAllManualJobs(info.origin, info.repoPath, info.pipelineId);

    const toStart = matchJobs(manualJobs, selectedPatterns).filter(
      (job) => !startedJobIds.has(job.id)
    );

    for (const job of toStart) {
      try {
        const csrf = readCsrfToken();
        if (!csrf) {
          widget?.addLog("Could not read CSRF token — is this a GitLab page?", "error");
          return;
        }
        const name = await playJob(info.origin, info.repoPath, job.id, csrf);
        startedJobIds.add(job.id);
        widget?.addLog(`Started: ${name}`, "started");
      } catch (err) {
        widget?.addLog(`Failed to start ${job.name}`, "error");
        console.error(`[GJS] Failed to start job ${job.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[GJS] Poll error:", err);
  }
}

function startMonitoring(info: PipelineInfo, selectedPatterns: JobPattern[]) {
  stopMonitoring();
  if (selectedPatterns.length === 0) {
    widget?.addLog("Select at least one job pattern first.", "error");
    return;
  }
  startedJobIds.clear();
  pollIntervalId = setInterval(() => poll(info, selectedPatterns), SCAN_INTERVAL_MS);
  // Run immediately on start
  poll(info, selectedPatterns);
  widget?.setMonitoring(true);
  widget?.addLog(
    `Monitoring started (${selectedPatterns.length} pattern${selectedPatterns.length !== 1 ? "s" : ""})`,
    "info"
  );
}

function stopMonitoring() {
  if (pollIntervalId !== null) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  widget?.setMonitoring(false);
}

async function init() {
  const info = parsePipelineInfo();
  if (!info) return;

  currentPipelineInfo = info;
  startedJobIds.clear();

  const watchlist = await getWatchlist();
  widget = createWidget(info.pipelineId, watchlist, (selectedPatterns, start) => {
    if (start) {
      startMonitoring(info, selectedPatterns);
    } else {
      stopMonitoring();
      widget?.addLog("Monitoring stopped", "info");
    }
  });

  // Keep watchlist in sync if user edits it in the popup
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (changes["watchlist"]) {
      widget?.updateWatchlist(changes["watchlist"].newValue);
    }
  });

  // SPA navigation detection — GitLab is a Vue SPA
  let lastPathname = location.pathname;
  setInterval(() => {
    if (location.pathname === lastPathname) return;
    lastPathname = location.pathname;

    const newInfo = parsePipelineInfo();
    if (!newInfo || newInfo.pipelineId === currentPipelineInfo?.pipelineId) return;

    // Navigated to a different pipeline — stop current monitoring
    stopMonitoring();
    currentPipelineInfo = newInfo;
    startedJobIds.clear();
    widget?.addLog(`Navigated to pipeline #${newInfo.pipelineId}`, "info");
  }, 1000);
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  init();
} else {
  window.addEventListener("DOMContentLoaded", init);
}

import "@/content/widget.css";
import { getWatchlist } from "@/shared/storage";
import { getAllManualJobs, playJob } from "@/shared/gitlabApi";
import { matchJobs } from "@/shared/patterns";
import { SCAN_INTERVAL_MS } from "@/shared/constants";
import { readCsrfToken } from "@/content/csrfToken";
import { SyncStorageData, JobPattern } from "@/types/storage";

interface PipelineInfo {
  origin: string;
  repoPath: string;
  pipelineId: string;
}

interface WidgetController {
  updateWatchlist(watchlist: SyncStorageData): void;
  setMonitoring(active: boolean): void;
  addLog(message: string, type: "started" | "error" | "info"): void;
  getSelectedPatterns(): JobPattern[];
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

// Build the widget DOM inside the shadow-root container provided by
// createShadowRootUi. Mirrors the previous createWidget(), minus the host /
// attachShadow / <style> creation that the Shadow Root UI now owns. All queries
// scope to `root` (the shadow-root content area) exactly as they scoped to the
// shadow root before.
function createWidget(
  root: ShadowRoot | HTMLElement,
  pipelineId: string,
  watchlist: SyncStorageData,
  onToggle: (selectedPatterns: JobPattern[], start: boolean) => void
): WidgetController {
  const panel = document.createElement("div");
  panel.className = "panel";
  root.appendChild(panel);

  let collapsed = false;
  let monitoring = false;
  let currentWatchlist = watchlist;

  function render() {
    const selectedKeys = getSelectedKeys();
    const hasItems =
      currentWatchlist.standaloneJobs.length > 0 || currentWatchlist.groups.length > 0;

    panel.innerHTML = `
      <div class="header">
        <span class="header-title">GitLab Job Starter</span>
        <span class="header-chevron ${collapsed ? "collapsed" : ""}">▲</span>
      </div>
      <div class="body ${collapsed ? "hidden" : ""}">
        <div class="pipeline-id">Pipeline #${pipelineId}</div>
        <div class="status-bar">
          <span class="status-dot ${monitoring ? "active" : ""}"></span>
          <span>${monitoring ? "Monitoring" : "Idle"}</span>
        </div>
        <div class="watchlist" id="gjs-watchlist">
          ${hasItems ? renderWatchlist() : ""}
        </div>
        ${hasItems ? '<hr class="section-divider">' : ""}
        <button
          class="btn-monitor ${monitoring ? "active" : ""}"
          id="gjs-toggle-btn"
          ${!hasItems ? "disabled" : ""}
        >
          ${monitoring ? "Stop Monitoring" : "Start Monitoring"}
        </button>
        <div class="log" id="gjs-log"></div>
      </div>
    `;

    root.querySelector(".header")!.addEventListener("click", () => {
      collapsed = !collapsed;
      render();
    });

    root.querySelector("#gjs-toggle-btn")?.addEventListener("click", () => {
      const patterns = getSelectedPatterns();
      onToggle(patterns, !monitoring);
    });

    // Restore checkbox states
    root.querySelectorAll<HTMLInputElement>("input[data-pattern]").forEach((cb) => {
      cb.checked = selectedKeys.includes(cb.dataset.pattern!);
    });

    // Group toggle: check/uncheck all jobs in group
    root.querySelectorAll<HTMLInputElement>("input[data-group-id]").forEach((groupCb) => {
      const groupId = groupCb.dataset.groupId!;
      const jobCbs = root.querySelectorAll<HTMLInputElement>(
        `input[data-pattern][data-in-group="${groupId}"]`
      );
      const allChecked = Array.from(jobCbs).every((cb) => cb.checked);
      groupCb.checked = allChecked;
      groupCb.indeterminate = !allChecked && Array.from(jobCbs).some((cb) => cb.checked);

      groupCb.addEventListener("change", () => {
        jobCbs.forEach((cb) => {
          cb.checked = groupCb.checked;
        });
      });
    });
  }

  const MATCH_LABEL: Record<string, string> = {
    contains: "~",
    starts: "^",
    ends: "$",
    exact: "=",
  };

  function serializePattern(job: JobPattern): string {
    return JSON.stringify(job);
  }

  function renderWatchlist(): string {
    const groups = currentWatchlist.groups
      .map(
        (g) => `
        <div class="group-header">
          <label class="group-label">
            <input type="checkbox" data-group-id="${g.id}" />
            ${escHtml(g.name)}
          </label>
        </div>
        <div class="group-jobs">
          ${g.jobs
            .map(
              (job) => `
            <label class="job-label">
              <input type="checkbox" data-pattern="${escHtml(serializePattern(job))}" data-in-group="${g.id}" />
              <span class="match-badge">${escHtml(MATCH_LABEL[job.matchType] ?? "~")}</span>${escHtml(job.pattern)}
            </label>
          `
            )
            .join("")}
        </div>
      `
      )
      .join("");

    const standalone = currentWatchlist.standaloneJobs
      .map(
        (job) => `
        <label class="job-label">
          <input type="checkbox" data-pattern="${escHtml(serializePattern(job))}" />
          <span class="match-badge">${escHtml(MATCH_LABEL[job.matchType] ?? "~")}</span>${escHtml(job.pattern)}
        </label>
      `
      )
      .join("");

    return groups + (groups && standalone ? '<hr class="section-divider">' : "") + standalone;
  }

  function getSelectedKeys(): string[] {
    const keys: string[] = [];
    root.querySelectorAll<HTMLInputElement>("input[data-pattern]:checked").forEach((cb) => {
      if (cb.dataset.pattern) keys.push(cb.dataset.pattern);
    });
    return keys;
  }

  function getSelectedPatterns(): JobPattern[] {
    return getSelectedKeys().map((k) => JSON.parse(k) as JobPattern);
  }

  function escHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  render();

  return {
    updateWatchlist(newWatchlist: SyncStorageData) {
      currentWatchlist = newWatchlist;
      render();
    },
    setMonitoring(active: boolean) {
      monitoring = active;
      render();
    },
    addLog(message: string, type: "started" | "error" | "info") {
      const log = root.querySelector("#gjs-log");
      if (!log) return;
      const entry = document.createElement("div");
      entry.className = `log-entry ${type}`;
      const time = new Date().toLocaleTimeString("en-US", { hour12: false });
      entry.textContent = `${time} ${message}`;
      log.prepend(entry);
      // Keep last 10 entries
      while (log.children.length > 10) log.lastChild?.remove();
    },
    getSelectedPatterns,
  };
}

export default defineContentScript({
  matches: ["*://*/*/-/pipelines/*"],
  runAt: "document_idle",
  cssInjectionMode: "ui",
  async main(ctx) {
    // Handle to the widget that the polling loop updates. createShadowRootUi's
    // autoMount fires as soon as `body` exists, so this is set before the first
    // poll completes; every loop call still null-checks it for safety.
    let widget: WidgetController | null = null;

    // Track jobs already started this session to avoid re-triggering
    const startedJobIds = new Set<number>();

    let pollIntervalId: ReturnType<typeof setInterval> | null = null;
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

    const info = parsePipelineInfo();
    if (!info) return;

    currentPipelineInfo = info;
    startedJobIds.clear();

    const watchlist = await getWatchlist();

    const ui = await createShadowRootUi(ctx, {
      name: "gjs-widget-host",
      position: "inline",
      // Skip WXT's `:host { all: initial !important }` reset — it would override the
      // widget's own `:host { position: fixed; ... }` in widget.css and drop the panel
      // into normal flow. The original bare attachShadow had no reset; this matches it.
      inheritStyles: true,
      anchor: "body",
      onMount(container) {
        widget = createWidget(container, info.pipelineId, watchlist, (selectedPatterns, start) => {
          if (start) {
            startMonitoring(info, selectedPatterns);
          } else {
            stopMonitoring();
            widget?.addLog("Monitoring stopped", "info");
          }
        });
      },
      onRemove() {
        widget = null;
      },
    });
    ui.autoMount();

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
  },
});

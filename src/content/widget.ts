import widgetCss from "./widget.css?inline";
import { SyncStorageData } from "../types/storage";

export interface WidgetController {
  updateWatchlist(watchlist: SyncStorageData): void;
  setMonitoring(active: boolean): void;
  setTestMode(enabled: boolean): void;
  addLog(message: string, type: "started" | "error" | "info"): void;
  getSelectedPatterns(): string[];
}

export function createWidget(
  pipelineId: string,
  watchlist: SyncStorageData,
  onToggle: (selectedPatterns: string[], start: boolean) => void
): WidgetController {
  // Shadow DOM host — fully isolated from GitLab's styles
  const host = document.createElement("div");
  host.setAttribute("id", "gjs-widget-host");
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  const styleEl = document.createElement("style");
  styleEl.textContent = widgetCss;

  const panel = document.createElement("div");
  panel.className = "panel";

  shadow.appendChild(styleEl);
  shadow.appendChild(panel);

  let collapsed = false;
  let monitoring = false;
  let testMode = false;
  let currentWatchlist = watchlist;

  function render() {
    const selectedPatterns = getSelectedPatterns();
    const hasItems =
      currentWatchlist.standaloneJobs.length > 0 ||
      currentWatchlist.groups.length > 0;

    panel.innerHTML = `
      <div class="header">
        <span class="header-title">GitLab Job Starter</span>
        ${testMode ? '<span class="test-badge">TEST</span>' : ""}
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
          ${monitoring ? "Stop Monitoring" : selectedPatterns.length > 0 ? `Start Monitoring (${selectedPatterns.length})` : "Start Monitoring"}
        </button>
        <div class="log" id="gjs-log"></div>
      </div>
    `;

    shadow.querySelector(".header")!.addEventListener("click", () => {
      collapsed = !collapsed;
      render();
    });

    shadow.querySelector("#gjs-toggle-btn")?.addEventListener("click", () => {
      const patterns = getSelectedPatterns();
      onToggle(patterns, !monitoring);
    });

    // Restore checkbox states
    shadow
      .querySelectorAll<HTMLInputElement>("input[data-pattern]")
      .forEach((cb) => {
        cb.checked = selectedPatterns.includes(cb.dataset.pattern!);
      });

    // Group toggle: check/uncheck all jobs in group
    shadow
      .querySelectorAll<HTMLInputElement>("input[data-group-id]")
      .forEach((groupCb) => {
        const groupId = groupCb.dataset.groupId!;
        const jobCbs = shadow.querySelectorAll<HTMLInputElement>(
          `input[data-pattern][data-in-group="${groupId}"]`
        );
        const allChecked = Array.from(jobCbs).every((cb) => cb.checked);
        groupCb.checked = allChecked;
        groupCb.indeterminate =
          !allChecked && Array.from(jobCbs).some((cb) => cb.checked);

        groupCb.addEventListener("change", () => {
          jobCbs.forEach((cb) => {
            cb.checked = groupCb.checked;
          });
        });
      });
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
              <input type="checkbox" data-pattern="${escHtml(job)}" data-in-group="${g.id}" />
              ${escHtml(job)}
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
          <input type="checkbox" data-pattern="${escHtml(job)}" />
          ${escHtml(job)}
        </label>
      `
      )
      .join("");

    return groups + (groups && standalone ? '<hr class="section-divider">' : "") + standalone;
  }

  function getSelectedPatterns(): string[] {
    const patterns: string[] = [];
    shadow
      .querySelectorAll<HTMLInputElement>("input[data-pattern]:checked")
      .forEach((cb) => {
        if (cb.dataset.pattern) patterns.push(cb.dataset.pattern);
      });
    return patterns;
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
    setTestMode(enabled: boolean) {
      testMode = enabled;
      render();
    },
    addLog(message: string, type: "started" | "error" | "info") {
      const log = shadow.querySelector("#gjs-log");
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

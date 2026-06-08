# GitLab Job Starter — Chrome Web Store Listing Pack

Copy-paste source for the CWS Developer Dashboard. Draft — review before publishing.

> ⚠️ **Trademark note (decision: keep the name).** "GitLab Job Starter" leads
> with a third-party trademark, which is a **medium** rejection risk — reviewers
> flag names that begin with another company's brand. The disclaimer below
> mitigates the *description* but not the *name*. If CWS rejects on the name, the
> pre-drafted fallback is **"Job Starter for GitLab"** (nominative "for X" form).

---

## Store item name (max 75 chars)

`GitLab Job Starter` (18 chars) — *kept per decision; fallback: "Job Starter for GitLab".*

## Summary / short description (max 132 chars)

`Automatically trigger matching manual CI jobs on GitLab pipeline pages using configurable name patterns.` (103 chars — the current manifest description)

## Category

**Developer Tools**

## Language

**English (United Kingdom)** (or en-US — match your dashboard default)

## Single-purpose description (required, Privacy tab — separate field)

> GitLab Job Starter watches the GitLab pipeline page you are viewing and
> automatically plays the manual CI jobs whose names match the patterns you have
> configured, using your existing GitLab session. Triggering matching manual jobs
> is its single purpose.

## Detailed description (max 16,000 chars)

> **Stop hunting for the right manual job to play. Let it start itself.**
>
> On a GitLab pipeline page, manual jobs sit there waiting for a click. If you
> repeatedly start the same jobs — a deploy, a specific test stage, an
> environment spin-up — GitLab Job Starter does it for you.
>
> **How it works**
> 1. Add the job-name patterns (and optional groups) you care about in the popup.
> 2. Open any GitLab pipeline page.
> 3. The extension finds the manual jobs whose names match your patterns and plays
>    them automatically, in your own logged-in session.
>
> **Works with any GitLab.** gitlab.com or a self-hosted instance on any domain —
> the extension activates on the pipeline-page URL shape, wherever your GitLab
> lives.
>
> **Privacy-respecting.**
> • Stores only the job-name patterns you type, locally in your browser
>   (`chrome.storage.sync`).
> • Talks only to the GitLab instance you are already on, using your existing
>   session — never to the developer or any third party.
> • No telemetry, no analytics, no remote code.
>
> Open source — code and privacy policy linked below.
>
> ---
> *Not affiliated with, endorsed by, or sponsored by GitLab Inc. "GitLab" is a
> trademark of GitLab Inc., used here only to describe what this extension works
> with.*

## Screenshots (≥1 required; 1280×800 or 640×400)

- **Present:** `docs/screenshot.png` (1280×800) — submittable as-is.
- **Recommended extra captures** (scrub real instance URLs / job names first):
  the popup pattern editor; the in-page widget after it has started jobs.

Store icon 128×128 is already present (`public/icons/icon128.png`).

## Privacy policy URL

`https://curtyo18.github.io/GitLabJobStarter/privacy.html`
*(GitHub Pages — enabled 2026-06-08. Confirm it renders in a browser before
submitting.)*

---

## Privacy practices tab

### Permission justifications

**`storage`**
> GitLab Job Starter stores user-created job-name patterns and pattern groups
> (the "watchlist") in chrome.storage.sync so they persist across browser sessions
> and sync across the user's own Chrome profile. Without it, every pattern the user
> enters would be lost when the browser closes. No data is transmitted off-device;
> chrome.storage is sandboxed per-extension by Chrome.

**Host permissions — `*://*/*`** *(the one needing the most care)*
> The content script injects into GitLab pipeline pages (matched by the
> `*://*/*/-/pipelines/*` pattern) to read the page's CSRF token and render the
> control widget, then calls the GitLab REST API and the job-play endpoint using
> the user's existing authenticated session. Broad host access is inherent to the
> product, not a convenience: GitLab is self-hostable on ANY domain
> (gitlab.com, gitlab.acme.internal, git.example.org, …), so a fixed allowlist
> would break the extension for every self-hosted user. All API calls target the
> same origin as the page the user is already on; the extension never contacts the
> developer or any third party. Although host access is broad, the content script
> only *activates* on `*/-/pipelines/*` URLs, so it does nothing on the vast
> majority of pages. (optional_host_permissions was considered and rejected: a
> static content_scripts declaration can't match an origin the user hasn't yet
> granted, so auto-injection on self-hosted instances would break.)

### Data usage disclosures

- **Remote code:** No — all code is bundled in the package.
- **Does this item collect or use user data?** **Does not collect** any of the
  listed categories. Rationale (state in reviewer notes): the only stored value is
  user-entered job patterns kept locally; the extension's network calls are
  same-origin GitLab API requests the user initiates in their own session, and
  nothing is sent to the developer or a third party.
- **Certification checkboxes:** affirm all three.

### Reviewer notes (paste into the "notes to reviewer" field)

> Broad host permission, explained: GitLab is self-hostable on arbitrary domains,
> so the extension cannot ship a fixed host allowlist. It declares `*://*/*` but
> the content script only *runs* on the GitLab pipeline-page URL shape
> (`*://*/*/-/pipelines/*`). All requests are same-origin GitLab REST API /
> job-play calls in the user's existing authenticated session — no data goes to
> the developer or any third party, and there is no remotely hosted code. Only
> data stored is the user's job-name patterns, in chrome.storage.sync.

---

## Submission checklist (GJS)

- [x] MV3 package built at current version (1.10.1) — `.output/gitlab-job-starter-1.10.1-chrome.zip`
- [x] Privacy policy hosted — Pages enabled (confirm renders in browser)
- [x] 128×128 icon present
- [x] ≥1 screenshot present (`docs/screenshot.png`); optional extras recommended
- [ ] CWS developer account + $5 fee + 2-Step Verification + verified contact email (user)
- [ ] Category / language / visibility set in dashboard
- [ ] Paste summary, detailed description (incl. unaffiliated disclaimer),
      single-purpose, permission justifications, reviewer notes
- [ ] Data-use disclosures answered (above)
- [ ] Upload zip + screenshots + icon → Submit
- [ ] Do NOT upload the legacy zip (`gitlab-job-starter-1.10.0-chrome.zip`)
- [ ] Fallback ready if name rejected: "Job Starter for GitLab"

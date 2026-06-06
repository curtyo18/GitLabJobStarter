# Permissions Justification — GitLab Job Starter

This document contains the per-permission rationale for the Chrome Web Store submission.
Paste the relevant section into the corresponding field in the Developer Dashboard.

---

## `storage`

GitLab Job Starter stores user-created job-name patterns and pattern groups (the "watchlist")
in `chrome.storage.sync`. This is required so the user's configured patterns persist across
browser sessions and sync across the user's own Chrome profile. Without this permission, every
pattern the user enters would be lost when the browser is closed. No data is transmitted
off-device by the extension; `chrome.storage` is sandboxed per-extension by Chrome.

---

## Host permissions — `*://*/*`

GitLab Job Starter works by:

1. Injecting a content script into GitLab pipeline pages (matched by the
   `*://*/*/-/pipelines/*` content-script pattern) that reads the page's CSRF token and renders
   the in-page control widget.
2. Calling the GitLab REST API (`/api/v4/projects/:path/pipelines/:id/jobs` and `.../bridges`)
   to enumerate manual CI jobs, and the job-play endpoint (`/-/jobs/:id/play.json`) to trigger
   the jobs the user has matched — all using the user's existing, already-authenticated browser
   session (`credentials: "include"`).

Broad host access (`*://*/*`) is **inherent to the product**, not a convenience:

- **GitLab is self-hostable on any domain.** The extension cannot know in advance which
  origin a user's GitLab instance lives on. It might be `gitlab.com`, a corporate
  `gitlab.acme.internal`, a per-team `git.example.org`, or any other hostname. Hardcoding a
  fixed allowlist of domains would break the extension for every self-hosted GitLab user,
  which is a large share of GitLab's install base.
- **The API calls target the same origin as the page** the user is already viewing. The
  extension only ever talks to the GitLab instance the user has actively navigated to and is
  logged into; it never contacts the extension author or any third party.
- **Activation is scoped at runtime.** Although host access is broad, the content script only
  *runs* on URLs matching `*/-/pipelines/*` (the GitLab pipeline-page URL shape), so on the
  vast majority of pages the user visits the extension does nothing at all.

The extension does not read cookies, passwords, browsing history, or page content beyond the
CSRF `<meta>` tag and the GitLab API responses it explicitly requests. No captured data leaves
the browser.

### Why `*://*/*` is not narrowed to `optional_host_permissions`

We considered requesting host access at runtime via `optional_host_permissions` +
`chrome.permissions.request()`. We did **not** adopt this for two reasons:

1. **Auto-injection would break.** The core UX is that the content script auto-injects on
   pipeline pages with no user interaction. `optional_host_permissions` grants are not
   available until the user approves a runtime prompt, and a static `content_scripts`
   declaration cannot match an origin the user has not yet granted — so the widget would fail
   to appear on a self-hosted instance until the user manually granted that exact origin every
   time. That defeats the "it just works on any GitLab" promise.
2. **`chrome.permissions.request()` must be called from a user gesture**, which there is no
   natural surface for before the user has even seen the pipeline page. The result would be a
   worse, more confusing experience for no real privacy gain, since the extension already only
   ever talks to the GitLab origin the user is actively using.

We therefore keep the broad declaration and rely on the narrow `content_scripts` match pattern
(`*://*/*/-/pipelines/*`) to bound where the extension actually activates.

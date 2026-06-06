import { describe, it, expect, afterEach } from "vitest";
import { readCsrfToken } from "@/content/csrfToken";

afterEach(() => {
  document.head.innerHTML = "";
});

describe("readCsrfToken", () => {
  it("returns null when no csrf-token meta tag is present", () => {
    expect(readCsrfToken()).toBeNull();
  });

  it("reads the content of the csrf-token meta tag", () => {
    const meta = document.createElement("meta");
    meta.name = "csrf-token";
    meta.content = "abc123token";
    document.head.appendChild(meta);
    expect(readCsrfToken()).toBe("abc123token");
  });

  it("ignores meta tags with a different name", () => {
    const meta = document.createElement("meta");
    meta.name = "csp-nonce";
    meta.content = "not-the-token";
    document.head.appendChild(meta);
    expect(readCsrfToken()).toBeNull();
  });
});

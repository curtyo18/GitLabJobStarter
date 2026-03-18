import { useState, useEffect } from "preact/hooks";
import { SyncStorageData } from "../../types/storage";

interface Props {
  data: SyncStorageData;
  onImport: (next: SyncStorageData) => void;
}

function isJob(j: unknown): boolean {
  // Accept legacy plain strings and new JobPattern objects
  if (typeof j === "string") return true;
  if (typeof j !== "object" || j === null) return false;
  const o = j as Record<string, unknown>;
  return typeof o.pattern === "string" && typeof o.matchType === "string";
}

function isValidData(value: unknown): value is SyncStorageData {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.standaloneJobs) &&
    obj.standaloneJobs.every(isJob) &&
    Array.isArray(obj.groups) &&
    obj.groups.every(
      (g) =>
        typeof (g as Record<string, unknown>).id === "string" &&
        typeof (g as Record<string, unknown>).name === "string" &&
        Array.isArray((g as Record<string, unknown>).jobs) &&
        (g as Record<string, unknown[]>).jobs.every(isJob)
    )
  );
}

function encode(data: SyncStorageData): string {
  return btoa(JSON.stringify(data));
}

function decode(str: string): SyncStorageData | null {
  try {
    const parsed: unknown = JSON.parse(atob(str.trim()));
    return isValidData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function ImportExport({ data, onImport }: Props) {
  const [text, setText] = useState(() => encode(data));
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  // Keep textarea in sync when data changes externally (e.g. adding a job)
  useEffect(() => {
    setText(encode(data));
  }, [data]);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleImport() {
    const result = decode(text);
    if (!result) {
      setError(true);
      setTimeout(() => setError(false), 1500);
      return;
    }
    onImport(result);
  }

  return (
    <section>
      <h2>Config</h2>
      <textarea
        class="config-textarea"
        value={text}
        onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
        spellcheck={false}
      />
      <div class="import-export-actions">
        <button class="btn-subtle" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </button>
        <button class={`btn-subtle ${error ? "btn-error" : ""}`} onClick={handleImport}>
          {error ? "Invalid" : "Import"}
        </button>
      </div>
    </section>
  );
}

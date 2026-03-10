import { useState, useEffect } from "preact/hooks";
import { useStorage } from "./hooks/useStorage";
import { GroupList } from "./components/GroupList";
import { StandaloneList } from "./components/StandaloneList";
import { getTestMode, setTestMode } from "../shared/storage";

export function App() {
  const { data, save } = useStorage();
  const [testMode, setTestModeState] = useState(false);

  useEffect(() => {
    getTestMode().then(setTestModeState);
    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === "sync" && "testMode" in changes) {
        setTestModeState(changes["testMode"].newValue ?? false);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  function handleTestModeChange(enabled: boolean) {
    setTestModeState(enabled);
    setTestMode(enabled);
  }

  return (
    <div class="app">
      <header>
        <h1>GitLab Job Starter</h1>
        <p class="subtitle">Configure job patterns to auto-start on pipeline pages.</p>
      </header>
      <main>
        <div class={`test-mode-bar ${testMode ? "active" : ""}`}>
          <div class="test-mode-label">
            <span class="test-mode-title">Test Mode</span>
            <span class="test-mode-desc">
              {testMode
                ? "Using fake jobs — no real API calls"
                : "Simulate jobs without hitting the real API"}
            </span>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => handleTestModeChange((e.target as HTMLInputElement).checked)}
            />
            <span class="toggle-track" />
          </label>
        </div>
        <hr />
        <GroupList data={data} onSave={save} />
        <hr />
        <StandaloneList data={data} onSave={save} />
      </main>
    </div>
  );
}

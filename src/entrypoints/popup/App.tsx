import { useStorage } from "./hooks/useStorage";
import { GroupList } from "./components/GroupList";
import { StandaloneList } from "./components/StandaloneList";
import { ImportExport } from "./components/ImportExport";

export function App() {
  const { data, save } = useStorage();

  return (
    <div class="app">
      <header>
        <h1>GitLab Job Starter</h1>
        <p class="subtitle">Configure job patterns to auto-start on pipeline pages.</p>
      </header>
      <main>
        <GroupList data={data} onSave={save} />
        <hr />
        <StandaloneList data={data} onSave={save} />
        <hr />
        <ImportExport data={data} onImport={save} />
      </main>
    </div>
  );
}

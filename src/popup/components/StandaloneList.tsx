import { SyncStorageData } from "../../types/storage";
import { PatternInput } from "./PatternInput";

interface Props {
  data: SyncStorageData;
  onSave: (next: SyncStorageData) => void;
}

export function StandaloneList({ data, onSave }: Props) {
  function addJob(name: string) {
    if (data.standaloneJobs.includes(name)) return;
    onSave({ ...data, standaloneJobs: [...data.standaloneJobs, name] });
  }

  function removeJob(name: string) {
    onSave({
      ...data,
      standaloneJobs: data.standaloneJobs.filter((j) => j !== name),
    });
  }

  return (
    <section>
      <h2>Standalone Jobs</h2>
      <PatternInput placeholder="Job name pattern" onAdd={addJob} />
      {data.standaloneJobs.length === 0 ? (
        <p class="empty">No standalone jobs added yet.</p>
      ) : (
        <ul>
          {data.standaloneJobs.map((job) => (
            <li key={job}>
              <span class="pattern">{job}</span>
              <button class="btn-remove" onClick={() => removeJob(job)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

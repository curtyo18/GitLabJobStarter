import { SyncStorageData, JobPattern } from "../../types/storage";
import { PatternInput } from "./PatternInput";

interface Props {
  data: SyncStorageData;
  onSave: (next: SyncStorageData) => void;
}

export function StandaloneList({ data, onSave }: Props) {
  function addJob(job: JobPattern) {
    if (data.standaloneJobs.some((j) => j.pattern === job.pattern && j.matchType === job.matchType)) return;
    onSave({ ...data, standaloneJobs: [...data.standaloneJobs, job] });
  }

  function removeJob(job: JobPattern) {
    onSave({
      ...data,
      standaloneJobs: data.standaloneJobs.filter(
        (j) => !(j.pattern === job.pattern && j.matchType === job.matchType)
      ),
    });
  }

  const LABELS: Record<string, string> = {
    contains: "contains",
    starts: "starts with",
    ends: "ends with",
    exact: "exact",
  };

  return (
    <section>
      <h2>Standalone Jobs</h2>
      <PatternInput placeholder="Job name" onAdd={addJob} />
      {data.standaloneJobs.length === 0 ? (
        <p class="empty">No standalone jobs added yet.</p>
      ) : (
        <ul>
          {data.standaloneJobs.map((job) => (
            <li key={`${job.matchType}:${job.pattern}`}>
              <span class="match-type-badge">{LABELS[job.matchType]}</span>
              <span class="pattern">{job.pattern}</span>
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

import { useState } from "preact/hooks";
import { SyncStorageData, WatchGroup, JobPattern } from "@/types/storage";
import { PatternInput } from "./PatternInput";

interface Props {
  data: SyncStorageData;
  onSave: (next: SyncStorageData) => void;
}

const LABELS: Record<string, string> = {
  contains: "contains",
  starts: "starts with",
  ends: "ends with",
  exact: "exact",
};

export function GroupList({ data, onSave }: Props) {
  const [newGroupName, setNewGroupName] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  function createGroup() {
    const name = newGroupName.trim();
    if (!name) return;
    const group: WatchGroup = {
      id: crypto.randomUUID(),
      name,
      jobs: [],
    };
    onSave({ ...data, groups: [...data.groups, group] });
    setNewGroupName("");
    setExpandedGroups((prev) => new Set([...prev, group.id]));
  }

  function removeGroup(id: string) {
    onSave({ ...data, groups: data.groups.filter((g) => g.id !== id) });
  }

  function addJobToGroup(groupId: string, job: JobPattern) {
    onSave({
      ...data,
      groups: data.groups.map((g) =>
        g.id === groupId &&
        !g.jobs.some((j) => j.pattern === job.pattern && j.matchType === job.matchType)
          ? { ...g, jobs: [...g.jobs, job] }
          : g
      ),
    });
  }

  function removeJobFromGroup(groupId: string, job: JobPattern) {
    onSave({
      ...data,
      groups: data.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              jobs: g.jobs.filter(
                (j) => !(j.pattern === job.pattern && j.matchType === job.matchType)
              ),
            }
          : g
      ),
    });
  }

  function toggleExpanded(id: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <section>
      <h2>Groups</h2>
      <div class="input-row">
        <input
          type="text"
          value={newGroupName}
          placeholder="Group name (e.g. dev1)"
          onInput={(e) => setNewGroupName((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => e.key === "Enter" && createGroup()}
        />
        <button onClick={createGroup}>New Group</button>
      </div>

      {data.groups.length === 0 ? (
        <p class="empty">No groups created yet.</p>
      ) : (
        <ul class="group-list">
          {data.groups.map((group) => {
            const expanded = expandedGroups.has(group.id);
            return (
              <li key={group.id} class="group-item">
                <div class="group-header">
                  <button
                    class="btn-expand"
                    onClick={() => toggleExpanded(group.id)}
                    title={expanded ? "Collapse" : "Expand"}
                  >
                    {expanded ? "▼" : "▶"}
                  </button>
                  <span class="group-name">{group.name}</span>
                  <span class="group-count">
                    {group.jobs.length} job{group.jobs.length !== 1 ? "s" : ""}
                  </span>
                  <button class="btn-remove" onClick={() => removeGroup(group.id)}>
                    Remove
                  </button>
                </div>

                {expanded && (
                  <div class="group-body">
                    <PatternInput
                      placeholder="Add job pattern to group"
                      onAdd={(job) => addJobToGroup(group.id, job)}
                    />
                    {group.jobs.length === 0 ? (
                      <p class="empty">No jobs in this group yet.</p>
                    ) : (
                      <ul>
                        {group.jobs.map((job) => (
                          <li key={`${job.matchType}:${job.pattern}`}>
                            <span class="match-type-badge">{LABELS[job.matchType]}</span>
                            <span class="pattern">{job.pattern}</span>
                            <button
                              class="btn-remove"
                              onClick={() => removeJobFromGroup(group.id, job)}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

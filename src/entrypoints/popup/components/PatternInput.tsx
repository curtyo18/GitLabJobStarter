import { useState } from "preact/hooks";
import { JobPattern, MatchType } from "@/types/storage";

interface Props {
  placeholder: string;
  onAdd: (value: JobPattern) => void;
}

export function PatternInput({ placeholder, onAdd }: Props) {
  const [value, setValue] = useState("");
  const [matchType, setMatchType] = useState<MatchType>("contains");

  function handleAdd() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd({ pattern: trimmed, matchType });
    setValue("");
  }

  return (
    <div class="input-row">
      <select
        value={matchType}
        onChange={(e) => setMatchType((e.target as HTMLSelectElement).value as MatchType)}
      >
        <option value="contains">Contains</option>
        <option value="starts">Starts with</option>
        <option value="ends">Ends with</option>
        <option value="exact">Exact</option>
      </select>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onInput={(e) => setValue((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
      />
      <button onClick={handleAdd}>Add</button>
    </div>
  );
}

import { useState } from "preact/hooks";

interface Props {
  placeholder: string;
  onAdd: (value: string) => void;
}

export function PatternInput({ placeholder, onAdd }: Props) {
  const [value, setValue] = useState("");

  function handleAdd() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  }

  return (
    <div class="input-row">
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

import { useState } from 'react';

type PreviewSliderProps = {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onCommit: (v: number) => void;
};

export default function PreviewSlider({ label, min, max, step = 1, value, onCommit }: PreviewSliderProps) {
  const [editing, setEditing] = useState<null | { pointerId: number; draft: number }>(null);
  const shown = editing ? editing.draft : value;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-zinc-300">
        <span>{label}</span>
        <span className="text-zinc-100 tabular-nums">{shown}</span>
      </div>

      <input
        className="mt-1 w-full"
        type="range"
        min={min}
        max={max}
        step={step}
        value={shown}
        onPointerDown={(e) => setEditing({ pointerId: e.pointerId, draft: value })}
        onChange={(e) => {
          const v = Number(e.target.value);
          setEditing((prev) => (prev ? { ...prev, draft: v } : { pointerId: -1, draft: v }));
        }}
        onPointerUp={() => {
          if (!editing) return;
          onCommit(editing.draft);
          setEditing(null);
        }}
        onPointerCancel={() => setEditing(null)}
        onBlur={() => {
          if (!editing) return;
          onCommit(editing.draft);
          setEditing(null);
        }}
      />
    </div>
  );
}
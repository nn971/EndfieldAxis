import { useMemo, useRef, useState } from "react";
import { useAppSelector } from "../../app/hooks";
import { selectSolution } from "../solution/selectors";
import { runSolutionSim } from "../sim/runSolutionSim";
import {
  compareSimTestCase,
  createSimTestCase,
  deserializeSimTestCase,
  type SimTestCompareMode,
  serializeSimTestCase,
} from "./testCaseSL";

export default function TestPanel() {
  const solution = useAppSelector(selectSolution);

  const [text, setText] = useState<string>("");
  const [mode, setMode] = useState<SimTestCompareMode>("eventTypes");
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const STORAGE_KEY = "endfieldaxis.dev.simTestCase.v1";

  const hasText = useMemo(() => text.trim().length > 0, [text]);

  const onGenerate = () => {
    setError("");
    setResult("");
    try {
      const simResult = runSolutionSim(solution);
      const testCase = createSimTestCase(solution, simResult);
      setText(serializeSimTestCase(testCase));
      setResult(
        `Generated standard: ${testCase.expected.eventTypes.length} events, ${testCase.expected.hitDamageBuckets.length} hit snapshots.`,
      );
    } catch {
      setError("Failed to generate test case from current solution.");
    }
  };

  const onCompare = () => {
    setError("");
    setResult("");

    const parsed = deserializeSimTestCase(text);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    try {
      const simResult = runSolutionSim(parsed.testCase.solution);
      const compared = compareSimTestCase(parsed.testCase, simResult, mode);
      setResult(compared.message);
    } catch {
      setError("Failed to run simulation for comparison.");
    }
  };

  const onDownload = () => {
    setError("");
    setResult("");
    if (!hasText) {
      setError("No test case text to download.");
      return;
    }
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sim-test-case.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onPickFile = () => {
    setError("");
    fileInputRef.current?.click();
  };

  const onFileChosen: React.ChangeEventHandler<HTMLInputElement> = async e => {
    setError("");
    setResult("");
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const content = await file.text();
      setText(content);
      const parsed = deserializeSimTestCase(content);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      setResult("Loaded test case from file.");
    } catch {
      setError("Failed to read file.");
    }
  };

  const onSaveToBrowser = () => {
    setError("");
    setResult("");
    if (!hasText) {
      setError("No test case text to save.");
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, text);
      setResult("Saved test case to localStorage.");
    } catch {
      setError("Failed to write to localStorage.");
    }
  };

  const onLoadFromBrowser = () => {
    setError("");
    setResult("");
    let content: string | null = null;
    try {
      content = localStorage.getItem(STORAGE_KEY);
    } catch {
      setError("Failed to read from localStorage.");
      return;
    }
    if (!content) {
      setError("No saved test case found in localStorage.");
      return;
    }

    setText(content);
    const parsed = deserializeSimTestCase(content);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setResult("Loaded test case from localStorage.");
  };

  return (
    <div className="mt-4 p-4 border border-zinc-700 rounded bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Dev Test Panel</h2>
          <div className="text-xs text-zinc-400">
            Generate and compare simulator standards from current solution.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onGenerate}
          >
            Generate Standard
          </button>
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onCompare}
            disabled={!hasText}
            title={hasText ? "" : "Generate or paste test case JSON first"}
          >
            Compare Current
          </button>

          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onDownload}
          >
            Download .json
          </button>
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onPickFile}
          >
            Upload .json
          </button>

          <div className="w-px h-4 bg-zinc-700 mx-1" />

          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onSaveToBrowser}
          >
            Save to Browser
          </button>
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onLoadFromBrowser}
          >
            Load from Browser
          </button>

          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept="application/json"
            onChange={onFileChosen}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className="text-zinc-300">Compare mode:</span>
        <button
          type="button"
          className={`px-2 py-1 rounded border ${
            mode === "eventTypes"
              ? "border-zinc-500 bg-zinc-700"
              : "border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
          }`}
          onClick={() => setMode("eventTypes")}
        >
          Event Types
        </button>
        <button
          type="button"
          className={`px-2 py-1 rounded border ${
            mode === "hitDamageBuckets"
              ? "border-zinc-500 bg-zinc-700"
              : "border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
          }`}
          onClick={() => setMode("hitDamageBuckets")}
        >
          Hit Damage Buckets
        </button>
      </div>

      {error ? <div className="mt-2 text-xs text-red-300">Error: {error}</div> : null}
      {result ? <div className="mt-2 text-xs text-emerald-300">{result}</div> : null}

      <div className="mt-3">
        <textarea
          className="w-full h-[220px] rounded border border-zinc-800 bg-black/40 p-3 text-xs leading-5 font-mono"
          placeholder="Generate a standard or paste test case JSON here..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
      </div>
    </div>
  );
}

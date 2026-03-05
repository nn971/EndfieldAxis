import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectSolution } from "./selectors";
import { solutionReplaced } from "./solutionSlice";
import {
  deserializeSolution,
  serializeSolution,
  type DeserializeSolutionError,
} from "./solutionSL";

export default function SolutionSLPanel() {
  const { t } = useTranslation();
  const translate = t as unknown as (
    key: string,
    options?: Record<string, unknown>,
  ) => string;
  const dispatch = useAppDispatch();
  const solution = useAppSelector(selectSolution);

  const [text, setText] = useState<string>("");
  const [error, setError] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const STORAGE_KEY = "endfieldaxis.solution.v1";

  const exported = useMemo(() => serializeSolution(solution), [solution]);

  const getDeserializeErrorMessage = (error: DeserializeSolutionError) => {
    return translate(`solutionSL.errors.${error.code}`, error.meta);
  };

  const onExportToText = () => {
    setError("");
    setText(exported);
  };

  const onLoadFromText = () => {
    setError("");
    const parsed = deserializeSolution(text);
    if (!parsed.ok) {
      setError(getDeserializeErrorMessage(parsed));
      return;
    }
    dispatch(solutionReplaced(parsed.solution));
  };

  const onDownload = () => {
    setError("");
    const blob = new Blob([exported], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "solution.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onSaveToBrowser = () => {
    setError("");
    try {
      localStorage.setItem(STORAGE_KEY, exported);
    } catch {
      setError(t("solutionSL.errors.failedWriteLocalStorage"));
    }
  };

  const onLoadFromBrowser = () => {
    setError("");
    let content: string | null = null;
    try {
      content = localStorage.getItem(STORAGE_KEY);
    } catch {
      setError(t("solutionSL.errors.failedReadLocalStorage"));
      return;
    }
    if (!content) {
      setError(t("solutionSL.errors.noSavedSolutionLocalStorage"));
      return;
    }
    setText(content);
    const parsed = deserializeSolution(content);
    if (!parsed.ok) {
      setError(getDeserializeErrorMessage(parsed));
      return;
    }
    dispatch(solutionReplaced(parsed.solution));
  };

  const onPickFile = () => {
    setError("");
    fileInputRef.current?.click();
  };

  const onFileChosen: React.ChangeEventHandler<HTMLInputElement> = async e => {
    setError("");
    const file = e.target.files?.[0];
    // Allow picking the same file twice in a row.
    e.target.value = "";
    if (!file) return;

    try {
      const content = await file.text();
      setText(content);
      const parsed = deserializeSolution(content);
      if (!parsed.ok) {
        setError(getDeserializeErrorMessage(parsed));
        return;
      }
      dispatch(solutionReplaced(parsed.solution));
    } catch {
      setError(t("solutionSL.errors.failedReadFile"));
    }
  };

  return (
    <div
      className="mt-4 p-4 border border-zinc-700 rounded bg-zinc-900"
      data-testid="panel-solution-sl"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("solutionSL.heading")}</h2>
          <div className="text-xs text-zinc-400">{t("solutionSL.helperText")}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onExportToText}
          >
            {t("solutionSL.exportToText")}
          </button>
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onLoadFromText}
            disabled={!text.trim()}
            title={text.trim() ? "" : t("solutionSL.pasteJsonFirst")}
          >
            {t("solutionSL.loadFromText")}
          </button>
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onDownload}
          >
            {t("solutionSL.downloadJson")}
          </button>
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onPickFile}
          >
            {t("solutionSL.uploadJson")}
          </button>

          <div className="w-px h-4 bg-zinc-700 mx-1" />

          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onSaveToBrowser}
          >
            {t("solutionSL.saveToBrowser")}
          </button>
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onLoadFromBrowser}
          >
            {t("solutionSL.loadFromBrowser")}
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

      {error ? (
        <div className="mt-2 text-xs text-red-300">
          {t("solutionSL.errorPrefix")} {error}
        </div>
      ) : null}

      <div className="mt-3">
        <textarea
          className="w-full h-[220px] rounded border border-zinc-800 bg-black/40 p-3 text-xs leading-5 font-mono"
          placeholder={t("solutionSL.textareaPlaceholder")}
          value={text}
          onChange={e => setText(e.target.value)}
        />
      </div>
    </div>
  );
}

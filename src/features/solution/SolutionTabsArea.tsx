import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectSolution } from "./selectors";
import { solutionReplaced } from "./solutionSlice";
import {
  deserializeSolution,
  serializeSolution,
  type DeserializeSolutionError,
} from "./solutionSL";

type UploadMode = "replace" | "new";
type TextModalMode = "export" | "error";

interface TextModalState {
  open: boolean;
  mode: TextModalMode;
  content: string;
  error?: string;
}

export default function SolutionTabsArea() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const solution = useAppSelector(selectSolution);

  const [menuOpen, setMenuOpen] = useState(false);
  const [, setUploadMode] = useState<UploadMode>("replace");
  const [textModal, setTextModal] = useState<TextModalState>({
    open: false,
    mode: "export",
    content: "",
  });

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const STORAGE_KEY = "endfieldaxis.solution.v1";

  const exported = useMemo(() => serializeSolution(solution), [solution]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  const getDeserializeErrorMessage = (error: DeserializeSolutionError) => {
    return t(`solutionSL.errors.${error.code}`, error.meta);
  };

  const handleDownload = () => {
    setMenuOpen(false);
    const blob = new Blob([exported], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "solution.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenTextModal = () => {
    setMenuOpen(false);
    setTextModal({
      open: true,
      mode: "export",
      content: exported,
    });
  };

  const handleSaveToBrowser = () => {
    setMenuOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, exported);
    } catch {
      setTextModal({
        open: true,
        mode: "error",
        content: "",
        error: t("solutionSL.errors.failedWriteLocalStorage"),
      });
    }
  };

  const handleUploadClick = (mode: UploadMode) => {
    setUploadMode(mode);
    setMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChosen: React.ChangeEventHandler<HTMLInputElement> = async e => {
    const file = e.target.files?.[0];
    // Allow picking the same file twice in a row
    e.target.value = "";
    if (!file) return;

    let content: string;
    try {
      content = await file.text();
    } catch {
      setTextModal({
        open: true,
        mode: "error",
        content: "",
        error: t("solutionSL.errors.failedReadFile"),
      });
      return;
    }

    const parsed = deserializeSolution(content);
    if (!parsed.ok) {
      setTextModal({
        open: true,
        mode: "error",
        content,
        error: getDeserializeErrorMessage(parsed),
      });
      return;
    }

    dispatch(solutionReplaced(parsed.solution));
  };

  const handleLoadFromBrowser = (_mode: UploadMode) => {
    setMenuOpen(false);

    let content: string | null = null;
    try {
      content = localStorage.getItem(STORAGE_KEY);
    } catch {
      setTextModal({
        open: true,
        mode: "error",
        content: "",
        error: t("solutionSL.errors.failedReadLocalStorage"),
      });
      return;
    }

    if (!content) {
      setTextModal({
        open: true,
        mode: "error",
        content: "",
        error: t("solutionSL.errors.noSavedSolutionLocalStorage"),
      });
      return;
    }

    const parsed = deserializeSolution(content);
    if (!parsed.ok) {
      setTextModal({
        open: true,
        mode: "error",
        content,
        error: getDeserializeErrorMessage(parsed),
      });
      return;
    }

    dispatch(solutionReplaced(parsed.solution));
  };

  const handleCloseTextModal = () => {
    setTextModal(prev => ({ ...prev, open: false }));
  };

  const handleLoadFromText = () => {
    const parsed = deserializeSolution(textModal.content);
    if (!parsed.ok) {
      setTextModal(prev => ({
        ...prev,
        error: getDeserializeErrorMessage(parsed),
      }));
      return;
    }
    dispatch(solutionReplaced(parsed.solution));
    handleCloseTextModal();
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          data-testid="solution-menu-button"
          onClick={() => setMenuOpen(prev => !prev)}
          className="px-3 py-1.5 text-sm rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 flex items-center gap-2"
        >
          <span>Actions</span>
          <svg
            aria-label="Toggle menu"
            className={`w-4 h-4 transition-transform ${menuOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute top-full left-0 mt-1 w-56 rounded-md border border-zinc-700 bg-zinc-800 shadow-lg z-50 py-1">
            <button
              type="button"
              data-testid="solution-menu-download-json"
              onClick={handleDownload}
              className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2"
            >
              <svg aria-label="Download" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t("solutionSL.downloadJson")}
            </button>

            <button
              type="button"
              data-testid="solution-menu-open-text-modal"
              onClick={handleOpenTextModal}
              className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2"
            >
              <svg aria-label="Text" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t("solutionSL.exportToText")}
            </button>

            <div className="my-1 border-t border-zinc-700" />

            <button
              type="button"
              data-testid="solution-menu-save-browser"
              onClick={handleSaveToBrowser}
              className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2"
            >
              <svg aria-label="Save" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t("solutionSL.saveToBrowser")}
            </button>

            <button
              type="button"
              data-testid="solution-menu-upload-json-replace"
              onClick={() => handleUploadClick("replace")}
              className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2"
            >
              <svg aria-label="Upload" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {t("solutionSL.uploadJson")} ({t("common.replace")})
            </button>

            <button
              type="button"
              data-testid="solution-menu-upload-json-new"
              onClick={() => handleUploadClick("new")}
              className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2"
            >
              <svg aria-label="Upload new" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {t("solutionSL.uploadJson")} ({t("common.newTab")})
            </button>

            <button
              type="button"
              data-testid="solution-menu-load-browser-replace"
              onClick={() => handleLoadFromBrowser("replace")}
              className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2"
            >
              <svg aria-label="Load" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t("solutionSL.loadFromBrowser")} ({t("common.replace")})
            </button>

            <button
              type="button"
              data-testid="solution-menu-load-browser-new"
              onClick={() => handleLoadFromBrowser("new")}
              className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2"
            >
              <svg aria-label="Load new" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t("solutionSL.loadFromBrowser")} ({t("common.newTab")})
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        data-testid="solution-menu-file-input"
        type="file"
        accept="application/json"
        onChange={handleFileChosen}
        className="hidden"
      />

      {textModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-2xl rounded-lg border border-zinc-700 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {textModal.mode === "export"
                  ? t("solutionSL.exportToText")
                  : t("solutionSL.errorPrefix")}
              </h3>
              <button
                type="button"
                onClick={handleCloseTextModal}
                className="rounded p-1 hover:bg-zinc-800"
              >
                <svg aria-label="Close" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {textModal.error && (
              <div className="mb-3 rounded border border-red-900/50 bg-red-950/50 p-3 text-sm text-red-300">
                {textModal.error}
              </div>
            )}

            <textarea
              className="w-full h-64 rounded border border-zinc-700 bg-black/40 p-3 text-xs leading-5 font-mono"
              placeholder={t("solutionSL.textareaPlaceholder")}
              value={textModal.content}
              onChange={e =>
                setTextModal(prev => ({ ...prev, content: e.target.value }))
              }
            />

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseTextModal}
                className="px-3 py-1.5 text-sm rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
              >
                {t("operatorTabs.common.close")}
              </button>
              {textModal.mode === "export" && (
                <button
                  type="button"
                  onClick={handleLoadFromText}
                  disabled={!textModal.content.trim()}
                  className="px-3 py-1.5 text-sm rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50"
                >
                  {t("solutionSL.loadFromText")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

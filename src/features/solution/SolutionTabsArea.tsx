import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectActiveSolutionId,
  selectSolutionTabs,
  selectSolution,
} from "./selectors";
import {
  workspaceTabNew,
  workspaceTabSetActive,
  workspaceTabClose,
  workspaceTabOpened,
  solutionReplaced,
} from "./solutionSlice";
import {
  deserializeSolution,
  serializeSolution,
  type DeserializeSolutionError,
} from "./solutionSL";

const STORAGE_KEY = "endfieldaxis.solution.v1";

type UploadMode = "replace" | "new";

type TextModalState =
  | { open: false }
  | { open: true; errorMessage: string; prefillContent: string };

function deriveNameFromFilename(filename: string): string | undefined {
  const base = filename.replace(/\.json$/i, "").trim();
  if (!base) return undefined;
  return base.slice(0, 24);
}

export default function SolutionTabsArea() {
  const { t } = useTranslation();
  const translate = t as unknown as (
    key: string,
    options?: Record<string, unknown>,
  ) => string;
  const dispatch = useAppDispatch();
  const tabs = useAppSelector(selectSolutionTabs);
  const activeId = useAppSelector(selectActiveSolutionId);
  const solution = useAppSelector(selectSolution);
  const canClose = tabs.length > 1;

  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>("replace");
  const [textModal, setTextModal] = useState<TextModalState>({ open: false });
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const getDeserializeErrorMessage = useCallback(
    (error: DeserializeSolutionError) => {
      return translate(`solutionSL.errors.${error.code}`, error.meta);
    },
    [translate],
  );

  const handleDownload = () => {
    setMenuOpen(false);
    const exported = serializeSolution(solution);
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
    // Minimal plumbing for Task 7 - just open modal with empty state
    setTextModal({
      open: true,
      errorMessage: "",
      prefillContent: "",
    });
  };

  const handleSaveToBrowser = () => {
    setMenuOpen(false);
    const exported = serializeSolution(solution);
    try {
      localStorage.setItem(STORAGE_KEY, exported);
    } catch {
      setTextModal({
        open: true,
        errorMessage: t("solutionSL.errors.failedWriteLocalStorage"),
        prefillContent: exported,
      });
    }
  };

  const handleLoadFromBrowserReplace = () => {
    setMenuOpen(false);
    let content: string | null = null;
    try {
      content = localStorage.getItem(STORAGE_KEY);
    } catch {
      setTextModal({
        open: true,
        errorMessage: t("solutionSL.errors.failedReadLocalStorage"),
        prefillContent: "",
      });
      return;
    }
    if (!content) {
      setTextModal({
        open: true,
        errorMessage: t("solutionSL.errors.noSavedSolutionLocalStorage"),
        prefillContent: "",
      });
      return;
    }
    const parsed = deserializeSolution(content);
    if (!parsed.ok) {
      setTextModal({
        open: true,
        errorMessage: getDeserializeErrorMessage(parsed),
        prefillContent: content,
      });
      return;
    }
    dispatch(solutionReplaced(parsed.solution));
  };

  const handleLoadFromBrowserNew = () => {
    setMenuOpen(false);
    let content: string | null = null;
    try {
      content = localStorage.getItem(STORAGE_KEY);
    } catch {
      setTextModal({
        open: true,
        errorMessage: t("solutionSL.errors.failedReadLocalStorage"),
        prefillContent: "",
      });
      return;
    }
    if (!content) {
      setTextModal({
        open: true,
        errorMessage: t("solutionSL.errors.noSavedSolutionLocalStorage"),
        prefillContent: "",
      });
      return;
    }
    const parsed = deserializeSolution(content);
    if (!parsed.ok) {
      setTextModal({
        open: true,
        errorMessage: getDeserializeErrorMessage(parsed),
        prefillContent: content,
      });
      return;
    }
    dispatch(workspaceTabOpened({ name: undefined, solution: parsed.solution }));
  };

  const triggerUpload = (mode: UploadMode) => {
    setUploadMode(mode);
    setMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async e => {
    const file = e.target.files?.[0];
    // Allow picking the same file twice in a row
    e.target.value = "";
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = deserializeSolution(content);
      if (!parsed.ok) {
        setTextModal({
          open: true,
          errorMessage: getDeserializeErrorMessage(parsed),
          prefillContent: content,
        });
        return;
      }
      if (uploadMode === "replace") {
        dispatch(solutionReplaced(parsed.solution));
      } else {
        const name = deriveNameFromFilename(file.name);
        dispatch(workspaceTabOpened({ name, solution: parsed.solution }));
      }
    } catch {
      setTextModal({
        open: true,
        errorMessage: t("solutionSL.errors.failedReadFile"),
        prefillContent: "",
      });
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-1">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeId;
          const displayName =
            tab.name.trim() ||
            t("workspace.defaultTabName", { index: index + 1 });

          return (
            <div
              key={tab.id}
              className={[
                "group flex max-w-[10rem] items-center gap-1.5 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
              ].join(" ")}
            >
              <button
                type="button"
                data-testid={`solution-tab-${tab.id}`}
                title={displayName}
                onClick={() => dispatch(workspaceTabSetActive({ id: tab.id }))}
                className={[
                  "flex flex-1 items-center truncate rounded-md px-2.5 py-1.5 text-left transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950",
                ].join(" ")}
              >
                <span className="truncate">{displayName}</span>
              </button>
              {canClose && (
                <button
                  type="button"
                  data-testid={`solution-tab-close-${tab.id}`}
                  onClick={() => dispatch(workspaceTabClose({ id: tab.id }))}
                  className={[
                    "mr-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-zinc-500 transition-colors",
                    "hover:bg-zinc-700 hover:text-zinc-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
                  ].join(" ")}
                  aria-label={t("common.close")}
                  title={t("common.close")}
                >
                  <span aria-hidden className="text-xs leading-none">
                    ×
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        data-testid="solution-tab-new"
        onClick={() => dispatch(workspaceTabNew())}
        className={[
          "ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors",
          "hover:bg-zinc-900 hover:text-zinc-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950",
        ].join(" ")}
        aria-label={t("common.new")}
        title={t("common.new")}
      >
        <span aria-hidden className="text-lg leading-none">
          +
        </span>
      </button>

      {/* Menu Button */}
      <div className="relative">
        <button
          ref={menuButtonRef}
          type="button"
          data-testid="solution-menu-button"
          onClick={() => setMenuOpen(v => !v)}
          className={[
            "ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors",
            menuOpen
              ? "bg-zinc-800 text-zinc-100"
              : "hover:bg-zinc-900 hover:text-zinc-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950",
          ].join(" ")}
          aria-label="Menu"
          title="Menu"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <span aria-hidden className="text-sm leading-none">
            ⋮
          </span>
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div
            ref={menuRef}
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] rounded-md border border-zinc-800 bg-zinc-950 py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              data-testid="solution-menu-download-json"
              onClick={handleDownload}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              {t("solutionSL.downloadJson")}
            </button>
            <button
              type="button"
              role="menuitem"
              data-testid="solution-menu-open-text-modal"
              onClick={handleOpenTextModal}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              {t("solutionSL.exportToText")}
            </button>
            <div className="my-1 h-px bg-zinc-800" />
            <button
              type="button"
              role="menuitem"
              data-testid="solution-menu-save-browser"
              onClick={handleSaveToBrowser}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              {t("solutionSL.saveToBrowser")}
            </button>
            <button
              type="button"
              role="menuitem"
              data-testid="solution-menu-load-browser-replace"
              onClick={handleLoadFromBrowserReplace}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              {t("solutionSL.loadFromBrowser")} ({t("common.replace")})
            </button>
            <button
              type="button"
              role="menuitem"
              data-testid="solution-menu-load-browser-new"
              onClick={handleLoadFromBrowserNew}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              {t("solutionSL.loadFromBrowser")} ({t("common.newTab")})
            </button>
            <div className="my-1 h-px bg-zinc-800" />
            <button
              type="button"
              role="menuitem"
              data-testid="solution-menu-upload-json-replace"
              onClick={() => triggerUpload("replace")}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              {t("solutionSL.uploadJson")} ({t("common.replace")})
            </button>
            <button
              type="button"
              role="menuitem"
              data-testid="solution-menu-upload-json-new"
              onClick={() => triggerUpload("new")}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              {t("solutionSL.uploadJson")} ({t("common.newTab")})
            </button>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        data-testid="solution-menu-file-input"
        className="hidden"
        type="file"
        accept="application/json"
        onChange={handleFileChange}
      />

      {textModal.open && (
        <button
          type="button"
          className="fixed inset-0 z-[100] flex cursor-default items-center justify-center bg-black/60 p-4"
          onClick={() => setTextModal({ open: false })}
          data-testid="solution-text-modal-backdrop"
        >
          <span
            role="dialog"
            aria-modal="true"
            className="w-full max-w-2xl rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setTextModal({ open: false });
              }
            }}
            data-testid="solution-text-modal"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100">
                {t("solutionSL.heading")}
              </h3>
              <button
                type="button"
                onClick={() => setTextModal({ open: false })}
                className="text-zinc-400 hover:text-zinc-200"
                aria-label={t("common.close")}
              >
                ×
              </button>
            </div>
            {textModal.errorMessage && (
              <div className="mb-3 text-xs text-red-300">
                {t("solutionSL.errorPrefix")} {textModal.errorMessage}
              </div>
            )}
            <textarea
              className="h-48 w-full rounded border border-zinc-700 bg-zinc-950 p-3 text-xs font-mono text-zinc-200"
              value={textModal.prefillContent}
              readOnly
              data-testid="solution-text-modal-textarea"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setTextModal({ open: false })}
                className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
              >
                {t("common.close")}
              </button>
            </div>
          </span>
        </button>
      )}
    </div>
  );
}

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import operatorsData from "../../data/operators";
import { getAvatarUrl } from "../../shared/imgRegistry/imgRegistry";
import { tOperatorName } from "../../i18n/content";
import { formatRestBonusLog } from "./formatRestBonusLog";
// import PreviewSlider from "../../shared/components/PreviewSlider";
import type { OperatorBuild } from "../../types/operator";
// import type { OperatorDef } from "../../data/operators/OperatorDef";
import { OperatorBuildTab, WeaponTab, GearsTab } from "./Tabs";
import { OperatorId } from "../../data/operators/OperatorDef";

function RestStatPreview({ build }: { build: OperatorBuild }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const rest = build.restStat;
  if (!rest) return null;

  const fmtInt = (n: number) => (Number.isFinite(n) ? Math.round(n) : 0);
  const fmtPct = (x: number) =>
    `${Math.round((Number.isFinite(x) ? x : 0) * 1000) / 10}%`;

  const atkIncRatio = rest.atkIncRatio ?? 0;
  const atkIncFlat = rest.atkIncFlat ?? 0;
  const attributeBonusRatio = rest.attributesBonusRatio ?? 0;
  // const outgoingIncMul = rest.damageBonusRatio?.outgoingIncMul ?? 0;

  return (
    <div className="mt-3 rounded border border-zinc-700 bg-zinc-950/40 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{t("operator.buildPreview")}</div>
        <button
          data-testid="rest-stat-toggle"
          type="button"
          className="text-[11px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
          onClick={() => setOpen(v => !v)}
          title={t("operator.showRestStatBreakdown")}
        >
          {open ? t("operator.hide") : t("operator.show")}
        </button>
      </div>

      {open && (
        <>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border border-zinc-800 bg-zinc-950 p-2">
              <div className="text-zinc-400">{t("operator.atk")}</div>
              <div className="mt-1">
                <span className="text-zinc-300">{t("operator.base")}</span>{" "}
                {fmtInt(rest.baseAtk)}
              </div>
              <div className="text-[11px] text-zinc-500">
                {t("operator.op")} {fmtInt(rest.operatorAttack)} + {t("operator.weapon")}{" "}
                {fmtInt(rest.weaponAttack)}
              </div>

              <div className="mt-1">
                <span className="text-zinc-300">{t("operator.final")}</span>{" "}
                {fmtInt(
                  fmtInt(rest.baseAtk * (1 + atkIncRatio) + atkIncFlat) *
                    (1 + attributeBonusRatio),
                )}
              </div>
            </div>

            <div className="rounded border border-zinc-800 bg-zinc-950 p-2">
              <div className="text-zinc-400">{t("operator.staticDamageBuckets")}</div>
              <div className="mt-1 flex flex-col gap-0.5">
                <div>
                  <span className="text-zinc-500">{t("operator.atIncRatio")}</span>{" "}
                  {fmtPct(atkIncRatio)}
                </div>
                <div>
                  <span className="text-zinc-500">{t("operator.atkIncFlat")}</span>{" "}
                  {fmtInt(atkIncFlat)}
                </div>
                {/* <div>
              <span className="text-zinc-500">outgoingIncMul</span>{" "}
               TODO {fmtPct(outgoingIncMul)} 
              {JSON.stringify(rest.dmgIncRatio)}
            </div> */}
              </div>
            </div>

            <div className="col-span-2 rounded border border-zinc-800 bg-zinc-950 p-2">
              <div className="text-zinc-400">{t("operator.attributes")}</div>
              <div className="mt-1 grid grid-cols-4 gap-2 text-[11px]">
                {Object.entries(rest.attributes ?? {}).map(([k, v]) => (
                  <div key={k} className="rounded bg-zinc-900/50 px-2 py-1">
                    <div className="text-zinc-500">{k}</div>
                    <div className="text-zinc-300">{fmtInt(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs text-zinc-400">
              {t("operator.contributorsRestStatLog")}
            </div>
            <div className="mt-1 max-h-56 overflow-auto rounded border border-zinc-800 bg-zinc-950 p-2">
              {rest.log?.length ? (
                <div className="space-y-1">
                  {rest.log.map(e => {
                    const logKey =
                      typeof e.log === "string"
                        ? e.log
                        : `${e.log.code}:${JSON.stringify(e.log.meta ?? {})}`;

                    return (
                      <div
                        key={`${e.source}:${e.bucket}:${logKey}`}
                        className="text-[11px] leading-4 text-zinc-300"
                      >
                      <span className="text-zinc-500">[{e.source}]</span>{" "}
                      <span className="text-zinc-400">{e.bucket}</span>{" "}
                      {e.addValue != null ? (
                        e.addValue > 2 ? ( // if less than 2 then treat it as percentage
                          //TODO maybe there is a better way to distinguish ratio and flat
                          <span className="text-zinc-200">
                            +{fmtInt(e.addValue)}
                          </span>
                        ) : (
                          <span className="text-zinc-200">
                            +{fmtPct(e.addValue)}
                          </span>
                        )
                      ) : null}
                      {e.log ? (
                        <span className="text-zinc-500">
                          {" "}
                          —{" "}
                          {formatRestBonusLog({
                            t,
                            language: i18n.language,
                            entry: e,
                          })}
                        </span>
                      ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[11px] text-zinc-500">{t("operator.noEntries")}</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type OperatorPickerProps = {
  currentId: OperatorId;
  teamOperatorIds: OperatorId[];
  onPick: (newId: OperatorId) => void;
  onClose: () => void;
};

// const operatorsData = operatorsJson as OperatorDef[];

function OperatorPicker({
  currentId,
  teamOperatorIds,
  onPick,
  onClose,
}: OperatorPickerProps) {
  const { t, i18n } = useTranslation();
  const operatorEntries = useMemo(
    () => {
      const collator = new Intl.Collator(i18n.language);

      return Object.values(operatorsData)
        .map(op => ({
          ...op,
          displayName: tOperatorName(t, op.id, op.name),
        }))
        .sort((a, b) => {
          const nameCmp = collator.compare(a.displayName, b.displayName);
          if (nameCmp !== 0) return nameCmp;
          return a.id.localeCompare(b.id);
        });
    },
    [i18n.language, t],
  );

  return (
    <div
      data-testid="operator-picker"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3 backdrop-blur-sm"
    >
      <div className="w-[560px] max-w-[95vw] rounded-xl border border-zinc-700/90 bg-zinc-900/95 p-3 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">
              {t("operator.operatorPicker")}
            </div>
            <div className="font-semibold text-zinc-100">{t("operator.selectOperator")}</div>
          </div>
          <button
            type="button"
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
            onClick={onClose}
          >
            {t("operator.close")}
          </button>
        </div>

        <div className="mt-3 max-h-[min(70vh,34rem)] overflow-y-auto pr-1 [scrollbar-color:rgb(82_82_91)_transparent] [scrollbar-width:thin]">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {operatorEntries.map(op => {
              const url = getAvatarUrl(op.avatar);
              const active = op.id === currentId;
              const displayName = op.displayName;

              const usedLane = teamOperatorIds.findIndex(id => id === op.id);
              const disabled = usedLane !== -1 && op.id !== currentId;

              return (
                <button
                  type="button"
                  key={op.id}
                  disabled={disabled}
                  className={
                    "group flex items-center gap-3 rounded-lg border p-2 text-left transition-colors " +
                    (active
                      ? "border-emerald-500/80 bg-emerald-900/20 "
                      : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-600 hover:bg-zinc-800/50 ") +
                    (disabled
                      ? "cursor-not-allowed border-zinc-800 opacity-40"
                      : "")
                  }
                  onClick={() => {
                    if (disabled) return;
                    onPick(op.id);
                  }}
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
                    {url ? (
                      <img
                        className="h-full w-full object-cover"
                        src={url}
                        alt={displayName}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-zinc-100">
                      {displayName}
                    </div>
                    <div className="truncate text-[11px] text-zinc-500">
                      {op.id}
                    </div>
                  </div>

                  {disabled && (
                    <div className="rounded bg-zinc-900/90 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      {t("operator.inLane", { lane: usedLane + 1 })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

type BuildTab = "operator" | "weapon" | "gears";

type Props = {
  laneIndex: number | null;
  operatorId: OperatorId | null;
  operatorBuild: OperatorBuild | null;
  teamOperatorIds: OperatorId[];
  controlledOperatorId: OperatorId;
  onCommitOperatorBuildPatch: (
    operatorId: OperatorId,
    patch: Partial<OperatorBuild>,
  ) => void;
  onChangeTeammateId: (laneIndex: number, newOpId: OperatorId) => void;
  onSetControlledOperator: (operatorId: OperatorId) => void;
  onClose: () => void;
};

export default function OperatorEditor({
  laneIndex,
  operatorId,
  operatorBuild,
  teamOperatorIds,
  controlledOperatorId,
  onCommitOperatorBuildPatch,
  onChangeTeammateId,
  onSetControlledOperator,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [isPicking, setIsPicking] = useState(false);
  const [page, setPage] = useState<BuildTab>("operator");

  const tabs: { key: BuildTab; label: string }[] = [
    { key: "operator", label: t("operator.tabOperator") },
    { key: "weapon", label: t("operator.tabWeapon") },
    { key: "gears", label: t("operator.tabGears") },
  ];

  const operator = useMemo(
    () => (operatorId ? operatorsData[operatorId] : null),
    [operatorId],
  );
  // const operator = operatorId
  //   ? useMemo(() => getOperator(operatorId), [operatorId])
  //   : null;

  if (operatorId === null) return null;
  if (!operator || !operatorBuild || laneIndex == null) {
    return (
      <div className="h-full p-4 border border-zinc-700 rounded bg-zinc-900">
        {t("operator.unknownOperator", { operatorId })}
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(operator.avatar);
  const operatorName = tOperatorName(t, operator.id, operator.name);
  const isControlled = operatorId === controlledOperatorId;

  return (
    <div
      data-testid="panel-operator"
      className="h-full p-4 border border-zinc-700 rounded bg-zinc-900"
    >
      {/* Tab Switching Buttons */}
      <div className="mt-4 flex gap-2">
        {tabs.map(t => (
          <button
            type="button"
            key={t.key}
            className={
              "text-xs px-3 py-1 rounded border " +
              (page === t.key
                ? "bg-zinc-800 border-zinc-500"
                : "bg-zinc-900 border-zinc-800 hover:border-zinc-600")
            }
            onClick={() => setPage(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{operatorName}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={
              "text-xs px-2 py-1 rounded border " +
              (isControlled
                ? "border-emerald-400/80 bg-emerald-700/30 text-emerald-100"
                : "border-zinc-700 bg-zinc-800 hover:bg-zinc-700")
            }
            onClick={() => onSetControlledOperator(operatorId)}
            disabled={isControlled}
          >
            {isControlled
              ? t("operator.controlled")
              : t("operator.setControlled")}
          </button>
          <button
            type="button"
            className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
            onClick={onClose}
          >
            {t("operator.close")}
          </button>
        </div>
      </div>

      <button
        type="button"
        data-testid="operator-change-button"
        className="mt-4 w-full rounded border border-zinc-700 hover:border-zinc-500 p-3 flex items-center gap-3"
        onClick={() => setIsPicking(true)}
        title={t("operator.clickToChangeOperator")}
      >
        <div className="w-16 h-16 rounded bg-zinc-800 overflow-hidden shrink-0">
          {avatarUrl ? (
            <img
              className="w-full h-full object-cover"
              src={avatarUrl}
              alt={operatorName}
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-xs text-zinc-400">
              {t("operator.noAvatar")}
            </div>
          )}
        </div>
        <div className="text-left">
          <div className="text-sm text-zinc-300">{t("operator.operator")}</div>
          <div className="text-base font-medium">{operatorName}</div>
          <div className="text-xs text-zinc-500">{t("operator.clickAvatarToChange")}</div>
        </div>
      </button>

      <RestStatPreview build={operatorBuild} />

      {page === "operator" && (
        <OperatorBuildTab
          operatorId={operatorId}
          build={operatorBuild}
          onCommit={onCommitOperatorBuildPatch}
        />
      )}
      {page === "weapon" && (
        <WeaponTab
          operatorId={operatorId}
          build={operatorBuild}
          onCommit={onCommitOperatorBuildPatch}
        />
      )}
      {page === "gears" && (
        <GearsTab
          operatorId={operatorId}
          build={operatorBuild}
          onCommit={onCommitOperatorBuildPatch}
        />
      )}

      {isPicking && (
        <OperatorPicker
          currentId={operatorId}
          teamOperatorIds={teamOperatorIds}
          onClose={() => setIsPicking(false)}
          onPick={newId => {
            onChangeTeammateId(laneIndex, newId);
            setIsPicking(false);
          }}
        />
      )}
    </div>
  );
}

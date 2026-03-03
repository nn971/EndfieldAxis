import { useMemo, useState } from "react";
import operatorsData from "../../data/operators";
import { getAvatarUrl } from "../../shared/imgRegistry/imgRegistry";
// import PreviewSlider from "../../shared/components/PreviewSlider";
import type { OperatorBuild } from "../../types/operator";
// import type { OperatorDef } from "../../data/operators/OperatorDef";
import { OperatorBuildTab, WeaponTab, GearsTab } from "./Tabs";
import { OperatorId } from "../../data/operators/OperatorDef";

function RestStatPreview({ build }: { build: OperatorBuild }) {
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
        <div className="text-sm font-semibold">Build preview</div>
        <button
          className="text-[11px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
          onClick={() => setOpen(v => !v)}
          title="Show restStat breakdown"
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border border-zinc-800 bg-zinc-950 p-2">
              <div className="text-zinc-400">ATK</div>
              <div className="mt-1">
                <span className="text-zinc-300">base</span>{" "}
                {fmtInt(rest.baseAtk)}
              </div>
              <div className="text-[11px] text-zinc-500">
                op {fmtInt(rest.operatorAttack)} + weapon{" "}
                {fmtInt(rest.weaponAttack)}
              </div>

              <div className="mt-1">
                <span className="text-zinc-300">final</span>{" "}
                {fmtInt(
                  fmtInt(rest.baseAtk * (1 + atkIncRatio) + atkIncFlat) *
                    (1 + attributeBonusRatio),
                )}
              </div>
            </div>

            <div className="rounded border border-zinc-800 bg-zinc-950 p-2">
              <div className="text-zinc-400">Static damage buckets</div>
              <div className="mt-1 flex flex-col gap-0.5">
                <div>
                  <span className="text-zinc-500">atIncRatio</span>{" "}
                  {fmtPct(atkIncRatio)}
                </div>
                <div>
                  <span className="text-zinc-500">atkIncFlat</span>{" "}
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
              <div className="text-zinc-400">Attributes</div>
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
              Contributors (restStat.log)
            </div>
            <div className="mt-1 max-h-56 overflow-auto rounded border border-zinc-800 bg-zinc-950 p-2">
              {rest.log?.length ? (
                <div className="space-y-1">
                  {rest.log.map((e, i) => (
                    <div
                      key={i}
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
                        <span className="text-zinc-500"> — {e.log}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-zinc-500">No entries.</div>
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
  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center z-50">
      <div className="w-[520px] max-w-[90vw] rounded-lg border border-zinc-700 bg-zinc-900 p-3">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="font-semibold">Select operator</div>
          <button
            className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          {Object.values(operatorsData).map(op => {
            const url = getAvatarUrl(op.avatar);
            const active = op.id === currentId;

            const usedLane = teamOperatorIds.findIndex(id => id === op.id);
            const disabled = usedLane !== -1 && op.id !== currentId;

            return (
              <button
                key={op.id}
                disabled={disabled}
                className={
                  "flex items-center gap-3 p-2 rounded border hover:bg-zinc-800/50 " +
                  (active
                    ? "border-zinc-500 bg-zinc-800/30 "
                    : "border-zinc-800 hover:border-zinc-600 ") +
                  (disabled
                    ? "opacity-40 cursor-not-allowed border-zinc-800"
                    : "hover:bg-zinc-800/50")
                }
                onClick={() => {
                  if (disabled) return;
                  onPick(op.id);
                }}
              >
                <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden shrink-0">
                  {url ? (
                    <img
                      className="w-full h-full object-cover"
                      src={url}
                      alt={op.name}
                    />
                  ) : null}
                </div>
                <div className="text-left">
                  <div className="text-sm">{op.name}</div>
                  <div className="text-xs text-zinc-500">{op.id}</div>
                </div>

                {disabled && (
                  <div className="text-[10px] text-zinc-400">
                    in lane {usedLane + 1}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type BuildTab = "operator" | "weapon" | "gears";
const tabs: { key: BuildTab; label: string }[] = [
  { key: "operator", label: "Operator" },
  { key: "weapon", label: "Weapon" },
  { key: "gears", label: "Gears" },
];

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
  const [isPicking, setIsPicking] = useState(false);
  const [page, setPage] = useState<BuildTab>("operator");

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
        Unknown operator: {operatorId}
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(operator.avatar);
  const isControlled = operatorId === controlledOperatorId;

  return (
    <div className="h-full p-4 border border-zinc-700 rounded bg-zinc-900">
      {/* Tab Switching Buttons */}
      <div className="mt-4 flex gap-2">
        {tabs.map(t => (
          <button
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
        <h2 className="text-lg font-semibold">{operator.name}</h2>
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
            {isControlled ? "Controlled" : "Set Controlled"}
          </button>
          <button
            className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      <button
        className="mt-4 w-full rounded border border-zinc-700 hover:border-zinc-500 p-3 flex items-center gap-3"
        onClick={() => setIsPicking(true)}
        title="Click to change operator"
      >
        <div className="w-16 h-16 rounded bg-zinc-800 overflow-hidden shrink-0">
          {avatarUrl ? (
            <img
              className="w-full h-full object-cover"
              src={avatarUrl}
              alt={operator.name}
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-xs text-zinc-400">
              No avatar
            </div>
          )}
        </div>
        <div className="text-left">
          <div className="text-sm text-zinc-300">Operator</div>
          <div className="text-base font-medium">{operator.name}</div>
          <div className="text-xs text-zinc-500">click avatar to change</div>
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

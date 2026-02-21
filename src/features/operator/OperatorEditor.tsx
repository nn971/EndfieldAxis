import { useMemo, useState } from "react";
import operatorsData from "../../data/operators";
import { getAvatarUrl } from "../../shared/registry/avatarRegistry";
// import PreviewSlider from "../../shared/components/PreviewSlider";
import type { OperatorBuild } from "../../types/operator";
// import type { OperatorDef } from "../../data/operators/OperatorDef";
import { OperatorBuildTab, WeaponTab, GearsTab } from "./Tabs";

type OperatorPickerProps = {
  currentId: string;
  teamOperatorIds: string[];
  onPick: (newId: string) => void;
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
  operatorId: string | null;
  operatorBuild: OperatorBuild | null;
  teamOperatorIds: string[];
  onCommitOperatorBuildPatch: (
    operatorId: string,
    patch: Partial<OperatorBuild>,
  ) => void;
  onChangeTeammateId: (laneIndex: number, newOpId: string) => void;
  onClose: () => void;
};

export default function OperatorEditor({
  laneIndex,
  operatorId,
  operatorBuild,
  teamOperatorIds,
  onCommitOperatorBuildPatch,
  onChangeTeammateId,
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
        <button
          className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
          onClick={onClose}
        >
          Close
        </button>
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

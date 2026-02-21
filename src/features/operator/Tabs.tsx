import { useMemo, useState } from "react";
import { OperatorBuild } from "../../types/operator";
import PreviewSlider from "../../shared/components/PreviewSlider";
import weaponsData from "../../data/weapons";
import placeholderUrl from "../../assets/default/placeholder.jpg";
import { WeaponId, WeaponType } from "../../data/weapons/WeaponDef";
import operatorsData from "../../data/operators";
import { OperatorId } from "../../data/operators/OperatorDef";

type TabProps = {
  operatorId: OperatorId;
  build: OperatorBuild;
  onCommit: (operatorId: OperatorId, patch: Partial<OperatorBuild>) => void;
};

export function OperatorBuildTab({ operatorId, build, onCommit }: TabProps) {
  return (
    <div>
      <PreviewSlider
        label="Level"
        min={1}
        max={90}
        value={build.level}
        onCommit={v => onCommit(operatorId, { level: v })}
      />

      <PreviewSlider
        label="Potential"
        min={0}
        max={5}
        value={build.potentialRank}
        onCommit={v => onCommit(operatorId, { potentialRank: v })}
      />

      <PreviewSlider
        label="Talent1"
        min={0}
        max={2}
        value={build.talentRanks.talent1}
        onCommit={v =>
          onCommit(operatorId, {
            talentRanks: { ...build.talentRanks, talent1: v },
          })
        }
      />

      <PreviewSlider
        label="Talent2"
        min={0}
        max={2}
        value={build.talentRanks.talent2}
        onCommit={v =>
          onCommit(operatorId, {
            talentRanks: { ...build.talentRanks, talent2: v },
          })
        }
      />
    </div>
  );
}

export function WeaponTab({ operatorId, build, onCommit }: TabProps) {
  const [isPicking, setIsPicking] = useState(false);

  const weapon = useMemo(
    () => (build.weapon ? weaponsData[build.weapon.id] : null),
    [build.weapon?.id],
  );

  if (!build.weapon || !build.weapon.id) {
    return (
      <div className="text-sm text-zinc-500">
        No weapon selected.
        <button
          className="ml-2 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
          onClick={() => setIsPicking(true)}
        >
          Select Weapon
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mt-3 text-xs text-zinc-400">Selected weapon</div>
      <button
        className="mt-2 w-full rounded border border-zinc-700 hover:border-zinc-500 p-3 flex items-center gap-3"
        onClick={() => setIsPicking(true)}
        title="Click to change weapon"
      >
        <div className="w-16 h-16 rounded bg-zinc-800 overflow-hidden shrink-0">
          <img
            className="w-full h-full object-cover"
            src={placeholderUrl}
            alt={weapon?.name ?? "Weapon"}
          />
        </div>
        <div className="text-left">
          <div className="text-sm text-zinc-300">Weapon</div>
          <div className="text-base font-medium">
            {weapon?.name ?? "Unknown weapon"}
          </div>
          <div className="text-xs text-zinc-500">{build.weapon.id}</div>
          <div className="text-xs text-zinc-500">click icon to change</div>
        </div>
      </button>

      <PreviewSlider
        label="Weapon Level"
        min={1}
        max={90}
        value={build.weapon.level}
        onCommit={v =>
          onCommit(operatorId, {
            weapon: {
              ...build.weapon,
              level: v,
            },
          })
        }
      />

      {isPicking && (
        <WeaponPicker
          weaponType={operatorsData[operatorId].weaponType}
          currentId={build.weapon.id}
          onClose={() => setIsPicking(false)}
          onPick={newId => {
            onCommit(operatorId, {
              weapon: {
                ...build.weapon,
                id: newId,
              },
            });
            setIsPicking(false);
          }}
        />
      )}
    </div>
  );
}

type WeaponPickerProps = {
  weaponType: WeaponType;
  currentId: WeaponId | null;
  onPick: (newId: WeaponId) => void;
  onClose: () => void;
};

function WeaponPicker({
  weaponType,
  currentId,
  onPick,
  onClose,
}: WeaponPickerProps) {
  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center z-50">
      <div className="w-[520px] max-w-[90vw] rounded-lg border border-zinc-700 bg-zinc-900 p-3">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="font-semibold">Select weapon</div>
          <button
            className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          {Object.values(weaponsData).map(w => {
            if (w.type != weaponType) return null;
            const active = w.id === currentId;
            return (
              <button
                key={w.id}
                className={
                  "flex items-center gap-3 p-2 rounded border hover:bg-zinc-800/50 " +
                  (active
                    ? "border-zinc-500 bg-zinc-800/30 "
                    : "border-zinc-800 hover:border-zinc-600 ")
                }
                onClick={() => onPick(w.id)}
              >
                <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden shrink-0">
                  <img
                    className="w-full h-full object-cover"
                    src={placeholderUrl}
                    alt={w.name}
                  />
                </div>
                <div className="text-left">
                  <div className="text-sm">{w.name}</div>
                  <div className="text-xs text-zinc-500">{w.id}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function GearsTab({ operatorId, build, onCommit }: TabProps) {
  return <div>Gears Page Placeholder</div>;
}

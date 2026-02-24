import { useMemo, useState } from "react";
import { OperatorBuild } from "../../types/operator";
import PreviewSlider from "../../shared/components/PreviewSlider";
import weaponsData from "../../data/weapons";
import placeholderUrl from "../../assets/default/placeholder.jpg";
import {
  BaseWeaponSkillId,
  ThirdWeaponSkillCat,
  WeaponDef,
  WeaponId,
  WeaponType,
} from "../../data/weapons/WeaponDef";
import operatorsData from "../../data/operators";
import { OperatorId } from "../../data/operators/OperatorDef";
import gearsData from "../../data/gears";
import { GearsId, GearsType, GearsTypeName } from "../../data/gears/GearsDef";
import {
  BASE_WEAPON_SKILL_LABEL,
  THIRD_WEAPON_SKILL_CAT_LABEL,
} from "../../data/weapons/WeaponDef";

type TabProps = {
  operatorId: OperatorId;
  build: OperatorBuild;
  onCommit: (operatorId: OperatorId, patch: Partial<OperatorBuild>) => void;
};

export function OperatorBuildTab({ operatorId, build, onCommit }: TabProps) {
  const setSkillRank = (
    skillType: "normalAttack" | "normalSkill" | "comboSkill" | "ultimate",
    rank: number,
  ) => {
    onCommit(operatorId, {
      skillRanks: {
        ...build.skillRanks,
        [skillType]: rank,
      },
    });
  };

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

      <PreviewSlider
        label="Trust Bonus Rank"
        min={0}
        max={4}
        value={build.trustRank}
        onCommit={v => onCommit(operatorId, { trustRank: v })}
      />

      <div className="mt-4 text-xs text-zinc-400">Skill ranks</div>
      <PreviewSlider
        label="Normal Attack Rank"
        min={1}
        max={12}
        value={build.skillRanks.normalAttack}
        onCommit={v => setSkillRank("normalAttack", v)}
      />
      <PreviewSlider
        label="Normal Skill Rank"
        min={1}
        max={12}
        value={build.skillRanks.normalSkill}
        onCommit={v => setSkillRank("normalSkill", v)}
      />
      <PreviewSlider
        label="Combo Skill Rank"
        min={1}
        max={12}
        value={build.skillRanks.comboSkill}
        onCommit={v => setSkillRank("comboSkill", v)}
      />
      <PreviewSlider
        label="Ultimate Rank"
        min={1}
        max={12}
        value={build.skillRanks.ultimate}
        onCommit={v => setSkillRank("ultimate", v)}
      />
    </div>
  );
}

export function WeaponTab({ operatorId, build, onCommit }: TabProps) {
  const weaponBuild = build.weapon;
  const [isPicking, setIsPicking] = useState(false);

  const weaponDef = useMemo(
    () => (weaponBuild?.id ? weaponsData[weaponBuild.id] : null),
    [weaponBuild?.id],
  );

  const weaponType = operatorsData[operatorId].weaponType;

  // if (!build.weapon) {
  //   return (
  //     <div className="text-sm text-zinc-500">
  //       No weapon equipped.
  //       <button
  //         className="ml-2 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
  //         onClick={() => setIsPicking(true)}
  //       >
  //         Select Weapon
  //       </button>
  //       {isPicking && (
  //         <WeaponPicker
  //           weaponType={weaponType}
  //           currentId={null}
  //           onClose={() => setIsPicking(false)}
  //           onPick={newId => {
  //             onCommit(operatorId, {
  //               weapon: {
  //                 id: newId,
  //                 level: 90,
  //                 skillRanks: {},
  //               },
  //             });
  //             setIsPicking(false);
  //           }}
  //           onClear={() => setIsPicking(false)}
  //         />
  //       )}
  //     </div>
  //   );
  // }

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
            alt={weaponDef?.name ?? "No Weapon"}
          />
        </div>
        <div className="text-left">
          <div className="text-sm text-zinc-300">Weapon</div>
          <div className="text-base font-medium">
            {weaponDef?.name ?? "None"}
          </div>
          <div className="text-xs text-zinc-500">
            {weaponBuild?.id ?? "no weapon equipped"}
          </div>
          <div className="text-xs text-zinc-500">click icon to change</div>
        </div>
      </button>

      {weaponDef && weaponBuild && (
        <div className="mt-4">
          <PreviewSlider
            label="Weapon Level"
            min={1}
            max={90}
            value={weaponBuild.level}
            onCommit={v =>
              onCommit(operatorId, {
                weapon: {
                  ...weaponBuild,
                  level: v,
                },
              })
            }
          />
          <div className="text-xs text-zinc-400">Weapon skills</div>
          {["s1", "s2", "s3"].map(n => {
            const spec = weaponDef[n as keyof WeaponDef];
            if (spec == null) return null;
            const skillId = (spec as { id: WeaponId }).id;
            const skillName =
              n === "s3"
                ? `${THIRD_WEAPON_SKILL_CAT_LABEL[(spec as { id: string; cat: ThirdWeaponSkillCat; name: string }).cat]}: ${(spec as { id: string; cat: string; name: string }).name}`
                : `${BASE_WEAPON_SKILL_LABEL[skillId as BaseWeaponSkillId]} ${(spec as { id: BaseWeaponSkillId; size: string }).size}`;
            return (
              <PreviewSlider
                key={skillId}
                label={`${skillName} Rank`}
                min={1}
                max={9}
                value={weaponBuild.skillRanks[n as "s1" | "s2" | "s3"]}
                onCommit={v =>
                  onCommit(operatorId, {
                    weapon: {
                      ...build.weapon!,
                      skillRanks: {
                        ...build.weapon!.skillRanks,
                        [n]: v,
                      },
                    },
                  })
                }
              />
            );
          })}
        </div>
      )}

      {isPicking && (
        <WeaponPicker
          weaponType={weaponType}
          currentId={weaponBuild?.id ?? null}
          onClose={() => setIsPicking(false)}
          onPick={newId => {
            onCommit(operatorId, {
              weapon: {
                id: newId,
                level: weaponBuild?.level ?? 90,
                skillRanks: weaponBuild?.skillRanks ?? {},
              },
            });
            setIsPicking(false);
          }}
          onClear={() => {
            onCommit(operatorId, {
              weapon: {
                id: null,
                level: 0,
                skillRanks: {
                  s1: 0,
                  s2: 0,
                  s3: 0,
                },
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
  onClear: () => void;
  onClose: () => void;
};

function WeaponPicker({
  weaponType,
  currentId,
  onPick,
  onClear,
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
          <button
            className={
              "flex items-center gap-3 p-2 rounded border hover:bg-zinc-800/50 " +
              (currentId == null
                ? "border-zinc-500 bg-zinc-800/30 "
                : "border-zinc-800 hover:border-zinc-600 ")
            }
            onClick={onClear}
          >
            <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden shrink-0 grid place-items-center text-xs text-zinc-300">
              —
            </div>
            <div className="text-left">
              <div className="text-sm">(none)</div>
              <div className="text-xs text-zinc-500">unequip</div>
            </div>
          </button>

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
  return (
    <div className="mt-2">
      <GearSlotEditor
        operatorId={operatorId}
        build={build}
        onCommit={onCommit}
        slotKey="armor"
        label="Armor"
        type="armor"
      />
      <GearSlotEditor
        operatorId={operatorId}
        build={build}
        onCommit={onCommit}
        slotKey="gloves"
        label="Gloves"
        type="gloves"
      />
      <GearSlotEditor
        operatorId={operatorId}
        build={build}
        onCommit={onCommit}
        slotKey="kit1"
        label="Kit 1"
        type="kit"
      />
      <GearSlotEditor
        operatorId={operatorId}
        build={build}
        onCommit={onCommit}
        slotKey="kit2"
        label="Kit 2"
        type="kit"
      />
    </div>
  );
}

type GearSlotKey = "armor" | "gloves" | "kit1" | "kit2";

function GearSlotEditor({
  operatorId,
  build,
  onCommit,
  slotKey,
  label,
  type,
}: {
  operatorId: OperatorId;
  build: OperatorBuild;
  onCommit: (operatorId: OperatorId, patch: Partial<OperatorBuild>) => void;
  slotKey: GearSlotKey;
  label: string;
  type: GearsType;
}) {
  const [isPicking, setIsPicking] = useState(false);
  const slot = build.gears[slotKey];
  const gear = slot.gearId ? gearsData[slot.gearId] : null;

  const bucketLabel = (b: string) => {
    const m: Record<string, string> = {
      baseAtk: "Base ATK",
      atkIncRatio: "ATK%",
      atkIncFlat: "ATK Flat",
      artsIntensity: "Arts Intensity",
      comboCooldownReduction: "Combo CD Reduction",
      ultimateGainEfficiency: "Ultimate Gain Efficiency",
      physicalDmgIncRatio: "Physical DMG%",
      ultimateDmgIncRatio: "Ultimate DMG%",
      strength: "Strength",
      agility: "Agility",
      intellect: "Intellect",
      will: "Will",
    };
    return m[b] ?? b;
  };

  return (
    <div className="mt-4 rounded border border-zinc-800 bg-zinc-950/30 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-zinc-500">{GearsTypeName[type]}</div>
      </div>

      <button
        className="mt-2 w-full rounded border border-zinc-700 hover:border-zinc-500 p-3 flex items-center gap-3"
        onClick={() => setIsPicking(true)}
        title="Click to select gear"
      >
        <div className="w-16 h-16 rounded bg-zinc-800 overflow-hidden shrink-0">
          <img
            className="w-full h-full object-cover"
            src={placeholderUrl}
            alt={gear?.name ?? "Gear"}
          />
        </div>
        <div className="text-left">
          <div className="text-sm text-zinc-300">Gear</div>
          <div className="text-base font-medium">{gear?.name ?? "(none)"}</div>
          <div className="text-xs text-zinc-500">
            {slot.gearId ?? "no gear equipped"}
          </div>
          <div className="text-xs text-zinc-500">click icon to change</div>
        </div>
      </button>

      {slot.gearId ? (
        <div className="mt-2">
          {gear && (
            <div className="mb-1 text-[11px] text-zinc-500">
              Bonuses: {bucketLabel(gear.bonusBuckets.s1)} /{" "}
              {bucketLabel(gear.bonusBuckets.s2)} /{" "}
              {bucketLabel(gear.bonusBuckets.s3)}
            </div>
          )}
          <PreviewSlider
            label={`S1 ${gear ? `(${bucketLabel(gear.bonusBuckets.s1)})` : ""} — bonus +${
              gear ? (gear.bonusValuesByRank.s1[slot.ranks[0]] ?? 0) : 0
            }`}
            min={0}
            max={3}
            value={slot.ranks[0]}
            onCommit={v => {
              const next: [number, number, number] = [
                v,
                slot.ranks[1],
                slot.ranks[2],
              ];
              onCommit(operatorId, {
                gears: { ...build.gears, [slotKey]: { ...slot, ranks: next } },
              });
            }}
          />
          <PreviewSlider
            label={`S2 ${gear ? `(${bucketLabel(gear.bonusBuckets.s2)})` : ""} — bonus +${
              gear ? (gear.bonusValuesByRank.s2[slot.ranks[1]] ?? 0) : 0
            }`}
            min={0}
            max={3}
            value={slot.ranks[1]}
            onCommit={v => {
              const next: [number, number, number] = [
                slot.ranks[0],
                v,
                slot.ranks[2],
              ];
              onCommit(operatorId, {
                gears: { ...build.gears, [slotKey]: { ...slot, ranks: next } },
              });
            }}
          />
          <PreviewSlider
            label={`S3 ${gear ? `(${bucketLabel(gear.bonusBuckets.s3)})` : ""} — bonus +${
              gear ? (gear.bonusValuesByRank.s3[slot.ranks[2]] ?? 0) : 0
            }`}
            min={0}
            max={3}
            value={slot.ranks[2]}
            onCommit={v => {
              const next: [number, number, number] = [
                slot.ranks[0],
                slot.ranks[1],
                v,
              ];
              onCommit(operatorId, {
                gears: { ...build.gears, [slotKey]: { ...slot, ranks: next } },
              });
            }}
          />
        </div>
      ) : (
        <div className="mt-2 text-xs text-zinc-500">
          Equip a {GearsTypeName[type].toLowerCase()} to edit artificing ranks.
        </div>
      )}

      {isPicking && (
        <GearPicker
          type={type}
          currentId={slot.gearId}
          onClose={() => setIsPicking(false)}
          onPick={newId => {
            onCommit(operatorId, {
              gears: {
                ...build.gears,
                [slotKey]: {
                  gearId: newId,
                  ranks: slot.gearId ? slot.ranks : [0, 0, 0],
                },
              },
            });
            setIsPicking(false);
          }}
          onClear={() => {
            onCommit(operatorId, {
              gears: {
                ...build.gears,
                [slotKey]: { gearId: null, ranks: [0, 0, 0] },
              },
            });
            setIsPicking(false);
          }}
        />
      )}
    </div>
  );
}

type GearPickerProps = {
  type: GearsType;
  currentId: GearsId | null;
  onPick: (newId: GearsId) => void;
  onClear: () => void;
  onClose: () => void;
};

function GearPicker({
  type,
  currentId,
  onPick,
  onClear,
  onClose,
}: GearPickerProps) {
  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center z-50">
      <div className="w-[520px] max-w-[90vw] rounded-lg border border-zinc-700 bg-zinc-900 p-3">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="font-semibold">Select {GearsTypeName[type]}</div>
          <button
            className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            className={
              "flex items-center gap-3 p-2 rounded border hover:bg-zinc-800/50 " +
              (currentId == null
                ? "border-zinc-500 bg-zinc-800/30 "
                : "border-zinc-800 hover:border-zinc-600 ")
            }
            onClick={onClear}
          >
            <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden shrink-0 grid place-items-center text-xs text-zinc-300">
              —
            </div>
            <div className="text-left">
              <div className="text-sm">(none)</div>
              <div className="text-xs text-zinc-500">unequip</div>
            </div>
          </button>

          {Object.values(gearsData).map(g => {
            if (g.type !== type) return null;
            const active = g.id === currentId;
            return (
              <button
                key={g.id}
                className={
                  "flex items-center gap-3 p-2 rounded border hover:bg-zinc-800/50 " +
                  (active
                    ? "border-zinc-500 bg-zinc-800/30 "
                    : "border-zinc-800 hover:border-zinc-600 ")
                }
                onClick={() => onPick(g.id)}
              >
                <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden shrink-0">
                  <img
                    className="w-full h-full object-cover"
                    src={placeholderUrl}
                    alt={g.name}
                  />
                </div>
                <div className="text-left">
                  <div className="text-sm">{g.name}</div>
                  <div className="text-xs text-zinc-500">{g.id}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

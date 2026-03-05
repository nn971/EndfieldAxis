import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
import gearsData, { gearsSetData } from "../../data/gears";
import { GearsId, GearsType } from "../../data/gears/GearsDef";
import {
  BASE_WEAPON_SKILL_LABEL,
  THIRD_WEAPON_SKILL_CAT_LABEL,
} from "../../data/weapons/WeaponDef";

type TabProps = {
  operatorId: OperatorId;
  build: OperatorBuild;
  onCommit: (operatorId: OperatorId, patch: Partial<OperatorBuild>) => void;
};

const gearSetNamesById = Object.values(gearsSetData).reduce(
  (acc, set) => {
    for (const gearId of set.gearIds) {
      if (!acc[gearId]) acc[gearId] = [];
      acc[gearId].push(set.name);
    }
    return acc;
  },
  {} as Record<GearsId, string[]>,
);

export function OperatorBuildTab({ operatorId, build, onCommit }: TabProps) {
  const { t } = useTranslation();

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
        label={t("operatorTabs.build.level")}
        min={1}
        max={90}
        value={build.level}
        onCommit={v => onCommit(operatorId, { level: v })}
      />

      <PreviewSlider
        label={t("operatorTabs.build.potential")}
        min={0}
        max={5}
        value={build.potentialRank}
        onCommit={v => onCommit(operatorId, { potentialRank: v })}
      />

      <PreviewSlider
        label={t("operatorTabs.build.talent1")}
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
        label={t("operatorTabs.build.talent2")}
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
        label={t("operatorTabs.build.trustBonusRank")}
        min={0}
        max={4}
        value={build.trustRank}
        onCommit={v => onCommit(operatorId, { trustRank: v })}
      />

      <div className="mt-4 text-xs text-zinc-400">
        {t("operatorTabs.build.skillRanks")}
      </div>
      <PreviewSlider
        label={t("operatorTabs.build.normalAttackRank")}
        min={1}
        max={12}
        value={build.skillRanks.normalAttack}
        onCommit={v => setSkillRank("normalAttack", v)}
      />
      <PreviewSlider
        label={t("operatorTabs.build.normalSkillRank")}
        min={1}
        max={12}
        value={build.skillRanks.normalSkill}
        onCommit={v => setSkillRank("normalSkill", v)}
      />
      <PreviewSlider
        label={t("operatorTabs.build.comboSkillRank")}
        min={1}
        max={12}
        value={build.skillRanks.comboSkill}
        onCommit={v => setSkillRank("comboSkill", v)}
      />
      <PreviewSlider
        label={t("operatorTabs.build.ultimateRank")}
        min={1}
        max={12}
        value={build.skillRanks.ultimate}
        onCommit={v => setSkillRank("ultimate", v)}
      />
    </div>
  );
}

export function WeaponTab({ operatorId, build, onCommit }: TabProps) {
  const { t } = useTranslation();
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
      <div className="mt-3 text-xs text-zinc-400">
        {t("operatorTabs.weapon.selectedWeapon")}
      </div>
      <button
        type="button"
        className="mt-2 w-full rounded border border-zinc-700 hover:border-zinc-500 p-3 flex items-center gap-3"
        onClick={() => setIsPicking(true)}
        title={t("operatorTabs.weapon.changeWeaponTitle")}
      >
        <div className="w-16 h-16 rounded bg-zinc-800 overflow-hidden shrink-0">
          <img
            className="w-full h-full object-cover"
            src={placeholderUrl}
            alt={weaponDef?.name ?? t("operatorTabs.weapon.noWeapon")}
          />
        </div>
        <div className="text-left">
          <div className="text-sm text-zinc-300">{t("operatorTabs.weapon.tab")}</div>
          <div className="text-base font-medium">
            {weaponDef?.name ?? t("operatorTabs.weapon.none")}
          </div>
          <div className="text-xs text-zinc-500">
            {weaponBuild?.id ?? t("operatorTabs.weapon.noWeaponEquipped")}
          </div>
          <div className="text-xs text-zinc-500">
            {t("operatorTabs.weapon.clickIconToChange")}
          </div>
        </div>
      </button>

      {weaponDef && weaponBuild && (
        <div className="mt-4">
          <PreviewSlider
            label={t("operatorTabs.weapon.weaponLevel")}
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
          <div className="text-xs text-zinc-400">
            {t("operatorTabs.weapon.weaponSkills")}
          </div>
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
                label={t("operatorTabs.weapon.skillRankLabel", { skillName })}
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
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3 backdrop-blur-sm">
      <div className="w-[560px] max-w-[95vw] rounded-xl border border-zinc-700/90 bg-zinc-900/95 p-3 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">
              {t("operatorTabs.weapon.picker.title")}
            </div>
            <div className="font-semibold text-zinc-100">
              {t("operatorTabs.weapon.picker.selectWeapon")}
            </div>
          </div>
          <button
            type="button"
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
            onClick={onClose}
          >
            {t("operatorTabs.common.close")}
          </button>
        </div>

        <div className="mt-3 max-h-[min(70vh,34rem)] overflow-y-auto pr-1 [scrollbar-color:rgb(82_82_91)_transparent] [scrollbar-width:thin]">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              className={
                "flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-2 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-800/50 " +
                (currentId == null
                  ? "border-emerald-500/80 bg-emerald-900/20 "
                  : "")
              }
              onClick={onClear}
            >
              <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden shrink-0 grid place-items-center text-xs text-zinc-300">
                —
              </div>
              <div className="text-left">
                <div className="text-sm">{t("operatorTabs.common.none")}</div>
                <div className="text-xs text-zinc-500">
                  {t("operatorTabs.common.unequip")}
                </div>
              </div>
            </button>

            {Object.values(weaponsData).map(w => {
              if (w.type !== weaponType) return null;
              const active = w.id === currentId;
              return (
                <button
                  type="button"
                  key={w.id}
                  className={
                    "flex items-center gap-3 rounded-lg border p-2 text-left transition-colors " +
                    (active
                      ? "border-emerald-500/80 bg-emerald-900/20 "
                      : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-600 hover:bg-zinc-800/50 ")
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
    </div>
  );
}

export function GearsTab({ operatorId, build, onCommit }: TabProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-2">
      <GearSlotEditor
        operatorId={operatorId}
        build={build}
        onCommit={onCommit}
        slotKey="armor"
        label={t("operatorTabs.gears.armor")}
        type="armor"
      />
      <GearSlotEditor
        operatorId={operatorId}
        build={build}
        onCommit={onCommit}
        slotKey="gloves"
        label={t("operatorTabs.gears.gloves")}
        type="gloves"
      />
      <GearSlotEditor
        operatorId={operatorId}
        build={build}
        onCommit={onCommit}
        slotKey="kit1"
        label={t("operatorTabs.gears.kit1")}
        type="kit"
      />
      <GearSlotEditor
        operatorId={operatorId}
        build={build}
        onCommit={onCommit}
        slotKey="kit2"
        label={t("operatorTabs.gears.kit2")}
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
  const { t } = useTranslation();
  const [isPicking, setIsPicking] = useState(false);
  const slot = build.gears[slotKey];
  const gear = slot.gearId ? gearsData[slot.gearId] : null;

  const gearsTypeLabelByType: Record<GearsType, string> = {
    armor: t("operatorTabs.gearTypes.armor"),
    gloves: t("operatorTabs.gearTypes.gloves"),
    kit: t("operatorTabs.gearTypes.kit"),
  };
  const gearsTypeLabel = gearsTypeLabelByType[type];

  const bucketLabel = (b: string) => {
    const m: Record<string, string> = {
      baseAtk: t("operatorTabs.restStats.baseAtk"),
      atkIncRatio: t("operatorTabs.restStats.atkIncRatio"),
      atkIncFlat: t("operatorTabs.restStats.atkIncFlat"),
      artsIntensity: t("operatorTabs.restStats.artsIntensity"),
      comboCooldownReduction: t("operatorTabs.restStats.comboCooldownReduction"),
      ultimateGainEfficiency: t("operatorTabs.restStats.ultimateGainEfficiency"),
      physicalDmgIncRatio: t("operatorTabs.restStats.physicalDmgIncRatio"),
      ultimateDmgIncRatio: t("operatorTabs.restStats.ultimateDmgIncRatio"),
      strength: t("operatorTabs.restStats.strength"),
      agility: t("operatorTabs.restStats.agility"),
      intellect: t("operatorTabs.restStats.intellect"),
      will: t("operatorTabs.restStats.will"),
    };
    return m[b] ?? b;
  };

  return (
    <div className="mt-4 rounded border border-zinc-800 bg-zinc-950/30 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-zinc-500">{gearsTypeLabel}</div>
      </div>

      <button
        type="button"
        className="mt-2 w-full rounded border border-zinc-700 hover:border-zinc-500 p-3 flex items-center gap-3"
        onClick={() => setIsPicking(true)}
        title={t("operatorTabs.gears.clickToSelectGear")}
      >
        <div className="w-16 h-16 rounded bg-zinc-800 overflow-hidden shrink-0">
          <img
            className="w-full h-full object-cover"
            src={placeholderUrl}
            alt={gear?.name ?? t("operatorTabs.gears.gear")}
          />
        </div>
        <div className="text-left">
          <div className="text-sm text-zinc-300">{t("operatorTabs.gears.gear")}</div>
          <div className="text-base font-medium">
            {gear?.name ?? t("operatorTabs.common.none")}
          </div>
          <div className="text-xs text-zinc-500">
            {slot.gearId ?? t("operatorTabs.gears.noGearEquipped")}
          </div>
          <div className="text-xs text-zinc-500">
            {t("operatorTabs.gears.clickIconToChange")}
          </div>
        </div>
      </button>

      {slot.gearId ? (
        <div className="mt-2">
          {gear && (
            <div className="mb-1 text-[11px] text-zinc-500">
              {t("operatorTabs.gears.bonuses")} {bucketLabel(gear.bonusBuckets.s1)} /{" "}
              {bucketLabel(gear.bonusBuckets.s2)} / {bucketLabel(gear.bonusBuckets.s3)}
            </div>
          )}
          <PreviewSlider
            label={
              gear
                ? t("operatorTabs.gears.rankSliderLabelWithBucket", {
                    slot: t("operatorTabs.gears.slots.s1"),
                    bucket: bucketLabel(gear.bonusBuckets.s1),
                    bonus: gear.bonusValuesByRank.s1[slot.ranks[0]] ?? 0,
                  })
                : t("operatorTabs.gears.rankSliderLabel", {
                    slot: t("operatorTabs.gears.slots.s1"),
                    bonus: 0,
                  })
            }
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
            label={
              gear
                ? t("operatorTabs.gears.rankSliderLabelWithBucket", {
                    slot: t("operatorTabs.gears.slots.s2"),
                    bucket: bucketLabel(gear.bonusBuckets.s2),
                    bonus: gear.bonusValuesByRank.s2[slot.ranks[1]] ?? 0,
                  })
                : t("operatorTabs.gears.rankSliderLabel", {
                    slot: t("operatorTabs.gears.slots.s2"),
                    bonus: 0,
                  })
            }
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
            label={
              gear
                ? t("operatorTabs.gears.rankSliderLabelWithBucket", {
                    slot: t("operatorTabs.gears.slots.s3"),
                    bucket: bucketLabel(gear.bonusBuckets.s3),
                    bonus: gear.bonusValuesByRank.s3[slot.ranks[2]] ?? 0,
                  })
                : t("operatorTabs.gears.rankSliderLabel", {
                    slot: t("operatorTabs.gears.slots.s3"),
                    bonus: 0,
                  })
            }
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
          {t("operatorTabs.gears.equipPrompt", { type: gearsTypeLabel })}
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
  const { t } = useTranslation();

  const gearEntries = useMemo(
    () =>
      Object.values(gearsData)
        .filter(g => g.type === type)
        .map(gear => {
          const sortedSetNames = [...(gearSetNamesById[gear.id] ?? [])].sort(
            (a, b) => a.localeCompare(b),
          );

          return {
            gear,
            setLabel: sortedSetNames.length ? sortedSetNames.join(", ") : null,
            primarySetName: sortedSetNames[0] ?? t("operatorTabs.gears.noSet"),
          };
        })
        .sort((a, b) => {
          const aHasSet = a.setLabel != null;
          const bHasSet = b.setLabel != null;
          if (aHasSet !== bHasSet) return aHasSet ? -1 : 1;

          const setCmp = a.primarySetName.localeCompare(b.primarySetName);
          if (setCmp !== 0) return setCmp;

          const nameCmp = a.gear.name.localeCompare(b.gear.name);
          if (nameCmp !== 0) return nameCmp;

          return a.gear.id.localeCompare(b.gear.id);
        }),
    [t, type],
  );

  const gearsTypeLabelByType: Record<GearsType, string> = {
    armor: t("operatorTabs.gearTypes.armor"),
    gloves: t("operatorTabs.gearTypes.gloves"),
    kit: t("operatorTabs.gearTypes.kit"),
  };
  const gearsTypeLabel = gearsTypeLabelByType[type];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3 backdrop-blur-sm">
      <div className="w-[560px] max-w-[95vw] rounded-xl border border-zinc-700/90 bg-zinc-900/95 p-3 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">
              {t("operatorTabs.gears.picker.title")}
            </div>
            <div className="font-semibold text-zinc-100">
              {t("operatorTabs.gears.picker.selectGearType", {
                type: gearsTypeLabel,
              })}
            </div>
          </div>
          <button
            type="button"
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
            onClick={onClose}
          >
            {t("operatorTabs.common.close")}
          </button>
        </div>

        <div className="mt-3 max-h-[min(70vh,34rem)] overflow-y-auto pr-1 [scrollbar-color:rgb(82_82_91)_transparent] [scrollbar-width:thin]">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              className={
                "flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-2 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-800/50 " +
                (currentId == null
                  ? "border-emerald-500/80 bg-emerald-900/20 "
                  : "")
              }
              onClick={onClear}
            >
              <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden shrink-0 grid place-items-center text-xs text-zinc-300">
                —
              </div>
              <div className="text-left">
                <div className="text-sm">{t("operatorTabs.common.none")}</div>
                <div className="text-xs text-zinc-500">
                  {t("operatorTabs.common.unequip")}
                </div>
              </div>
            </button>

            {gearEntries.map((entry, index) => {
              const { gear } = entry;
              const active = gear.id === currentId;
              const prevGroup = gearEntries[index - 1]?.primarySetName;
              const showGroupHeader =
                index === 0 || entry.primarySetName !== prevGroup;

              return (
                <Fragment key={gear.id}>
                  {showGroupHeader && (
                    <div className="col-span-1 mt-1 rounded bg-zinc-950/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 sm:col-span-2">
                      {entry.primarySetName}
                    </div>
                  )}

                  <button
                    type="button"
                    className={
                      "flex items-center gap-3 rounded-lg border p-2 text-left transition-colors " +
                      (active
                        ? "border-emerald-500/80 bg-emerald-900/20 "
                        : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-600 hover:bg-zinc-800/50 ")
                    }
                    onClick={() => onPick(gear.id)}
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
                      <img
                        className="h-full w-full object-cover"
                        src={placeholderUrl}
                        alt={gear.name}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-zinc-100">
                        {gear.name}
                      </div>
                      <div className="truncate text-[11px] text-zinc-500">
                        {gear.id}
                      </div>
                      <div className="truncate text-[10px] text-zinc-400">
                        {entry.setLabel ?? t("operatorTabs.gears.noSetBonus")}
                      </div>
                    </div>
                  </button>
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

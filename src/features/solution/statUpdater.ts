import operatorsData from "../../data/operators";
import gearsData from "../../data/gears";
import weaponsData from "../../data/weapons";

import type { OperatorAttributeType } from "../../data/operators/OperatorDef";
import type {
  OperatorBuild,
  RestStatBonusEntry,
  RestStatSnapshot,
} from "../../types/operator";
import { getWeaponSkillRestBonuses } from "../../data/weapons/weaponSkillStats";

const MAX_LEVEL = 90;

function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  if (level < 1) return 1;
  if (level > MAX_LEVEL) return MAX_LEVEL;
  return level;
}

function interpolateLevelStat(
  level: number,
  lv1: number,
  lv90: number,
): number {
  const clamped = clampLevel(level);
  const t = (clamped - 1) / 89;
  const raw = lv1 + (lv90 - lv1) * t;
  return Math.max(0, Math.round(raw));
}

function makeZeroAttributes(): Record<OperatorAttributeType, number> {
  return {
    strength: 0,
    agility: 0,
    intellect: 0,
    will: 0,
  };
}

export function computeRestStat(build: OperatorBuild): RestStatSnapshot {
  const opDef = operatorsData[build.id];
  if (!opDef) {
    return {
      operatorAttack: 0,
      weaponAttack: 0,
      baseAtk: 0,
      attributes: makeZeroAttributes(),
      damageBonusRatio: {},
      damageBonusValue: {},
      log: [],
    };
  }

  const log: RestStatBonusEntry[] = [];

  // ---- Level scaling (operator base) ----
  const operatorAttack = interpolateLevelStat(
    build.level,
    opDef.stats.level1.attack,
    opDef.stats.level90.attack,
  );

  log.push({
    source: "level",
    sourceId: build.id,
    bucket: "baseAtk",
    addValue: operatorAttack,
    note: `Operator base ATK (lv ${clampLevel(build.level)})`,
  });

  const attributes = makeZeroAttributes();
  for (const attr of Object.keys(attributes) as OperatorAttributeType[]) {
    const v = interpolateLevelStat(
      build.level,
      (opDef.stats.level1 as any)[attr] ?? 0,
      (opDef.stats.level90 as any)[attr] ?? 0,
    );
    attributes[attr] += v;
    if (v !== 0) {
      log.push({
        source: "level",
        sourceId: build.id,
        bucket: attr,
        addValue: v,
        note: `Operator base ${attr} (lv ${clampLevel(build.level)})`,
      });
    }
  }

  // ---- Weapon attack scaling + weapon skills rest bonuses ----
  let weaponAttack = 0;
  if (build.weapon?.id != null) {
    const wDef = weaponsData[build.weapon.id];
    if (wDef) {
      weaponAttack = interpolateLevelStat(
        build.weapon.level,
        wDef.atkStat.level1,
        wDef.atkStat.level90,
      );
      log.push({
        source: "weapon",
        sourceId: build.weapon.id,
        bucket: "baseAtk",
        addValue: weaponAttack,
        note: `Weapon ATK (lv ${clampLevel(build.weapon.level)})`,
      });

      const skillIds: string[] = [wDef.skills[1], wDef.skills[2]];
      if (wDef.skills[3]?.id) skillIds.push(wDef.skills[3].id);

      for (const skillId of skillIds) {
        const rank = Math.max(
          1,
          Math.min(9, Number(build.weapon.skillRanks?.[skillId] ?? 1)),
        );
        const deltas = getWeaponSkillRestBonuses(skillId, rank);

        for (const d of deltas) {
          if (d.attributes) {
            for (const [k, v] of Object.entries(d.attributes) as Array<
              [OperatorAttributeType, number]
            >) {
              if (!Number.isFinite(v) || v === 0) continue;
              attributes[k] += v;
              log.push({
                source: "weapon",
                sourceId: skillId,
                bucket: k,
                addValue: v,
                note: d.note ?? `Weapon skill ${skillId} (rank ${rank})`,
              });
            }
          }
          if (Number.isFinite(d.attackIncMul) && d.attackIncMul !== 0) {
            log.push({
              source: "weapon",
              sourceId: skillId,
              bucket: "attackIncMul",
              addRatio: d.attackIncMul,
              note: d.note ?? `Weapon skill ${skillId} (rank ${rank})`,
            });
          }
          if (Number.isFinite(d.attackIncValue) && d.attackIncValue !== 0) {
            log.push({
              source: "weapon",
              sourceId: skillId,
              bucket: "attackIncValue",
              addValue: d.attackIncValue,
              note: d.note ?? `Weapon skill ${skillId} (rank ${rank})`,
            });
          }
          if (Number.isFinite(d.outgoingIncMul) && d.outgoingIncMul !== 0) {
            log.push({
              source: "weapon",
              sourceId: skillId,
              bucket: "outgoingIncMul",
              addRatio: d.outgoingIncMul,
              note: d.note ?? `Weapon skill ${skillId} (rank ${rank})`,
            });
          }
        }
      }
    }
  }

  // ---- Gears (fixed attribute bonuses from def class) ----
  for (const [slotKey, slot] of Object.entries(build.gears)) {
    if (!slot.gearId) continue;
    const gDef = gearsData[slot.gearId];
    if (!gDef) continue;

    const mainType = gDef.attributes.main;
    const subType = gDef.attributes.sub;
    const mainAdd = gDef.getRestAttributeBonus(slot.ranks).main;
    const subAdd = gDef.getRestAttributeBonus(slot.ranks).sub;

    if (mainAdd !== 0) {
      attributes[mainType] += mainAdd;
      log.push({
        source: "gear",
        sourceId: gDef.id,
        bucket: mainType,
        addValue: mainAdd,
        note: `${gDef.name} (${slotKey}) main attr, ranks=${slot.ranks.join(",")}`,
      });
    }
    if (subAdd !== 0) {
      attributes[subType] += subAdd;
      log.push({
        source: "gear",
        sourceId: gDef.id,
        bucket: subType,
        addValue: subAdd,
        note: `${gDef.name} (${slotKey}) sub attr, ranks=${slot.ranks.join(",")}`,
      });
    }
  }

  // ---- Aggregate static damage buckets from build ----
  let attackIncMul = 0;
  let attackIncValue = 0;
  let outgoingIncMul = 0;

  for (const e of log) {
    if (e.bucket === "attackIncMul") attackIncMul += e.addRatio ?? 0;
    if (e.bucket === "attackIncValue") attackIncValue += e.addValue ?? 0;
    if (e.bucket === "outgoingIncMul") outgoingIncMul += e.addRatio ?? 0;
  }

  return {
    operatorAttack,
    weaponAttack,
    baseAtk: operatorAttack + weaponAttack,
    attributes,
    damageBonusRatio: { attackIncMul, outgoingIncMul },
    damageBonusValue: { attackIncValue },
    log,
  };
}

/** Update build.restStat in-place (immer-friendly). */
export function statUpdater(build: OperatorBuild): void {
  build.restStat = computeRestStat(build);
}

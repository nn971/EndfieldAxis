import operatorsData from "../../data/operators";
import gearsData from "../../data/gears";
import weaponsData from "../../data/weapons";

import type { OperatorAttributeType } from "../../data/operators/OperatorDef";
import type {
  OperatorBuild,
  RestBonusEntry,
  RestStatSnapshot,
} from "../../types/operator";
import { getWeaponSkillRestBonus } from "../../data/weapons/weaponSkillStats";
import { makeEmptyRestStat } from "./solutionSlice";
import { gearsSetData } from "../../data/gears";

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

function applyRestStatAddValue(
  snapshot: RestStatSnapshot,
  bucket: RestBonusEntry["bucket"],
  addValue: number,
): void {
  // Attributes
  if (bucket in snapshot.attributes) {
    snapshot.attributes[bucket as OperatorAttributeType] += addValue; // Only one of these two is nonzero
    return;
  }

  switch (bucket) {
    case "baseAtk": {
      // Keep it simple: treat any flat baseAtk bonus as additional operator base ATK.
      // (baseAtk is recomputed from operatorAttack + weaponAttack later)
      snapshot.operatorAttack += addValue;
      return;
    }
    case "atkIncRatio": {
      snapshot.atkIncRatio += addValue;
      return;
    }
    case "atkIncFlat": {
      snapshot.atkIncFlat += addValue;
      return;
    }
    case "artsIntensity": {
      snapshot.artsIntensity += addValue;
      return;
    }
    case "comboCooldownReduction": {
      snapshot.comboCooldownReduction += addValue;
      return;
    }
    case "ultimateGainEfficiency": {
      snapshot.ultimateGainEfficiency += addValue;
      return;
    }
    case "staggerEfficiency": {
      snapshot.staggerEfficiency += addValue;
      return;
    }
    case "physicalDmgIncRatio": {
      snapshot.dmgIncRatio.physical += addValue;
      return;
    }
    case "ultimateDmgIncRatio": {
      snapshot.ultimateDmgIncRatio += addValue;
      return;
    }
    default: {
      // Forward-compat: keep calculation alive even if UI adds new buckets.
      console.warn(
        `Unhandled rest stat bucket ${bucket} for addValue=${addValue}`,
      );
      return;
    }
  }
}

// function makeZeroAttributes(): Record<OperatorAttributeType, number> {
//   return {
//     strength: 0,
//     agility: 0,
//     intellect: 0,
//     will: 0,
//   };
// }

export function computeRestStat(build: OperatorBuild): RestStatSnapshot {
  const snapshot = makeEmptyRestStat();
  const opDef = operatorsData[build.id];
  if (!opDef) {
    return snapshot;
  }

  // ---- Level scaling (operator base) ----
  snapshot.operatorAttack = interpolateLevelStat(
    build.level,
    opDef.stats.level1.attack,
    opDef.stats.level90.attack,
  );

  snapshot.log.push({
    source: "level",
    bucket: "baseAtk",
    addValue: snapshot.operatorAttack,
    log: `Operator ${build.id} base ATK (lv ${clampLevel(build.level)})`,
  });

  for (const attr of Object.keys(
    snapshot.attributes,
  ) as OperatorAttributeType[]) {
    const v = interpolateLevelStat(
      build.level,
      (opDef.stats.level1 as any)[attr] ?? 0,
      (opDef.stats.level90 as any)[attr] ?? 0,
    );
    snapshot.attributes[attr] += v;
    if (v !== 0) {
      snapshot.log.push({
        source: "level",
        bucket: attr,
        addValue: v,
        log: `Operator ${build.id} base ${attr} (lv ${clampLevel(build.level)})`,
      });
    }
  }

  // ---- Trust rank (operator base) ----
  const TRUST_BONUS_MAPPING: Record<number, number> = {
    0: 0,
    1: 10,
    2: 25,
    3: 40,
    4: 60,
  };
  const trustBonus = TRUST_BONUS_MAPPING[build.trustRank] ?? 0;
  snapshot.attributes[opDef.attributes.main] += trustBonus;
  if (trustBonus !== 0) {
    snapshot.log.push({
      source: "trust",
      bucket: opDef.attributes.main,
      addValue: trustBonus,
      log: `Trust rank ${build.trustRank} (+${trustBonus} ${opDef.attributes.main})`,
    });
  }

  // Collect weapon-skill and gear rest-stat atoms first, then apply them in one pass.
  const weaponAndGearBonuses: RestBonusEntry[] = [];

  // ---- Weapon attack scaling + weapon skills rest bonuses ----
  if (build.weapon.id != null) {
    const wDef = weaponsData[build.weapon.id];
    if (wDef) {
      snapshot.weaponAttack = interpolateLevelStat(
        build.weapon.level,
        wDef.atkStat.level1,
        wDef.atkStat.level90,
      );
      snapshot.log.push({
        source: "weapon",
        bucket: "baseAtk",
        addValue: snapshot.weaponAttack,
        log: `Weapon ${build.weapon.id} base ATK (lv ${clampLevel(build.weapon.level)})`,
      });

      for (const k of ["s1", "s2", "s3"] as const) {
        const entry = getWeaponSkillRestBonus(
          build.weapon.id,
          k,
          build.weapon.skillRanks[k],
        );
        if (entry) weaponAndGearBonuses.push(entry);
      }
    }
  }

  // ---- Gears (artificing ranks -> static rest-stat buckets) ----
  for (const [slotKey, slot] of Object.entries(build.gears)) {
    if (!slot.gearId) continue;
    const gDef = gearsData[slot.gearId];
    if (!gDef) continue;

    weaponAndGearBonuses.push(
      ...gDef.getRestAttributeBonus(slot.ranks, slotKey),
    );
  }

  // ---- Gear set bonuses ----
  for (const set of Object.values(gearsSetData)) {
    const pieces = Object.values(build.gears).filter(
      slot => !!slot.gearId && set.gearIds.includes(slot.gearId),
    ).length;
    if (pieces < set.minPieces) continue;

    weaponAndGearBonuses.push(
      ...set.restBonuses.map(b => ({
        source: "gear" as const,
        bucket: b.bucket,
        addValue: b.addValue,
        log: b.log,
      })),
    );
  }

  for (const e of weaponAndGearBonuses) {
    if (!e.addValue) continue;
    applyRestStatAddValue(snapshot, e.bucket, e.addValue);
    snapshot.log.push(e);
  }

  // ---- Attribute bonus ratio ----
  const mainAttribute = opDef.attributes.main;
  const subAttribute = opDef.attributes.sub;
  snapshot.attributesBonusRatio =
    0.005 * snapshot.attributes[mainAttribute] +
    0.002 * snapshot.attributes[subAttribute];

  // ---- Update baseAtk ----
  snapshot.baseAtk = snapshot.operatorAttack + snapshot.weaponAttack;

  // ---- Aggregate static damage buckets from build ----

  // for (const e of log) {
  //   if (e.bucket === "atkIncRatio") attackIncMul += e.addRatio ?? 0;
  //   if (e.bucket === "attackIncValue") attackIncValue += e.addValue ?? 0;
  //   if (e.bucket === "outgoingIncMul") outgoingIncMul += e.addRatio ?? 0;
  // }

  return snapshot;
}

/** Update build.restStat in-place (immer-friendly). */
export function statUpdater(build: OperatorBuild): void {
  build.restStat = computeRestStat(build);
}

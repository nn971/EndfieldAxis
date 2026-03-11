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
import { defaultRoundingPolicy } from "../../simulator/damage/damageModel";

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
  return defaultRoundingPolicy.roundScaledStat(raw);
}

function applyRestStatAddValue(
  snapshot: RestStatSnapshot,
  bucket: RestBonusEntry["bucket"],
  addValue: number,
  // secondaryAttribute?: OperatorAttributeType,
): void {
  // Attributes
  if (bucket in snapshot.attributes) {
    snapshot.attributes[bucket as OperatorAttributeType] += addValue; // Only one of these two is nonzero
    return;
  }

  // if (bucket === "secondaryAttribute") {
  //   if (secondaryAttribute) {
  //     snapshot.attributes[secondaryAttribute] += addValue;
  //   }
  //   return;
  // }

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
    case "artsDmgIncRatio": {
      snapshot.dmgIncRatio.heat += addValue;
      snapshot.dmgIncRatio.electric += addValue;
      snapshot.dmgIncRatio.cryo += addValue;
      snapshot.dmgIncRatio.nature += addValue;
      return;
    }
    case "natureDmgIncRatio": {
      snapshot.dmgIncRatio.nature += addValue;
      return;
    }
    case "cryoDmgIncRatio": {
      snapshot.dmgIncRatio.cryo += addValue;
      return;
    }
    case "ultimateDmgIncRatio": {
      snapshot.ultimateDmgIncRatio += addValue;
      return;
    }
    case "criticalRate": {
      snapshot.criticalHitChance += addValue;
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
    log: {
      code: "operator_base_atk_level",
      meta: {
        operatorId: build.id,
        level: clampLevel(build.level),
      },
    },
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
        log: {
          code: "operator_attribute_level",
          meta: {
            operatorId: build.id,
            attribute: attr,
            level: clampLevel(build.level),
          },
        },
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
      log: {
        code: "trust_attribute_bonus",
        meta: {
          operatorId: build.id,
          attribute: opDef.attributes.main,
          rank: build.trustRank,
        },
      },
    });
  }

  // ---- potential ----
  const potentialAttributeBonus = opDef.getPotentialAttributeBonus(
    build.potentialRank,
  );
  for (const attr of Object.keys(
    potentialAttributeBonus,
  ) as OperatorAttributeType[]) {
    const addValue = potentialAttributeBonus[attr] ?? 0;
    if (!addValue) continue;

    snapshot.attributes[attr] += addValue;
    snapshot.log.push({
      source: "potential",
      bucket: attr,
      addValue,
      log: {
        code: "potential_attribute_bonus",
        meta: {
          operatorId: build.id,
          attribute: attr,
          rank: build.potentialRank,
        },
      },
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
        log: {
          code: "weapon_base_atk_level",
          meta: {
            weaponId: build.weapon.id,
            level: clampLevel(build.weapon.level),
          },
        },
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
        log: {
          code: "gear_set_bonus" as const,
          meta: {
            gearSetId: set.id,
            pieceCount: pieces,
            bucket: b.bucket,
          },
        },
      })),
    );
  }

  // ---- Attribute bonus ratio ----
  let mainAttributeBonusRatio = 0;
  let subAttributeBonusRatio = 0;
  for (const e of weaponAndGearBonuses) {
    if (!e.addValue) continue;
    if (e.bucket === "mainAttribute") {
      mainAttributeBonusRatio += e.addValue;
    } else if (e.bucket === "subAttribute") {
      subAttributeBonusRatio += e.addValue;
    } else {
      applyRestStatAddValue(snapshot, e.bucket, e.addValue);
    }
    snapshot.log.push(e);
  }
  const mainAttribute = opDef.attributes.main;
  snapshot.attributes[mainAttribute] *= 1 + mainAttributeBonusRatio;
  const subAttribute = opDef.attributes.sub;
  snapshot.attributes[subAttribute] *= 1 + subAttributeBonusRatio;
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

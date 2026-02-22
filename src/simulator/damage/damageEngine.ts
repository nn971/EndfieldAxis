import type {
  SimEntity,
  SimEntityId,
  SimEvent,
} from "../../types/simulator/simulator";
import type { DamageContext, DamageKind } from "./damageModel";
import {
  DamageBonusCollector,
  type DamageBonusSnapshot,
} from "./damageBonuses";
import type { SimRegistry } from "../listeners/registry";
import type { SimRead } from "../simulator";

/**
 * DamageEngine builds the DamageContext fed into DamageModel.
 * All conditional logic (buffs/talents) lives in SimRegistry listeners.
 */

function collectDamageBonuses(params: {
  registry: SimRegistry;
  read: SimRead;
  ev?: SimEvent;
  kind: DamageKind;
  sourceId: SimEntityId;
  targetId: SimEntityId;
}): DamageBonusSnapshot {
  const { registry, read, ev, kind, sourceId, targetId } = params;
  const collector = new DamageBonusCollector();

  const source = read.getEntity(sourceId);
  const target = read.getEntity(targetId);

  // Global listeners (system rules not tied to a particular buff)
  registry.runGlobalDamageBonus({
    read,
    ev,
    kind,
    sourceId,
    targetId,
    collector,
  });

  // Source buffs
  for (const buff of Object.values(source.buffs ?? {})) {
    if (!buff) continue;
    registry.runBuffDamageBonus({
      read,
      ev,
      kind,
      sourceId,
      targetId,
      collector,
      role: "source",
      buff,
    });
  }

  // Target buffs
  for (const buff of Object.values(target.buffs ?? {})) {
    if (!buff) continue;
    registry.runBuffDamageBonus({
      read,
      ev,
      kind,
      sourceId,
      targetId,
      collector,
      role: "target",
      buff,
    });
  }

  return collector.snapshot();
}

export function buildDamageContext(params: {
  registry: SimRegistry;
  read: SimRead;
  frame: number;
  kind: DamageKind;
  sourceId: SimEntityId;
  targetId: SimEntityId;
  dmgSkillMultiplier: number;
  /** Optional event for listeners to inspect (e.g. hit.skillType). */
  ev?: SimEvent;
  meta?: Record<string, unknown>;
}): DamageContext {
  let bonuses = collectDamageBonuses({
    registry: params.registry,
    read: params.read,
    ev: params.ev,
    kind: params.kind,
    sourceId: params.sourceId,
    targetId: params.targetId,
  });

  // Merge static build-derived buckets (weapon skills / gears / etc.).
  const sourceBuild = params.read.getBuild(params.sourceId);
  if (sourceBuild?.restStat) {
    const rs = sourceBuild.restStat;

    // Base attack bonuses
    if (Number.isFinite(rs.atkIncRatio) && rs.atkIncRatio !== 0) {
      bonuses.atkIncRatio += rs.atkIncRatio;
      bonuses.log.push({
        bucket: "atkIncRatio",
        addValue: rs.atkIncRatio,
        note: "restStat.atkIncRatio",
      });
    }
    if (Number.isFinite(rs.atkIncFlat) && rs.atkIncFlat !== 0) {
      bonuses.atkIncFlat += rs.atkIncFlat;
      bonuses.log.push({
        bucket: "atkIncFlat",
        addValue: rs.atkIncFlat,
        note: "restStat.atkIncFlat",
      });
    }

    // Damage increase bonuses
    // TODO Currently, normal hit damage is always kind="physical".
    if (params.kind === "physical") {
      const phys = Number(rs.dmgIncRatio?.physical ?? 0);
      if (Number.isFinite(phys) && phys !== 0) {
        bonuses.dmgIncRatio += phys;
        bonuses.log.push({
          bucket: "dmgIncRatio",
          addValue: phys,
          note: "restStat.dmgIncRatio.physical",
        });
      }

      // Extra ultimate damage bonus (if the hit is tagged as ultimate)
      const isUltimateHit =
        params.ev?.type === "hit" &&
        (params.ev as any)?.skillType === "ultimate";
      const ult = Number(rs.ultimateDmgIncRatio ?? 0);
      if (isUltimateHit && Number.isFinite(ult) && ult !== 0) {
        bonuses.dmgIncRatio += ult;
        bonuses.log.push({
          bucket: "dmgIncRatio",
          addValue: ult,
          note: "restStat.ultimateDmgIncRatio",
        });
      }
    }

    // TODO Special multiplier only applies to lift/crush damage kinds in DamageModel.
    if (params.kind === "lift" || params.kind === "crush") {
      const arts = Number(rs.artsIntensity ?? 0);
      if (Number.isFinite(arts) && arts !== 0) {
        bonuses.specialMul += arts;
        bonuses.log.push({
          bucket: "specialMul",
          addValue: arts,
          note: "restStat.artsIntensity",
        });
      }
    }

    // TODO Stagger efficiency (placeholder hook until staggered enemy logic is implemented)
    // const stag = Number(rs.staggerEfficiency ?? 0);
    // if (Number.isFinite(stag) && stag !== 0) {
    //   bonuses.staggerMul += stag;
    //   bonuses.log.push({
    //     bucket: "staggerMul",
    //     addValue: stag,
    //     note: "restStat.staggerEfficiency",
    //   });
    // }
  }

  const source = params.read.getEntity(params.sourceId);
  const target = params.read.getEntity(params.targetId);

  return {
    frame: params.frame,
    kind: params.kind,
    source: source as unknown as SimEntity,
    target: target as unknown as SimEntity,
    dmgSkillMultiplier: params.dmgSkillMultiplier,
    bonuses,
    sourceBuild,
    meta: params.meta,
  };
}
